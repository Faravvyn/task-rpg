# TaskRPG – Übergabe-Protokoll

> Letzte Aktualisierung: 2026-05-30 · Vollständiger, rekonstruierbarer Quellcode in
> **`PROJEKT_SNAPSHOT.txt`** (`>>>FILE: pfad ... >>>END`, 67 Dateien, round-trip-verifiziert).

---

## 1. Projektüberblick

**TaskRPG** – React + Vite PWA, Alltagsaufgaben mit RPG-Gamification (XP, Level,
Stats, Streaks, Klassen, Artefakte, Boss, Arena, Quests, Achievements).
Backend: **Supabase** (Auth + Postgres + Realtime). Styling: **Tailwind**
(Custom-Klassen in `src/index.css`).

Start:
```bash
npm install
cp .env.example .env       # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
# init.sql UND adventure.sql im Supabase SQL-Editor ausführen
npm run dev                # http://localhost:5173
```
Ohne Supabase-Konfiguration → automatischer **localStorage-Fallback**.

---

## 2. Status
- ✅ `npm run build` erfolgreich
- ✅ Dev-Server HTTP 200, keine Konsolenfehler
- ✅ `PROJEKT_SNAPSHOT.txt` parst 1:1 zurück (0 Abweichungen, 67 Dateien)

---

## 3. Letzte Sitzung – Bugfixes & Features

### 🐞 Bugfixes
1. **„Could not find the 'custom_description' column … schema cache"** + **Katalog-Quests
   wurden nicht gesendet.** Ursache: Client schickte immer `custom_*`-Felder, DB hatte
   die Spalten (noch) nicht → *jeder* Insert schlug fehl.
   - `adventureRepo.insertFriendTask`: sendet `custom_*` **nur** bei eigener Quest
     (`quest_id === '__custom__'`) und hat einen **Fallback**, der bei fehlenden
     Spalten Titel/Beschreibung in `message` packt.
   - `adventure.sql`: `ADD COLUMN IF NOT EXISTS custom_title/custom_description`
     + abschließend `NOTIFY pgrst, 'reload schema';` (Cache-Reload).
   - ⚠️ **`adventure.sql` einmal erneut ausführen.**

### ✨ Persistenz-Upgrade (Cross-Device)
- **Achievements & Meilensteine**: Werden nun in der Tabelle `user_achievements` in Supabase persistiert.
  - Automatischer Sync beim Login.
  - Fallback auf `localStorage`, falls Supabase nicht konfiguriert ist.
- **Wöchentliches Loadout**: Die gewählten Doppelbonus-Slots werden in `user_loadout` gespeichert.
  - Persistenz pro Nutzer und Woche (`week_start`).
- **Zufalls-Events**: Bleiben clientseitig (deterministisch). Da `getTodayEvent` rein auf dem aktuellen Datum basiert, sehen alle Nutzer (und derselbe Nutzer auf verschiedenen Geräten) konsistent dasselbe Event, ohne dass eine DB-Synchronisation nötig ist.

### ✨ Equipment-System unter „Held"
- **6 Ausrüstungs-Slots**: Helm, Waffe, Rüstung, Stiefel, Ring, Amulett
  (`EQUIP_SLOTS`, `ARTIFACT_SLOT`, `slotForArtifact` in `utils/adventure.js`).
- **`components/EquipmentSlots.jsx`**: Silhouetten-Slots, Tap → Auswahl passender
  Artefakte aus dem Inventar; pro Slot genau **ein** Artefakt (ersetzt automatisch).
- **`pages/CharacterPage.jsx`** neu: Tabs Profil / **Ausrüstung** / Stats / Inventar.
  Inventar trennt **„Ausgerüstet – aktiv"** von **„Inventar – inaktiv"** (ausgegraut).
- **Wichtig (Spielregel):** Nur **ausgerüstete** Artefakte sind aktiv. Set-Boni und
  alle Effekte zählen jetzt über **`equippedArtifactIdsUnique`** statt Besitz:
  - `AdventureContext`: `completedSetBonuses`, Quest-XP-Set-Bonus, `dealBossDamage`,
    `fightArena` → equipped.
  - `GameContext.completeTask`: `applyXp(..., ownedArtifactIds: equippedArtifactIdsUnique)`.
  - `BossPage`: Schadensmultiplikator über equipped.
  - `setProgress` (Kodex/Sammelalbum) bleibt **besitzbasiert** (Sammelfortschritt).

---

## 4. Gesamtfunktionen (Adventure-Mode)
- **Wöchentlicher Boss** (`BossPage`) – Tasks = Angriffe, Community-Schaden, Loot nach Anteil.
- **Kodex/Sets** (`KodexPage`) – Sammelfortschritt + permanente Boni (aktiv nur wenn ausgerüstet).
- **Schmiede** (`ForgePage`) – 3 gleiche Seltenheit + 50 XP → 1 Stufe höher.
- **Arena** (`ArenaPage`) – 1v1, Artefakt-Einsatz, geschützte Artefakte.
- **Sonderquests** (`QuestsPage`) – 1–3/Woche, 2–3 Tage, extra XP + Drop.
- **Freundes-Quests** (`FriendsPage`) – Katalog **oder eigene Quest**, beide bekommen XP, Realtime.
- **Ausrüstung/Loadout** (`LoadoutPage`) – Wochen-Slots mit doppeltem Bonus.
- **Errungenschaften & Meilensteine** (`AchievementsPage`) – inkl. geheime „???".
- **Zufalls-Events** – täglich, wirken auf XP/Boss-Schaden/Drop.
- **Level-Up-Effekt** + **Achievement-Feier** + optionaler **Sound** (`utils/sound.js`).
- **Benachrichtigungen** (`NotificationContext`, Bell) + Push-Einstellungen.
- **Leaderboard** mit Arena-Siegen (XP + Siege×50).
- **Illustrierte Empty States** (`components/EmptyState.jsx`).

---

## 5. Architektur
- **Provider-Reihenfolge** (`main.jsx`): `Auth → Adventure → Game → Achievement → Notification`.
- **REMOTE-Schalter**: `isSupabaseConfigured()` → Supabase, sonst localStorage.
- **Sicherheit**: XP via `SECURITY DEFINER`-RPCs (`attack_boss`, `complete_friend_task`).
- **Slot-Zuordnung**: `ARTIFACT_SLOT` (fix je Artefakt) + Effekt-Fallback in `slotForArtifact`.

---

## 6. Wichtige Dateien (Auswahl)
- Logik: `utils/adventure.js` (Slots, applyXp, Schaden, Crafting, Arena),
  `utils/quests.js`, `utils/achievements.js`, `utils/sound.js`, `utils/streak.js`, `utils/xp.js`
- Context: `AdventureContext`, `GameContext`, `AchievementContext`, `NotificationContext`, `AuthContext`
- Repo/DB: `lib/adventureRepo.js`, `supabase/migrations/init.sql`, `supabase/migrations/adventure.sql`
- UI neu: `components/EquipmentSlots.jsx`, `components/EmptyState.jsx`,
  `components/AchievementToast.jsx`, `components/DropReveal.jsx`,
  `pages/CharacterPage.jsx`, `pages/AchievementsPage.jsx`, `pages/LoadoutPage.jsx`,
  `pages/BossPage.jsx`, `pages/KodexPage.jsx`, `pages/ForgePage.jsx`, `pages/ArenaPage.jsx`, `pages/QuestsPage.jsx`

---

## 7. Offene Punkte / TODO
1. Echte Web-Push (Service Worker + VAPID) für geschlossene App.
2. Tägliche Erinnerung / Streak-Warnung lösen noch keinen Timer aus.
3. Bundle > 500 kB → optional Code-Splitting.

---

## 8. Wiederherstellung
`PROJEKT_SNAPSHOT.txt` einlesen → Dateien schreiben → `npm install` → `.env` setzen
→ `init.sql` + `adventure.sql` ausführen → `npm run dev`.
