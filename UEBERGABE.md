# TaskRPG – Übergabe-Protokoll

> Letzte Aktualisierung: 2026-06-19 · Vollständiger, rekonstruierbarer Quellcode in
> **`PROJEKT_SNAPSHOT.txt`** (71 Dateien, PWA + Monster-System + Fitness).

---

## 1. Projektstatus: "Monster-Collector & Fitness Update"

TaskRPG ist nun eine vollwertige Monster-Sammel-App mit Fitness-Integration.
Nutzer erledigen Aufgaben, um XP zu sammeln, Monster-Spuren zu finden, wilde
Kreaturen in rundenbasierten Kämpfen zu fangen und ihr Team zu trainieren.

---

## 2. Kern-Features & Mechaniken

### 🐾 Monster-System
- **Sammlung:** 26+ Monster mit Typen (Feuer, Wasser, Erde, etc.) und Seltenheit.
- **Monster Lexicon:** Übersicht aller entdeckten Kreaturen mit Zusatzinfos
  (Gewicht, Größe, Vorlieben), sobald sie gefangen wurden.
- **Team-Management:** Auswahl von 3 aktiven Monstern für Duelle.
- **Zuneigung (Affection):** Monster verlieren über Zeit an Laune. Interaktionen
  (Streicheln/Füttern) über reale Kurz-Tasks (Situps/Laufen) stellen diese wieder her.
- **Level-Up:** Monster erhalten XP durch Dungeon-Fortschritt. Stat-Punkte (HP, ATK, DEF)
  können manuell verteilt werden.

### ⚔️ Kampfsystem (Monster Battle)
- **Rundenbasiert:** Pokémon-Stil Kampf-Engine.
- **Typ-Vorteile:** Doppelter Schaden bei effektiven Typ-Paarungen.
- **Task-basierte Moves:** Starke Angriffe erfordern die Bestätigung einer realen
  Aktion (z.B. 10 Liegestütze).
- **Fangen:** Wilde Monster (Mini-Bosse) können unter 50% HP mit variabler
  Chance gefangen werden.

### 🚶 Fitness & Pedometer
- **Google Fit Sync:** Simulierter OAuth-Prozess für täglichen Schritt-Abgleich.
- **Schritte-Rewards:** Wöchentliche Ziele (50k, 60k, 80k) für seltene Artefakt-Drops.
- **Schritte-Tasks:** Aufgaben können nun eine Mindestanzahl an Tages-Schritten zur
  Verifizierung erfordern.

### 🛡️ RPG-Elemente & Dungeon
- **Dungeon Crawler:** Jede Task rückt den Spieler einen Raum vor. Alle 10 Räume:
  neue Ebene + Beutetruhe + Monster-XP.
- **Wöchentlicher Boss:** 5 Bosse mit individuellen High-Res Artworks und
  angepassten HP-Werten für bessere Balance.
- **Alchemist-Shop:** Kauf von Elixieren (XP-Boost) und Monster-Ködern (Lures).

---

## 3. Technische Highlights

- **PWA-Optimierung:** 
  - Install-Prompt in den Einstellungen.
  - Update-Banner ("Update verfügbar!"), wenn neuer Code auf Netlify liegt.
  - Haptisches Feedback (Vibration) auf Android.
  - Code-Splitting / Lazy Loading für schnelle Ladezeiten auf Mobilgeräten.
- **Persistence (Supabase):**
  - Alle Monster, Teams, Achievements und das Loadout werden cross-device gespeichert.
  - Realtime-Sync für Aufgaben (Änderung auf PC erscheint sofort auf Handy).
- **Sicherheit:** 
  - Passwortgeschützter Dev-Spawn (Passwort: `test`).
  - Schutz vor unendlichem Schritt-Sync (1x pro Tag).

---

## 4. Offene Punkte / TODO
1. Echte Google Fit API Anbindung (erfordert Client-ID & SSL auf Localhost).
2. Fortgeschrittene KI-Bilderkennung für Foto-Tasks (statt Simulation).
3. Sound-Effekte für das Monster-Kampfsystem.

---

## 5. Wiederherstellung
`PROJEKT_SNAPSHOT.txt` einlesen → Dateien schreiben → `npm install` → 
`init.sql` + `adventure.sql` ausführen (Supabase) → `npm run dev`.
**WICHTIG:** Auf Netlify immer "Clear cache and deploy site" nutzen bei Updates!
