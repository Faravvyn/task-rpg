// =====================================================================
// TaskRPG – Sonderquest-System ("Special Quests")
// Automatisch generierte Quests, die extra XP und eine erhöhte
// Artefakt-Drop-Chance geben. 1–3 spawnen pro Woche und sind nur
// 2–3 Tage verfügbar.
//
// Reine Logik, keine Seiteneffekte.
// =====================================================================
import { getWeekStart } from './adventure'

const DAY = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------
// Quest-Katalog (Vorlagen)
//   xp:          Basis-XP-Belohnung (höher als normale Tasks)
//   dropChance:  Wahrscheinlichkeit (0..1) ein Artefakt zu droppen
//   minRarity:   Mindest-Seltenheit beim Drop
// ---------------------------------------------------------------------
export const SPECIAL_QUESTS = [
  { id: 'touch_grass', icon: '🌱', title: 'Touch Grass', category: 'gesundheit',
    description: 'Geh nach draußen und verbringe bewusst Zeit in der Natur.', xp: 60, dropChance: 0.5, minRarity: 'common' },
  { id: 'long_time', icon: '🕰️', title: 'Lang nicht gemacht', category: 'lernen',
    description: 'Mach etwas, das du schon lange nicht mehr getan hast.', xp: 70, dropChance: 0.5, minRarity: 'common' },
  { id: 'call_someone', icon: '📞', title: 'Alte Verbindung', category: 'gesundheit',
    description: 'Ruf jemanden an, mit dem du lange nicht gesprochen hast.', xp: 65, dropChance: 0.55, minRarity: 'common' },
  { id: 'cinema_break', icon: '🎬', title: 'Auszeit im Kino', category: 'gesundheit',
    description: 'Nimm dir eine Auszeit und geh ins Kino.', xp: 80, dropChance: 0.6, minRarity: 'rare' },
  { id: 'cook_new', icon: '🍳', title: 'Neues Rezept', category: 'haushalt',
    description: 'Koche ein Gericht, das du noch nie zubereitet hast.', xp: 60, dropChance: 0.5, minRarity: 'common' },
  { id: 'digital_detox', icon: '📵', title: 'Digital Detox', category: 'gesundheit',
    description: 'Verbringe 3 Stunden komplett ohne Bildschirm.', xp: 75, dropChance: 0.55, minRarity: 'rare' },
  { id: 'walk_unknown', icon: '🚶', title: 'Unbekannte Wege', category: 'sport',
    description: 'Geh eine Route spazieren, die du noch nie gegangen bist.', xp: 55, dropChance: 0.5, minRarity: 'common' },
  { id: 'declutter', icon: '🧹', title: 'Großes Ausmisten', category: 'haushalt',
    description: 'Miste eine Schublade, einen Schrank oder eine Ecke komplett aus.', xp: 65, dropChance: 0.5, minRarity: 'common' },
  { id: 'read_book', icon: '📖', title: 'Kapitel der Ruhe', category: 'lernen',
    description: 'Lies mindestens 30 Minuten in einem echten Buch.', xp: 60, dropChance: 0.5, minRarity: 'common' },
  { id: 'gratitude', icon: '🙏', title: 'Dankbarkeit', category: 'gesundheit',
    description: 'Schreibe 3 Dinge auf, für die du heute dankbar bist.', xp: 45, dropChance: 0.45, minRarity: 'common' },
  { id: 'help_stranger', icon: '🤝', title: 'Gute Tat', category: 'gesundheit',
    description: 'Hilf heute einem Fremden mit einer kleinen Geste.', xp: 70, dropChance: 0.6, minRarity: 'rare' },
  { id: 'early_rise', icon: '🌅', title: 'Früher Vogel', category: 'gesundheit',
    description: 'Steh morgen eine Stunde früher auf und genieße den Morgen.', xp: 65, dropChance: 0.5, minRarity: 'common' },
  { id: 'no_sugar', icon: '🚫', title: 'Zuckerfrei', category: 'gesundheit',
    description: 'Verzichte einen ganzen Tag auf zugesetzten Zucker.', xp: 70, dropChance: 0.5, minRarity: 'common' },
  { id: 'learn_word', icon: '🗣️', title: 'Neue Sprache', category: 'lernen',
    description: 'Lerne 10 neue Wörter in einer Fremdsprache.', xp: 55, dropChance: 0.45, minRarity: 'common' },
  { id: 'sunset_watch', icon: '🌇', title: 'Sonnenuntergang', category: 'gesundheit',
    description: 'Schau dir bewusst einen kompletten Sonnenuntergang an.', xp: 50, dropChance: 0.5, minRarity: 'common' },
  { id: 'creative_hour', icon: '🎨', title: 'Kreativstunde', category: 'lernen',
    description: 'Verbringe eine Stunde mit etwas Kreativem (malen, schreiben, basteln).', xp: 65, dropChance: 0.55, minRarity: 'rare' },
  { id: 'water_day', icon: '💧', title: 'Hydration-Held', category: 'gesundheit',
    description: 'Trink heute mindestens 2 Liter Wasser.', xp: 40, dropChance: 0.4, minRarity: 'common' },
  { id: 'message_old_friend', icon: '💌', title: 'Lebenszeichen', category: 'gesundheit',
    description: 'Schreib einem alten Freund eine ehrliche, persönliche Nachricht.', xp: 60, dropChance: 0.5, minRarity: 'common' },
  { id: 'try_sport', icon: '🏅', title: 'Neue Sportart', category: 'sport',
    description: 'Probiere eine Sportart aus, die du noch nie gemacht hast.', xp: 85, dropChance: 0.65, minRarity: 'rare' },
  { id: 'visit_place', icon: '🗺️', title: 'Entdecker', category: 'sport',
    description: 'Besuche einen Ort in deiner Stadt, an dem du noch nie warst.', xp: 75, dropChance: 0.6, minRarity: 'rare' },
]

export const QUEST_MAP = Object.fromEntries(SPECIAL_QUESTS.map((q) => [q.id, q]))
export const getQuestTemplate = (id) => QUEST_MAP[id] || null

// ---------------------------------------------------------------------
// Deterministischer Zufall (mulberry32) – pro Woche stabil
// ---------------------------------------------------------------------
function seedFromString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------
// Wochen-Schedule generieren
//   Erzeugt 1–3 Quest-Instanzen mit Spawn-Tag (0–4) und Dauer (2–3 Tage).
//   Stabil pro Woche (gleicher weekStartStr => gleiches Ergebnis).
// ---------------------------------------------------------------------
export function generateWeeklyQuests(weekStartStr, userId = '') {
  const rng = mulberry32(seedFromString(weekStartStr + ':' + userId))
  const weekStart = getWeekStart(new Date(weekStartStr)).getTime()

  const count = 1 + Math.floor(rng() * 3) // 1..3
  const pool = [...SPECIAL_QUESTS]
  // Fisher-Yates mit seeded rng
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const chosen = pool.slice(0, count)

  return chosen.map((tpl, idx) => {
    const spawnOffset = Math.floor(rng() * 5)         // 0..4 Tage nach Wochenstart
    const duration = 2 + Math.floor(rng() * 2)        // 2..3 Tage verfügbar
    const assignedAt = weekStart + spawnOffset * DAY
    const expiresAt = assignedAt + duration * DAY
    return {
      id: `${weekStartStr}__${tpl.id}__${idx}`,
      quest_id: tpl.id,
      template: tpl,
      assignedAt,
      expiresAt,
      durationDays: duration,
    }
  })
}

// Aktiv = jetzt im Verfügbarkeitsfenster
export function isQuestActive(instance, now = Date.now()) {
  return now >= instance.assignedAt && now < instance.expiresAt
}

// Verbleibende Zeit hübsch formatiert
export function formatTimeLeft(expiresAt, now = Date.now()) {
  const diff = expiresAt - now
  if (diff <= 0) return 'abgelaufen'
  const h = Math.floor(diff / (60 * 60 * 1000))
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h >= 1) return `${h}h`
  return `${Math.max(1, Math.floor(diff / (60 * 1000)))}min`
}

// ---------------------------------------------------------------------
// Freundes-Quest-Belohnung
// ---------------------------------------------------------------------
export const FRIEND_QUEST_XP = 40 // beide Spieler erhalten dies bei Erfüllung