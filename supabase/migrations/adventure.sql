-- =====================================================================
-- TaskRPG – Adventure-Mode: Supabase-Schema (EINMAL ausführen)
-- Voraussetzung: init.sql wurde bereits ausgeführt (profiles, characters,
-- friendships, task_completions ...).
-- Idempotent: kann gefahrlos erneut ausgeführt werden.
-- Enthält: Inventar, Wöchentlicher Boss (Community), Arena, Sonderquests,
--          Freundes-Quests + sichere RPCs + Realtime.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. INVENTAR (Artefakt-Instanzen)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS character_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artifact_id TEXT NOT NULL,              -- Katalog-ID aus src/utils/adventure.js
  is_equipped BOOLEAN DEFAULT false,
  is_protected BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'quest',            -- quest | boss | craft | arena
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ                  -- NULL = permanent, sonst Ablaufdatum
);
ALTER TABLE character_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CA lesen" ON character_artifacts;    CREATE POLICY "CA lesen"    ON character_artifacts FOR SELECT USING (true);
DROP POLICY IF EXISTS "CA schreiben" ON character_artifacts; CREATE POLICY "CA schreiben" ON character_artifacts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "CA aendern" ON character_artifacts;  CREATE POLICY "CA aendern"  ON character_artifacts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "CA loeschen" ON character_artifacts; CREATE POLICY "CA loeschen" ON character_artifacts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ca_user ON character_artifacts(user_id);

-- ---------------------------------------------------------------------
-- 2. WÖCHENTLICHER BOSS (globaler Zustand pro Woche)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_boss (
  week_start DATE PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  max_hp INTEGER NOT NULL,
  total_damage INTEGER DEFAULT 0,
  defeated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE weekly_boss ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Boss lesen" ON weekly_boss; CREATE POLICY "Boss lesen" ON weekly_boss FOR SELECT USING (true);
-- Schreiben erfolgt ausschließlich über die RPC attack_boss (SECURITY DEFINER).

-- ---------------------------------------------------------------------
-- 3. BOSS-SCHADEN pro Spieler/Woche (für Loot-Anteil)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boss_damage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  damage INTEGER DEFAULT 0,
  looted BOOLEAN DEFAULT false,
  UNIQUE(user_id, week_start)
);
ALTER TABLE boss_damage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BD lesen" ON boss_damage;   CREATE POLICY "BD lesen"   ON boss_damage FOR SELECT USING (true);
DROP POLICY IF EXISTS "BD aendern" ON boss_damage; CREATE POLICY "BD aendern" ON boss_damage FOR UPDATE USING (auth.uid() = user_id);
-- INSERT erfolgt über attack_boss (SECURITY DEFINER).

-- ---------------------------------------------------------------------
-- 4. ARENA-ERGEBNISSE (für Wochenwertung)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arena_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  opponent_name TEXT,
  won BOOLEAN NOT NULL,
  stake_artifact_id TEXT,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE arena_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Arena lesen" ON arena_results;    CREATE POLICY "Arena lesen"    ON arena_results FOR SELECT USING (true);
DROP POLICY IF EXISTS "Arena schreiben" ON arena_results; CREATE POLICY "Arena schreiben" ON arena_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_arena_user_week ON arena_results(user_id, week_start);

-- ---------------------------------------------------------------------
-- 5. SONDERQUEST-ABSCHLÜSSE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quest_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instance_id TEXT NOT NULL,              -- z.B. "2026-05-25__touch_grass__0"
  quest_id TEXT NOT NULL,                 -- Katalog-ID aus src/utils/quests.js
  xp_gained INTEGER DEFAULT 0,
  artifact_id TEXT,                       -- gedroppte Artefakt-ID (oder NULL)
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, instance_id)
);
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "QC lesen" ON quest_completions;    CREATE POLICY "QC lesen"    ON quest_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "QC schreiben" ON quest_completions; CREATE POLICY "QC schreiben" ON quest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_qc_user ON quest_completions(user_id);

-- ---------------------------------------------------------------------
-- 6. FREUNDES-QUESTS (von Freund zu Freund)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friend_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT,
  receiver_name TEXT,
  quest_id TEXT NOT NULL,                 -- Katalog-ID aus src/utils/quests.js ODER '__custom__'
  custom_title TEXT,                      -- eigene Quest (wenn quest_id='__custom__')
  custom_description TEXT,
  mode TEXT DEFAULT 'gift' CHECK (mode IN ('challenge','coop','gift')),
  message TEXT,
  stake_xp INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
-- Falls eine ältere Version existierte: fehlende Spalten ergänzen
ALTER TABLE friend_tasks ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE friend_tasks ADD COLUMN IF NOT EXISTS receiver_name TEXT;
-- BUGFIX: ältere Versionen hatten quest_id als UUID (FK auf quests).
-- Der Client sendet jetzt Katalog-IDs als TEXT (z.B. "touch_grass").
DO $$
DECLARE r RECORD;
BEGIN
  -- FK-Constraints auf quest_id entfernen (Name kann variieren)
  FOR r IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'friend_tasks'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'quest_id'
  LOOP
    EXECUTE format('ALTER TABLE friend_tasks DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
  -- Spaltentyp auf TEXT umstellen, falls noch nicht TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'friend_tasks' AND column_name = 'quest_id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE friend_tasks ALTER COLUMN quest_id TYPE TEXT USING quest_id::TEXT;
  END IF;
END $$;
-- Eigene (selbst formulierte) Quests an Freunde
ALTER TABLE friend_tasks ADD COLUMN IF NOT EXISTS custom_title TEXT;
ALTER TABLE friend_tasks ADD COLUMN IF NOT EXISTS custom_description TEXT;
ALTER TABLE friend_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "FT lesen" ON friend_tasks;   CREATE POLICY "FT lesen"   ON friend_tasks FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "FT senden" ON friend_tasks;  CREATE POLICY "FT senden"  ON friend_tasks FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "FT aendern" ON friend_tasks; CREATE POLICY "FT aendern" ON friend_tasks FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE INDEX IF NOT EXISTS idx_ft_receiver ON friend_tasks(receiver_id);
CREATE INDEX IF NOT EXISTS idx_ft_sender ON friend_tasks(sender_id);

-- 7. ACHIEVEMENTS (Freischaltungen)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,           -- z.B. "ms_tasks_10" oder "ac_early_bird"
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UA lesen" ON user_achievements;    CREATE POLICY "UA lesen"    ON user_achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "UA schreiben" ON user_achievements; CREATE POLICY "UA schreiben" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "UA aendern" ON user_achievements;   CREATE POLICY "UA aendern"   ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_ua_user ON user_achievements(user_id);

-- ---------------------------------------------------------------------
-- 8. LOADOUT (Wochen-Doppelbonus-Slots)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_loadout (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  slots JSONB DEFAULT '{}',              -- { "helm": "uid", "weapon": "uid", ... }
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, week_start)
);
ALTER TABLE user_loadout ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Loadout lesen" ON user_loadout;    CREATE POLICY "Loadout lesen"    ON user_loadout FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Loadout schreiben" ON user_loadout; CREATE POLICY "Loadout schreiben" ON user_loadout FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Loadout aendern" ON user_loadout;   CREATE POLICY "Loadout aendern"   ON user_loadout FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_loadout_user ON user_loadout(user_id, week_start);

-- 2. CHARACTERS (Erweiterung für Schritte & Tutorial)
-- ---------------------------------------------------------------------
ALTER TABLE characters ADD COLUMN IF NOT EXISTS total_steps INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS weekly_steps INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS daily_steps INTEGER DEFAULT 0; -- Neue Spalte für Tages-Tasks
ALTER TABLE characters ADD COLUMN IF NOT EXISTS last_step_sync TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE characters ADD COLUMN IF NOT EXISTS tutorial_done BOOLEAN DEFAULT false;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS steps_reward_claimed BOOLEAN DEFAULT false;
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_monsters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monster_id TEXT NOT NULL,               -- Katalog-ID aus src/utils/monsters.js
  nickname TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  stat_points INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{}',
  moves JSONB DEFAULT '[]',
  affection INTEGER DEFAULT 100,          -- Zuneigung 0-100
  last_interaction TIMESTAMPTZ DEFAULT NOW(),
  caught_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_monsters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "UM lesen" ON user_monsters;    CREATE POLICY "UM lesen"    ON user_monsters FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "UM schreiben" ON user_monsters; CREATE POLICY "UM schreiben" ON user_monsters FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "UM aendern" ON user_monsters;  CREATE POLICY "UM aendern"  ON user_monsters FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_um_user ON user_monsters(user_id);

CREATE TABLE IF NOT EXISTS user_teams (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  slot_1 UUID REFERENCES user_monsters(id) ON DELETE SET NULL,
  slot_2 UUID REFERENCES user_monsters(id) ON DELETE SET NULL,
  slot_3 UUID REFERENCES user_monsters(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team lesen" ON user_teams;    CREATE POLICY "Team lesen"    ON user_teams FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Team schreiben" ON user_teams; CREATE POLICY "Team schreiben" ON user_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Team aendern" ON user_teams;   CREATE POLICY "Team aendern"   ON user_teams FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================================
-- RPCs
-- =====================================================================

-- Interner Helfer: XP gutschreiben + Level neu berechnen (nicht öffentlich)
CREATE OR REPLACE FUNCTION _apply_xp(p_user UUID, p_amount INT)
RETURNS VOID AS $$
DECLARE v_xp INT; v_level INT := 1; v_need INT := 0;
BEGIN
  SELECT xp INTO v_xp FROM characters WHERE user_id = p_user;
  IF v_xp IS NULL THEN RETURN; END IF;
  v_xp := v_xp + GREATEST(0, p_amount);
  WHILE v_need + v_level * 100 <= v_xp LOOP v_need := v_need + v_level * 100; v_level := v_level + 1; END LOOP;
  UPDATE characters SET xp = v_xp, level = v_level WHERE user_id = p_user;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION _apply_xp(UUID, INT) FROM PUBLIC;

-- Boss angreifen: legt Boss-Woche bei Bedarf an, addiert Schaden atomar.
CREATE OR REPLACE FUNCTION attack_boss(p_week DATE, p_name TEXT, p_icon TEXT, p_max_hp INT, p_damage INT)
RETURNS TABLE(boss_hp INT, total_damage INT, defeated BOOLEAN, my_damage INT) AS $$
DECLARE v_uid UUID := auth.uid(); v_total INT; v_def BOOLEAN; v_max INT; v_dmg INT := GREATEST(0, p_damage);
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO weekly_boss(week_start, name, icon, max_hp)
    VALUES (p_week, p_name, p_icon, p_max_hp)
    ON CONFLICT (week_start) DO NOTHING;
  UPDATE weekly_boss
    SET total_damage = LEAST(max_hp, total_damage + v_dmg),
        defeated = (total_damage + v_dmg >= max_hp)
    WHERE week_start = p_week
    RETURNING total_damage, defeated, max_hp INTO v_total, v_def, v_max;
  INSERT INTO boss_damage(user_id, week_start, damage)
    VALUES (v_uid, p_week, v_dmg)
    ON CONFLICT (user_id, week_start) DO UPDATE SET damage = boss_damage.damage + v_dmg;
  SELECT damage INTO my_damage FROM boss_damage WHERE user_id = v_uid AND week_start = p_week;
  boss_hp := v_max - v_total; total_damage := v_total; defeated := v_def;
  RETURN NEXT;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Freundes-Quest abschließen: nur der Empfänger im Status 'accepted'; beide bekommen XP.
CREATE OR REPLACE FUNCTION complete_friend_task(p_task_id UUID)
RETURNS TABLE(reward INT) AS $$
DECLARE v_uid UUID := auth.uid(); v_task friend_tasks%ROWTYPE; v_reward INT;
BEGIN
  SELECT * INTO v_task FROM friend_tasks WHERE id = p_task_id;
  IF v_task.id IS NULL THEN RAISE EXCEPTION 'task not found'; END IF;
  IF v_task.receiver_id <> v_uid THEN RAISE EXCEPTION 'only receiver can complete'; END IF;
  IF v_task.status = 'completed' THEN reward := 0; RETURN NEXT; RETURN; END IF;
  IF v_task.status <> 'accepted' THEN RAISE EXCEPTION 'task must be accepted first'; END IF;
  v_reward := 40 + COALESCE(v_task.stake_xp, 0);   -- FRIEND_QUEST_XP + Einsatz
  UPDATE friend_tasks SET status = 'completed', completed_at = NOW() WHERE id = p_task_id;
  PERFORM _apply_xp(v_task.receiver_id, v_reward);
  PERFORM _apply_xp(v_task.sender_id, v_reward);
  reward := v_reward; RETURN NEXT;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- Realtime: Freundes-Quests live zustellen
-- =====================================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE friend_tasks;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- =====================================================================
-- PostgREST-Schema-Cache neu laden, damit neue Spalten (custom_title,
-- custom_description) sofort verfügbar sind. Behebt:
-- "Could not find the 'custom_description' column ... in the schema cache"
-- =====================================================================
NOTIFY pgrst, 'reload schema';
