# TaskRPG – Code Review & Bug Report

> Datum: 2026-07-19 · Review der 105 Dateien aus PROJEKT_SNAPSHOT.txt

## 🔴 KRITISCHE BUGS (Crash- oder Datenverlust-Risiko)

### 1. useEffect-Dependency ist boolescher Ausdruck statt Wert
**Datei:** `src/context/AdventureContext.jsx` (Zeile ~160)
```js
// ❌ FALSCH:
useEffect(() => { ... }, [user, character?.xp == null])
// 'character?.xp == null' evaluiert zu true/false – Effekt feuert nur beim Kippen
```
**Fix:** Sollte eine echte Dependency sein, z.B. `character?.xp`.

### 2. Crash in MonsterBattle wenn Monster keinen Nickname hat
**Datei:** `src/components/MonsterBattle.jsx` (Zeile ~121)
```js
// ❌ CRASH wenn playerMonster.monster_id nicht in MONSTER_MAP:
{playerMonster.nickname || MONSTER_MAP[playerMonster.monster_id].name}
```
**Fix:** Fallback mit optional chaining: `MONSTER_MAP[playerMonster.monster_id]?.name || 'Unbekannt'`

### 3. `defender.type` ist undefined bei wilden Mini-Bossen
**Datei:** `src/components/MonsterBattle.jsx` (Zeile ~65)
```js
const defType = defender.type || MONSTER_MAP[defender.monster_id]?.type
// defender.type existiert nicht im activeMiniBoss-Objekt (hat nur .monster_id)
```
**Fix:** `MONSTER_MAP[defender.monster_id]?.type` priorisieren.

### 4. `fetchArenaWinCounts` ohne Supabase-Konfiguration
**Datei:** `src/lib/adventureRepo.js`
```js
export async function fetchArenaWinCounts(weekStart) {
  const { data, error } = await supabase.from('arena_results')...
  // ❌ Kein Check auf isSupabaseConfigured() – bricht im Offline-Modus
```

### 5. `complete_friend_task` RPC erlaubt Abschluss ohne `accepted`-Status
**Datei:** `supabase/migrations/adventure.sql`
```sql
-- ❌ Kein Check ob v_task.status = 'accepted'
IF v_task.status = 'completed' THEN reward := 0; RETURN NEXT; RETURN; END IF;
```
**Fix:** Auch `pending` und `declined` ausschließen.

### 6. `MONSTER_MAP[playerMonster.monster_id]` kann undefined sein
**Datei:** `src/pages/MonsterPage.jsx` (Zeile ~80)
```js
<h3 className="...">{inspectedMonster.nickname || MONSTER_MAP[inspectedMonster.monster_id].name}</h3>
// ❌ Kein Fallback, crash bei nicht-existierendem Monster
```

---

## 🟡 MITTLERE BUGS (Fehlverhalten)

### 7. `todayEvent` wird nie aktualisiert
**Datei:** `src/context/AchievementContext.jsx` (Zeile ~180)
```js
const todayEvent = useMemo(() => getTodayEvent(formatDate(new Date())), [])
// ❌ Leeres Dependency-Array → Event wechselt nie nach Mitternacht
```

### 8. `window.location.reload()` für Monster-Stat-Upgrade
**Datei:** `src/pages/MonsterPage.jsx`
```js
await updateMonster(monsterUid, { stats: newStats, stat_points: m.stat_points - 1 })
window.location.reload() // ❌ Verliert gesamten App-State
```
**Fix:** State lokal aktualisieren statt Reload.

### 9. Module-Level `Pr` vs lokales `Pr`
**Datei:** `src/context/GameContext.jsx`
```js
// Zeile 45: const Pr = calculateLevel  (im Provider-Body)
// Zeile 380: const Pr = calculateLevel  (am Modul-Ende, nach Export!)
```
Das zweite `Pr` macht am Modul-Ende keinen Sinn und ist tot.

### 10. Monster Affection Decay feuert auch ohne geladene Daten
**Datei:** `src/context/AdventureContext.jsx`
```js
useEffect(() => {
  if (!loaded || !userMonsters.length) return
  const interval = setInterval(() => {
    setUserMonsters(prev => {
      // ❌ Ruft updateMonster() in setState-Callback auf (async in sync!)
      // Und setInterval feuert alle 1 Stunde, aber der State kann stale sein
    })
  }, 1000 * 60 * 60)
}, [loaded, userMonsters.length, REMOTE])
```
**Problem:** `updateMonster()` wird innerhalb eines `setState`-Callbacks aufgerufen (Async in Sync-Context). Außerdem startet der Interval bei jedem `userMonsters.length`-Wechsel neu.

---

## 🟢 KLEINERE ISSUES & Verbesserungen

### 11. Fehlende Error Boundaries
Es gibt keine `ErrorBoundary`-Komponente. Ein Fehler in einer Lazy-Loaded Page crasht die ganze App.

### 12. Supabase-Placeholder erzeugt Runtime-Errors
**Datei:** `src/lib/supabase.js`
```js
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key', ...
)
```
Besser: null zurückgeben wenn nicht konfiguriert, oder klarer warnen.

### 13. XSS-Risiko in `username`
**Datei:** Diverse Pages
Usernames werden ohne Sanitization in JSX eingefügt. React escapen zwar standardmäßig, aber `dangerouslySetInnerHTML` sollte vermieden werden.

### 14. `import.meta.env` ohne Fallback-Typisierung
Keine `.d.ts` für Vite-Environment-Variablen. Führt zu TypeScript-Warnungen.

### 15. SQL-Migration nicht vollständig idempotent
`init.sql` hat `DROP POLICY IF EXISTS` + `CREATE POLICY` ohne `IF NOT EXISTS`. Policies können nicht mit `IF NOT EXISTS` erstellt werden, aber DROP + CREATE ist ok.

### 16. `manualChunks` in vite.config teilt `lucide-react` nicht korrekt
```js
if (id.includes('lucide')) return 'vendor-icons';
```
Lucide-React-Icons werden als einzelne Module importiert – der Check funktioniert, aber könnte `@lucide` einschließen.

### 17. `useEffect` cleanup im AdventureContext ist unvollständig
```js
useEffect(() => {
  if (!loaded || !character) return
  // Expired Items bereinigen...
  const expired = state.inventory.filter(...)
  // ❌ Keine Cleanup-Funktion, kein Dependency-Tracking für character-Props
}, [loaded, state.inventory, REMOTE])
```
`state.inventory` als Dependency löst bei JEDER Inventory-Änderung aus.

### 18. `calculateFinalXp` in `xp.js` dupliziert Logik aus `adventure.js:applyXp`
Zwei XP-Berechnungsfunktionen mit unterschiedlicher Logik – `calculateFinalXp` kennt keine Stats-Boni (Intelligenz/Glück) und keine Set-Boni.

---

## 📊 ARCHITEKTUR-BEWERTUNG

| Aspekt | Bewertung | Kommentar |
|--------|-----------|-----------|
| **Provider-Hierarchie** | ✅ Gut | Auth → Adventure → Game → Achievement → Notification |
| **Code-Splitting** | ✅ Gut | Lazy Loading aller Seiten |
| **PWA** | ✅ Gut | Update-Prompt, Offline-Fallback, Workbox |
| **Supabase-Integration** | ⚠️ Mittel | Gute RLS-Policies, aber inkonsistente Error-Handling |
| **Typ-Sicherheit** | ❌ Schwach | Kein TypeScript, viele implizite `any`-Typen |
| **Testbarkeit** | ⚠️ Mittel | Utils sind pure functions, aber Contexts stark gekoppelt |
| **Mobile UX** | ✅ Gut | Vibration, Touch-Optimierung, PWA-Install |

---

## 🔧 EMPFOHLENE SOFORT-MASSNAHMEN

1. Bug #1, #2, #3, #4 fixen (Crash-Risiko)
2. Bug #5 fixen (Datenintegrität)
3. Bug #8 fixen (UX)
4. Error Boundary hinzufügen
5. `window.location.reload()` in MonsterPage ersetzen
