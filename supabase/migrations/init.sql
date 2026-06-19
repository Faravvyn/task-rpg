-- TaskRPG – Datenbank-Migration (idempotent)
-- Ausführen im Supabase SQL Editor

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT DEFAULT '🧙‍♂️',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Held_' || LEFT(NEW.id::TEXT, 5)), '🧙‍♂️')
  ON CONFLICT (id) DO NOTHING; RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profile lesen" ON profiles; CREATE POLICY "Profile lesen" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Eigenes Profil bearbeiten" ON profiles; CREATE POLICY "Eigenes Profil bearbeiten" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. CHARACTERS
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL, class TEXT NOT NULL CHECK (class IN ('krieger','magier','schurke','heiler')),
  level INTEGER DEFAULT 1, xp INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{"staerke":1,"ausdauer":1,"intelligenz":1,"willenskraft":1}',
  bonus_points INTEGER DEFAULT 0, equipment JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Character lesen" ON characters; CREATE POLICY "Character lesen" ON characters FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Character erstellen" ON characters; CREATE POLICY "Character erstellen" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Character aktualisieren" ON characters; CREATE POLICY "Character aktualisieren" ON characters FOR UPDATE USING (auth.uid() = user_id);

-- 3. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'haushalt',
  difficulty TEXT NOT NULL DEFAULT 'mittel' CHECK (difficulty IN ('leicht','mittel','schwer')),
  repeat_type TEXT NOT NULL DEFAULT 'taeglich' CHECK (repeat_type IN ('einmalig','taeglich','woechentlich')),
  xp_reward INTEGER NOT NULL DEFAULT 25, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tasks lesen" ON tasks; CREATE POLICY "Tasks lesen" ON tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Tasks erstellen" ON tasks; CREATE POLICY "Tasks erstellen" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Tasks aktualisieren" ON tasks; CREATE POLICY "Tasks aktualisieren" ON tasks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Tasks loeschen" ON tasks; CREATE POLICY "Tasks loeschen" ON tasks FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- 4. TASK_COMPLETIONS
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  xp_gained INTEGER NOT NULL DEFAULT 0, completed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Completions lesen" ON task_completions; CREATE POLICY "Completions lesen" ON task_completions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Completions erstellen" ON task_completions; CREATE POLICY "Completions erstellen" ON task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(user_id, completed_at);

-- 5. LEADERBOARD_WEEKLY
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  xp_this_week INTEGER DEFAULT 0, rank INTEGER,
  week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::date, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leaderboard lesen" ON leaderboard_weekly; CREATE POLICY "Leaderboard lesen" ON leaderboard_weekly FOR SELECT USING (true);
DROP POLICY IF EXISTS "Leaderboard erstellen" ON leaderboard_weekly; CREATE POLICY "Leaderboard erstellen" ON leaderboard_weekly FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Leaderboard aktualisieren" ON leaderboard_weekly; CREATE POLICY "Leaderboard aktualisieren" ON leaderboard_weekly FOR UPDATE USING (auth.uid() = user_id);

-- 6. FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(requester_id, receiver_id)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Friendships lesen" ON friendships; CREATE POLICY "Friendships lesen" ON friendships FOR SELECT USING (auth.uid()=requester_id OR auth.uid()=receiver_id);
DROP POLICY IF EXISTS "Friendships erstellen" ON friendships; CREATE POLICY "Friendships erstellen" ON friendships FOR INSERT WITH CHECK (auth.uid()=requester_id);
DROP POLICY IF EXISTS "Friendships aktualisieren" ON friendships; CREATE POLICY "Friendships aktualisieren" ON friendships FOR UPDATE USING (auth.uid()=requester_id OR auth.uid()=receiver_id);
DROP POLICY IF EXISTS "Friendships loeschen" ON friendships; CREATE POLICY "Friendships loeschen" ON friendships FOR DELETE USING (auth.uid()=requester_id OR auth.uid()=receiver_id);

-- 7. NUDGES
CREATE TABLE IF NOT EXISTS nudges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sent_date DATE DEFAULT CURRENT_DATE, sent_at TIMESTAMPTZ DEFAULT NOW()
);
DROP INDEX IF EXISTS idx_nudge_daily;
CREATE UNIQUE INDEX IF NOT EXISTS idx_nudge_daily ON nudges (sender_id, receiver_id, sent_date);
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Nudges lesen" ON nudges; CREATE POLICY "Nudges lesen" ON nudges FOR SELECT USING (auth.uid()=sender_id OR auth.uid()=receiver_id);
DROP POLICY IF EXISTS "Nudge senden" ON nudges; CREATE POLICY "Nudge senden" ON nudges FOR INSERT WITH CHECK (auth.uid()=sender_id);

-- 8. CHALLENGES
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('xp_duel','task_duel','streak_duel','category_duel')),
  target TEXT, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','completed','declined','expired')),
  winner_id UUID REFERENCES auth.users(id), stake_xp INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Challenges lesen" ON challenges; CREATE POLICY "Challenges lesen" ON challenges FOR SELECT USING (auth.uid()=challenger_id OR auth.uid()=opponent_id);
DROP POLICY IF EXISTS "Challenge erstellen" ON challenges; CREATE POLICY "Challenge erstellen" ON challenges FOR INSERT WITH CHECK (auth.uid()=challenger_id);
DROP POLICY IF EXISTS "Challenge aktualisieren" ON challenges; CREATE POLICY "Challenge aktualisieren" ON challenges FOR UPDATE USING (auth.uid()=challenger_id OR auth.uid()=opponent_id);

-- 2. CHARACTERS (Erweiterung für RPG-Mechaniken)
-- ---------------------------------------------------------------------
ALTER TABLE characters ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS dungeon_floor INTEGER DEFAULT 1;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS dungeon_room INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS skill_points INTEGER DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS consumables JSONB DEFAULT '{}'; -- { "potion_xp": 2 }
ALTER TABLE characters ADD COLUMN IF NOT EXISTS active_buffs JSONB DEFAULT '{}'; -- { "xp_boost": "iso_timestamp" }

-- RLS Update (sicherstellen, dass alles erlaubt ist)
DROP POLICY IF EXISTS "Character aktualisieren" ON characters; 
CREATE POLICY "Character aktualisieren" ON characters FOR UPDATE USING (auth.uid() = user_id);

-- 3. TASKS (Erweiterung für Verifizierung)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'none'; -- none | photo
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS verification_target TEXT; -- z.B. "Baum", "Kaffee", "Hund"

-- Storage für Verifizierungs-Fotos (Bucket erstellen falls möglich via UI, hier Policy)
-- Hinweis: In Supabase muss manuell ein Bucket 'task-verification' erstellt werden.
CREATE OR REPLACE FUNCTION complete_task_and_gain_xp(p_user_id UUID, p_task_id UUID, p_xp_gained INTEGER)
RETURNS TABLE(new_total_xp INTEGER, new_level INTEGER, did_level_up BOOLEAN) AS $$
DECLARE v_current_xp INTEGER; v_new_xp INTEGER; v_old_level INTEGER; v_new_level INTEGER; v_xp_needed INTEGER;
BEGIN
  SELECT xp INTO v_current_xp FROM characters WHERE user_id=p_user_id;
  v_new_xp:=v_current_xp+p_xp_gained;
  v_old_level:=1; v_xp_needed:=0;
  WHILE v_xp_needed+v_old_level*100<=v_current_xp LOOP v_xp_needed:=v_xp_needed+v_old_level*100; v_old_level:=v_old_level+1; END LOOP;
  v_new_level:=1; v_xp_needed:=0;
  WHILE v_xp_needed+v_new_level*100<=v_new_xp LOOP v_xp_needed:=v_xp_needed+v_new_level*100; v_new_level:=v_new_level+1; END LOOP;
  UPDATE characters SET xp=v_new_xp, level=v_new_level WHERE user_id=p_user_id;
  INSERT INTO task_completions (user_id, task_id, xp_gained) VALUES (p_user_id, p_task_id, p_xp_gained);
  INSERT INTO leaderboard_weekly (user_id, xp_this_week, week_start) VALUES (p_user_id, p_xp_gained, date_trunc('week',CURRENT_DATE)::date)
  ON CONFLICT (user_id) DO UPDATE SET xp_this_week=leaderboard_weekly.xp_this_week+p_xp_gained, updated_at=NOW();
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level>v_old_level);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;