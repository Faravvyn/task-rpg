// =====================================================================
// TaskRPG – Errungenschaften, Meilensteine & Zufalls-Events.
// Reine Logik. Der Fortschritt wird im AchievementContext ausgewertet.
// =====================================================================

// ---------------------------------------------------------------------
// MEILENSTEINE (sichtbar) – feste Schwellen mit XP-Belohnung.
//   metric: Funktion(stats) -> Zahl   (siehe AchievementContext: buildStats)
// ---------------------------------------------------------------------
export const MILESTONES = [
  { id: 'tasks_10',   icon: '✅', title: '10 Aufgaben',        desc: 'Erledige 10 Aufgaben.',          metric: 'totalCompletions', goal: 10,  rewardXp: 50 },
  { id: 'tasks_50',   icon: '🏅', title: '50 Aufgaben',        desc: 'Erledige 50 Aufgaben.',          metric: 'totalCompletions', goal: 50,  rewardXp: 150 },
  { id: 'tasks_100',  icon: '🎖️', title: '100 Aufgaben',       desc: 'Erledige 100 Aufgaben.',         metric: 'totalCompletions', goal: 100, rewardXp: 300 },
  { id: 'tasks_250',  icon: '👑', title: '250 Aufgaben',       desc: 'Erledige 250 Aufgaben.',         metric: 'totalCompletions', goal: 250, rewardXp: 600 },
  { id: 'streak_3',   icon: '🔥', title: 'Heiße Serie',        desc: 'Erreiche einen 3-Tage-Streak.',  metric: 'streak',           goal: 3,   rewardXp: 60 },
  { id: 'streak_7',   icon: '🔥', title: 'Wochenflamme',       desc: 'Erreiche einen 7-Tage-Streak.',  metric: 'streak',           goal: 7,   rewardXp: 140 },
  { id: 'streak_30',  icon: '☄️', title: 'Unaufhaltsam',       desc: 'Erreiche einen 30-Tage-Streak.', metric: 'streak',           goal: 30,  rewardXp: 500 },
  { id: 'level_5',    icon: '⭐', title: 'Aufsteiger',         desc: 'Erreiche Level 5.',              metric: 'level',            goal: 5,   rewardXp: 100 },
  { id: 'level_10',   icon: '🌟', title: 'Veteran',            desc: 'Erreiche Level 10.',             metric: 'level',            goal: 10,  rewardXp: 250 },
  { id: 'artifacts_5',icon: '💎', title: 'Sammler',            desc: 'Besitze 5 Artefakte.',           metric: 'artifactCount',    goal: 5,   rewardXp: 80 },
  { id: 'quests_3',   icon: '📜', title: 'Abenteurer',         desc: 'Erfülle 3 Sonderquests.',        metric: 'questsDone',       goal: 3,   rewardXp: 120 },
]

// ---------------------------------------------------------------------
// ACHIEVEMENTS – teils GEHEIM (hidden=true). Bedingung: cond(stats) -> bool.
// Geheime erscheinen vor dem Freischalten als "???".
// ---------------------------------------------------------------------
export const ACHIEVEMENTS = [
  // sichtbar
  { id: 'first_task',   icon: '🌱', title: 'Erster Schritt',   desc: 'Erledige deine erste Aufgabe.',        hidden: false, rewardXp: 20,  cond: (s) => s.totalCompletions >= 1 },
  { id: 'first_artifact', icon: '💎', title: 'Funkelnder Fund', desc: 'Finde dein erstes Artefakt.',         hidden: false, rewardXp: 30,  cond: (s) => s.artifactCount >= 1 },
  { id: 'first_friend', icon: '🤝', title: 'Gefährte',         desc: 'Füge deinen ersten Freund hinzu.',      hidden: false, rewardXp: 30,  cond: (s) => s.friendCount >= 1 },
  { id: 'boss_slayer',  icon: '🐉', title: 'Drachentöter',     desc: 'Trage zum Sieg über einen Boss bei.',   hidden: false, rewardXp: 100, cond: (s) => s.bossDefeatedContrib },
  { id: 'first_set',    icon: '🧩', title: 'Vollständig',      desc: 'Vervollständige ein Themen-Set.',       hidden: false, rewardXp: 150, cond: (s) => s.completedSets >= 1 },

  // GEHEIM – Überraschung beim Entdecken
  { id: 'early_bird',   icon: '🌅', title: 'Frühaufsteher',    desc: 'Erledige 7 Aufgaben vor 9 Uhr morgens.', hidden: true, rewardXp: 120, cond: (s) => s.tasksBefore9 >= 7 },
  { id: 'night_owl',    icon: '🦉', title: 'Nachteule',        desc: 'Erledige 7 Aufgaben nach 23 Uhr.',       hidden: true, rewardXp: 120, cond: (s) => s.tasksAfter23 >= 7 },
  { id: 'weekend_warrior', icon: '🗡️', title: 'Wochenend-Krieger', desc: 'Erledige 10 Aufgaben am Wochenende.', hidden: true, rewardXp: 100, cond: (s) => s.weekendTasks >= 10 },
  { id: 'perfectionist', icon: '✨', title: 'Perfektionist',   desc: 'Erledige an einem Tag 8 Aufgaben.',      hidden: true, rewardXp: 130, cond: (s) => s.maxTasksInOneDay >= 8 },
  { id: 'comeback',     icon: '💪', title: 'Rückkehrer',       desc: 'Sei nach einer Pause wieder aktiv.',     hidden: true, rewardXp: 80,  cond: (s) => s.hadComeback },
  { id: 'rich',         icon: '🪙', title: 'Wohlhabend',       desc: 'Besitze über 1000 XP gleichzeitig.',     hidden: true, rewardXp: 100, cond: (s) => s.currentXp >= 1000 },
  { id: 'legendary_owner', icon: '🌟', title: 'Legende lebt',  desc: 'Besitze ein legendäres Artefakt.',       hidden: true, rewardXp: 200, cond: (s) => s.hasLegendary },
  { id: 'arena_master', icon: '🏆', title: 'Gladiator',        desc: 'Gewinne 5 Arena-Duelle.',                hidden: true, rewardXp: 150, cond: (s) => s.arenaWins >= 5 },
  { id: 'social',       icon: '🎉', title: 'Beliebt',          desc: 'Habe 5 Freunde.',                        hidden: true, rewardXp: 100, cond: (s) => s.friendCount >= 5 },
  { id: 'generous',     icon: '🎁', title: 'Großzügig',        desc: 'Schicke 10 Freundes-Quests.',            hidden: true, rewardXp: 90,  cond: (s) => s.friendQuestsSent >= 10 },
]

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
export const MILESTONE_MAP = Object.fromEntries(MILESTONES.map((m) => [m.id, m]))

// ---------------------------------------------------------------------
// ZUFALLS-EVENTS – temporäre, tagesweise rotierende Effekte.
//   effect: { type: 'xp_mult'|'drop_boost'|'damage_mult', value }
// ---------------------------------------------------------------------
export const RANDOM_EVENTS = [
  { id: 'double_xp',     icon: '⚡', title: 'Doppel-XP-Tag',      desc: 'Heute geben alle Aufgaben doppelte XP!',          effect: { type: 'xp_mult', value: 2 } },
  { id: 'lucky_day',     icon: '🍀', title: 'Glückstag',          desc: 'Erhöhte Artefakt-Drop-Chance bei Quests.',        effect: { type: 'drop_boost', value: 0.25 } },
  { id: 'rush_hour',     icon: '🏃', title: 'Sturmangriff',       desc: 'Doppelter Boss-Schaden für jede Aufgabe!',        effect: { type: 'damage_mult', value: 2 } },
  { id: 'golden_hour',   icon: '✨', title: 'Goldene Stunde',     desc: '+50% XP auf alle Aufgaben heute.',                effect: { type: 'xp_mult', value: 1.5 } },
  { id: 'treasure',      icon: '🗝️', title: 'Schatzsuche',        desc: 'Stark erhöhte Drop-Chance & bessere Seltenheit.', effect: { type: 'drop_boost', value: 0.4 } },
  { id: 'calm_day',      icon: '🌙', title: 'Ruhiger Tag',        desc: 'Kein Bonus heute – sammle Kraft für morgen.',     effect: { type: 'none', value: 0 } },
  { id: 'warrior_spirit',icon: '🔥', title: 'Kriegergeist',       desc: '+50% Boss-Schaden heute.',                        effect: { type: 'damage_mult', value: 1.5 } },
]

export const EVENT_MAP = Object.fromEntries(RANDOM_EVENTS.map((e) => [e.id, e]))

// Deterministisches Tages-Event (gleich für alle, wechselt täglich).
// Manche Tage haben gar kein Event (≈ 1/3 Wahrscheinlichkeit "kein Event").
function dayHash(dateStr) {
  let h = 2166136261
  for (let i = 0; i < dateStr.length; i++) { h ^= dateStr.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function getTodayEvent(dateStr) {
  const h = dayHash(dateStr)
  // ~33% kein Event
  if (h % 3 === 0) return null
  return RANDOM_EVENTS[h % RANDOM_EVENTS.length]
}