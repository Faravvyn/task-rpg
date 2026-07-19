import { getStreakMultiplier } from './xp'
// =====================================================================
// TaskRPG – Adventure-Mode Spiel-Logik & Katalog (reine Funktionen)
// Enthält: Seltenheiten, Artefakt-Katalog, Themen-Sets, Schadensberechnung,
//          Crafting-Regeln, Arena-Kampflogik.
// Diese Datei hat KEINE Seiteneffekte und ist damit gut testbar.
// =====================================================================

export const BACKSTORY = {
  dungeon: {
    1: "Die Oberen Katakomben: Einst ein Lagerhaus für königliche Weinvorräte, nun von schleimigen Kreaturen überrannt.",
    11: "Die Vergessene Bibliothek: Hier lagert das Wissen der alten Gelehrten, doch die Schatten haben von den Büchern Besitz ergriffen.",
    21: "Der Brennende Abgrund: Ein Ort ewiger Hitze, in dem nur die widerstandsfähigsten Golems überleben.",
  },
  bosses: {
    'Schattenkönig': "Der einstige Herrscher dieses Reiches, der durch seine eigene Gier in ewige Finsternis gestürzt wurde.",
    'Frostgolem': "Ein Konstrukt aus den kältesten Wintern der Geschichte, erschaffen um den Eingang zum Archiv zu bewachen.",
    'Flammendrache': "Ein uraltes Wesen, das tief unter der Erde schläft und nur durch die Störung der Dungeon-Ruhe erwacht.",
  }
}

// ---------------------------------------------------------------------
// Seltenheiten
// ---------------------------------------------------------------------
export const RARITIES = {
  common: {
    id: 'common', name: 'Gewöhnlich', order: 0, next: 'rare',
    text: 'text-gray-300', border: 'border-gray-600', bg: 'bg-gray-500/10',
    glow: 'shadow-gray-500/20', dmgMult: 1.0, dropWeight: 60,
  },
  rare: {
    id: 'rare', name: 'Selten', order: 1, next: 'epic',
    text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10',
    glow: 'shadow-blue-500/30', dmgMult: 1.15, dropWeight: 28,
  },
  epic: {
    id: 'epic', name: 'Episch', order: 2, next: 'legendary',
    text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10',
    glow: 'shadow-purple-500/40', dmgMult: 1.25, dropWeight: 10,
  },
  legendary: {
    id: 'legendary', name: 'Legendär', order: 3, next: null,
    text: 'text-gold-400', border: 'border-gold-500/60', bg: 'bg-gold-500/10',
    glow: 'shadow-gold-500/50', dmgMult: 1.5, dropWeight: 2,
  },
}

export const rarityInfo = (rarity) => RARITIES[rarity] || RARITIES.common

// ---------------------------------------------------------------------
// Artefakt-Katalog
//   effect_type:  'xp_boost' | 'boss_damage' | 'streak_shield' | 'multiplier'
//   effect_value: { percent } | { streak_multiplier }
//   setId:        Zugehörigkeit zu einem Themen-Set (optional)
// ---------------------------------------------------------------------
export const ARTIFACTS = [
  // --- Set: Krieger ---
  { id: 'kr_schwert', name: 'Schwert des Mutes', icon: '⚔️', rarity: 'rare', setId: 'krieger',
    effect_type: 'boss_damage', effect_value: { percent: 10 }, description: '+10% Boss-Schaden' },
  { id: 'kr_schild', name: 'Wächterschild', icon: '🛡️', rarity: 'rare', setId: 'krieger',
    effect_type: 'xp_boost', effect_value: { percent: 5 }, description: '+5% XP' },
  { id: 'kr_helm', name: 'Eisenhelm', icon: '⛑️', rarity: 'rare', setId: 'krieger',
    effect_type: 'boss_damage', effect_value: { percent: 8 }, description: '+8% Boss-Schaden' },

  // --- Set: Naturläufer ---
  { id: 'nl_stab', name: 'Eschenstab', icon: '🪄', rarity: 'rare', setId: 'naturlaeufer',
    effect_type: 'xp_boost', effect_value: { percent: 8 }, description: '+8% XP' },
  { id: 'nl_beutel', name: 'Kräuterbeutel', icon: '🌿', rarity: 'common', setId: 'naturlaeufer',
    effect_type: 'streak_shield', effect_value: {}, description: 'Schützt deinen Streak einmalig' },
  { id: 'nl_mantel', name: 'Wettermantel', icon: '🧥', rarity: 'epic', setId: 'naturlaeufer',
    effect_type: 'boss_damage', effect_value: { percent: 12 }, description: '+12% Boss-Schaden' },

  // --- Set: Gelehrter ---
  { id: 'ge_pergament', name: 'Altes Pergament', icon: '📜', rarity: 'common', setId: 'gelehrter',
    effect_type: 'xp_boost', effect_value: { percent: 4 }, description: '+4% XP' },
  { id: 'ge_tinte', name: 'Magische Tinte', icon: '🖋️', rarity: 'rare', setId: 'gelehrter',
    effect_type: 'xp_boost', effect_value: { percent: 7 }, description: '+7% XP' },
  { id: 'ge_brille', name: 'Brille der Weisheit', icon: '👓', rarity: 'epic', setId: 'gelehrter',
    effect_type: 'xp_boost', effect_value: { percent: 12 }, description: '+12% XP' },

  // --- Legendäre Einzelstücke (zählen zum "Legende"-Set) ---
  { id: 'lg_drachenherz', name: 'Drachenherz', icon: '🐲', rarity: 'legendary', setId: 'legende',
    effect_type: 'boss_damage', effect_value: { percent: 25 }, description: '+25% Boss-Schaden' },
  { id: 'lg_krone', name: 'Krone der Könige', icon: '👑', rarity: 'legendary', setId: 'legende',
    effect_type: 'xp_boost', effect_value: { percent: 20 }, description: '+20% XP' },
  { id: 'lg_phoenix', name: 'Phönixfeder', icon: '🔥', rarity: 'legendary', setId: 'legende',
    effect_type: 'streak_shield', effect_value: {}, description: 'Unzerstörbarer Streak-Schild' },
  { id: 'lg_zeitsanduhr', name: 'Sanduhr der Zeit', icon: '⏳', rarity: 'legendary', setId: 'legende',
    effect_type: 'multiplier', effect_value: { streak_multiplier: 1.1 }, description: '×1.1 Streak-Bonus' },
  { id: 'lg_sternenklinge', name: 'Sternenklinge', icon: '🌟', rarity: 'legendary', setId: 'legende',
    effect_type: 'boss_damage', effect_value: { percent: 30 }, description: '+30% Boss-Schaden' },

  // --- Setlose Beute (Crafting-Füllmaterial) ---
  { id: 'c_muenze', name: 'Glücksmünze', icon: '🪙', rarity: 'common', setId: null,
    effect_type: 'xp_boost', effect_value: { percent: 3 }, description: '+3% XP' },
  { id: 'c_kristall', name: 'Energiekristall', icon: '🔷', rarity: 'common', setId: null,
    effect_type: 'boss_damage', effect_value: { percent: 5 }, description: '+5% Boss-Schaden' },
  { id: 'c_fackel', name: 'Ewige Fackel', icon: '🔦', rarity: 'common', setId: null,
    effect_type: 'xp_boost', effect_value: { percent: 3 }, description: '+3% XP' },
  { id: 'r_amulett', name: 'Rubinamulett', icon: '📿', rarity: 'rare', setId: null,
    effect_type: 'boss_damage', effect_value: { percent: 9 }, description: '+9% Boss-Schaden' },
  { id: 'r_ring', name: 'Saphirring', icon: '💍', rarity: 'rare', setId: null,
    effect_type: 'xp_boost', effect_value: { percent: 6 }, description: '+6% XP' },
  { id: 'e_kelch', name: 'Kelch der Macht', icon: '🏆', rarity: 'epic', setId: null,
    effect_type: 'boss_damage', effect_value: { percent: 15 }, description: '+15% Boss-Schaden' },
  { id: 'e_orbis', name: 'Arkaner Orbis', icon: '🔮', rarity: 'epic', setId: null,
    effect_type: 'xp_boost', effect_value: { percent: 15 }, description: '+15% XP' },
]

export const ARTIFACT_MAP = Object.fromEntries(ARTIFACTS.map((a) => [a.id, a]))
export const getArtifact = (id) => ARTIFACT_MAP[id] || null

export const artifactsByRarity = (rarity) => ARTIFACTS.filter((a) => a.rarity === rarity)

// ---------------------------------------------------------------------
// Themen-Sets
// ---------------------------------------------------------------------
export const SETS = [
  {
    id: 'krieger', name: 'Krieger-Set', icon: '⚔️',
    description: 'Schwert, Schild & Helm – der Weg des Kämpfers.',
    artifactIds: ['kr_schwert', 'kr_schild', 'kr_helm'],
    bonus: { effect_type: 'xp_boost', effect_value: { percent: 20 }, label: '+20% XP permanent' },
  },
  {
    id: 'naturlaeufer', name: 'Naturläufer-Set', icon: '🌿',
    description: 'Stab, Kräuterbeutel & Wettermantel – im Einklang mit der Wildnis.',
    artifactIds: ['nl_stab', 'nl_beutel', 'nl_mantel'],
    bonus: { effect_type: 'boss_damage', effect_value: { percent: 20 }, label: '+20% Boss-Schaden permanent' },
  },
  {
    id: 'gelehrter', name: 'Gelehrten-Set', icon: '📚',
    description: 'Pergament, Tinte & Brille – Wissen ist Macht.',
    artifactIds: ['ge_pergament', 'ge_tinte', 'ge_brille'],
    bonus: { effect_type: 'multiplier', effect_value: { streak_multiplier: 1.15 }, label: '×1.15 Streak-Bonus permanent' },
  },
  {
    id: 'legende', name: 'Legende', icon: '🌟',
    description: 'Sammle 5 legendäre Artefakte und werde unsterblich.',
    artifactIds: ['lg_drachenherz', 'lg_krone', 'lg_phoenix', 'lg_zeitsanduhr', 'lg_sternenklinge'],
    bonus: { effect_type: 'xp_boost', effect_value: { percent: 50 }, label: '+50% XP permanent' },
  },
]

export const SET_MAP = Object.fromEntries(SETS.map((s) => [s.id, s]))
export const getSet = (id) => SET_MAP[id] || null

// Set-Fortschritt: { setId: { set, ownedIds[], total, complete } }
export function getSetProgress(ownedArtifactIds = []) {
  const ownedSet = new Set(ownedArtifactIds)
  return SETS.map((set) => {
    const owned = set.artifactIds.filter((id) => ownedSet.has(id))
    return {
      set,
      ownedIds: owned,
      ownedCount: owned.length,
      total: set.artifactIds.length,
      complete: owned.length === set.artifactIds.length,
      percent: Math.round((owned.length / set.artifactIds.length) * 100),
    }
  })
}

// Aktive permanente Set-Boni (nur vollständige Sets zählen)
export function getCompletedSetBonuses(ownedArtifactIds = []) {
  return getSetProgress(ownedArtifactIds)
    .filter((p) => p.complete)
    .map((p) => p.set.bonus)
}

// ---------------------------------------------------------------------
// Schadensberechnung (Boss-Raid)
//   Schwere Tasks treffen härter. Artefakte & Set-Boni multiplizieren.
// ---------------------------------------------------------------------
export const BASE_TASK_DAMAGE = { leicht: 5, mittel: 12, schwer: 25, episch: 50 }

// Schadensmultiplikator aus ausgerüsteten Artefakten + abgeschlossenen Sets
export function getDamageMultiplier(equippedArtifactIds = [], ownedArtifactIds = [], doubledArtifactIds = []) {
  const doubled = new Set(doubledArtifactIds)
  let mult = 1
  for (const id of equippedArtifactIds) {
    const art = getArtifact(id)
    if (art?.effect_type === 'boss_damage' && art.effect_value?.percent) {
      mult += (doubled.has(id) ? 2 : 1) * art.effect_value.percent / 100
    }
  }
  for (const bonus of getCompletedSetBonuses(ownedArtifactIds)) {
    if (bonus.effect_type === 'boss_damage' && bonus.effect_value?.percent) {
      mult += bonus.effect_value.percent / 100
    }
  }
  return mult
}

// Schaden, den eine erledigte Task am Boss verursacht
export function calculateTaskDamage(difficulty, equippedArtifactIds = [], ownedArtifactIds = [], doubledArtifactIds = []) {
  const base = BASE_TASK_DAMAGE[difficulty] ?? BASE_TASK_DAMAGE.mittel
  const mult = getDamageMultiplier(equippedArtifactIds, ownedArtifactIds, doubledArtifactIds)
  return Math.round(base * mult)
}

// Permanente XP-Boni aus abgeschlossenen Sets (für calculateFinalXp nutzbar)
export function getSetXpBonusPercent(ownedArtifactIds = []) {
  let percent = 0
  for (const bonus of getCompletedSetBonuses(ownedArtifactIds)) {
    if (bonus.effect_type === 'xp_boost' && bonus.effect_value?.percent) {
      percent += bonus.effect_value.percent
    }
  }
  return percent
}

// ---------------------------------------------------------------------
// Wöchentlicher Boss
// ---------------------------------------------------------------------
export const WEEKLY_BOSSES = [
  { name: 'Schattenkönig', icon: '👑', baseHp: 500, image: '/assets/boss_shadow_dragon.jpg' },
  { name: 'Frostgolem', icon: '🧊', baseHp: 650, image: '/assets/boss_frost_golem.jpg' },
  { name: 'Flammendrache', icon: '🐉', baseHp: 800, image: '/assets/boss_flame_dragon.jpg' },
  { name: 'Leerenbestie', icon: '🦑', baseHp: 750, image: '/assets/boss_void_beast.jpg' },
  { name: 'Sturmtitan', icon: '🌩️', baseHp: 1000, image: '/assets/boss_storm_titan.jpg' },
]

export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7 // Montag = 0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekStartStr(date = new Date()) {
  const d = getWeekStart(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Deterministischer Boss der aktuellen Woche
export function getBossForWeek(weekStartStr) {
  const seed = weekStartStr.split('-').reduce((a, b) => a + parseInt(b, 10), 0)
  const boss = WEEKLY_BOSSES[seed % WEEKLY_BOSSES.length]
  return { ...boss, maxHp: boss.baseHp }
}

// Loot-Stufe je nach Schadensanteil am Boss
export function getBossLootTier(damagePercent) {
  if (damagePercent >= 25) return { tier: 'legendary', label: 'Champion-Beute', minRarity: 'epic' }
  if (damagePercent >= 10) return { tier: 'epic', label: 'Heldenbeute', minRarity: 'rare' }
  if (damagePercent > 0) return { tier: 'common', label: 'Trostbeute', minRarity: 'common' }
  return null
}

// ---------------------------------------------------------------------
// Zufalls-Loot / Drops
// ---------------------------------------------------------------------
function pickWeighted(items, weightFn) {
  const total = items.reduce((s, it) => s + weightFn(it), 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= weightFn(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

// Zufälliges Artefakt – optional mit Mindest-Seltenheit
export function rollArtifact(minRarity = 'common') {
  const minOrder = rarityInfo(minRarity).order
  const pool = ARTIFACTS.filter((a) => rarityInfo(a.rarity).order >= minOrder)
  // Erst Seltenheit nach Gewicht wählen, dann gleichverteilt ein Artefakt
  const rarity = pickWeighted(
    Object.values(RARITIES).filter((r) => r.order >= minOrder),
    (r) => r.dropWeight
  )
  const byRarity = pool.filter((a) => a.rarity === rarity.id)
  return byRarity[Math.floor(Math.random() * byRarity.length)] || pool[0]
}

// ---------------------------------------------------------------------
// Crafting  (3 gleiche Seltenheit + Schmiedegebühr → 1 nächste Stufe)
// ---------------------------------------------------------------------
export const CRAFT_FEE_XP = 50
export const CRAFT_COST_COUNT = 3

export function canCraft(rarity) {
  const info = rarityInfo(rarity)
  return !!info.next
}

// Zufälliges Ergebnis aus dem Pool der nächsten Seltenheit
export function craftResultRarity(rarity) {
  return rarityInfo(rarity).next
}

export function rollCraftResult(rarity) {
  const next = craftResultRarity(rarity)
  if (!next) return null
  const pool = artifactsByRarity(next)
  return pool[Math.floor(Math.random() * pool.length)]
}

// ---------------------------------------------------------------------
// Arena-Duell (rundenbasiert: Stärke vs. Stärke, Ausdauer = Leben)
// ---------------------------------------------------------------------
export function buildFighter(name, stats = {}, equippedArtifactIds = [], ownedArtifactIds = [], doubledArtifactIds = []) {
  const dmgMult = getDamageMultiplier(equippedArtifactIds, ownedArtifactIds, doubledArtifactIds)
  const staerke = (stats.staerke || 1)
  const ausdauer = (stats.ausdauer || 1)
  return {
    name,
    attack: Math.round((staerke * 4 + 6) * dmgMult),
    hp: 40 + ausdauer * 12,
    maxHp: 40 + ausdauer * 12,
    dmgMult,
  }
}

// Simuliert ein komplettes Duell, gibt {winner:'a'|'b', log[]} zurück
export function simulateDuel(fighterA, fighterB) {
  const a = { ...fighterA }
  const b = { ...fighterB }
  const log = []
  let round = 1
  const rnd = (base) => Math.max(1, Math.round(base * (0.8 + Math.random() * 0.4)))
  while (a.hp > 0 && b.hp > 0 && round <= 30) {
    const dmgToB = rnd(a.attack)
    b.hp = Math.max(0, b.hp - dmgToB)
    log.push({ round, attacker: a.name, defender: b.name, dmg: dmgToB, defHp: b.hp })
    if (b.hp <= 0) break
    const dmgToA = rnd(b.attack)
    a.hp = Math.max(0, a.hp - dmgToA)
    log.push({ round, attacker: b.name, defender: a.name, dmg: dmgToA, defHp: a.hp })
    round++
  }
  const winner = a.hp > b.hp ? 'a' : b.hp > a.hp ? 'b' : (a.attack >= b.attack ? 'a' : 'b')
  return { winner, log, finalA: a.hp, finalB: b.hp }
}

export const MAX_PROTECTED_ARTIFACTS = 2
export const ARENA_CONSOLATION_XP = 30
// Punkte, die ein Arena-Sieg zur wöchentlichen Leaderboard-Wertung beiträgt
export const ARENA_WIN_POINTS = 50


// ---------------------------------------------------------------------
// Ausrüstungs-Slots (Wochen-Loadout) – ausgewählte Artefakte bringen
// diese Woche DOPPELTEN Bonus.
// ---------------------------------------------------------------------
export const EQUIP_SLOTS = [
  { id: 'helm',   label: 'Helm',     icon: '⛑️', silhouette: '🪖' },
  { id: 'weapon', label: 'Waffe',    icon: '⚔️', silhouette: '🗡️' },
  { id: 'armor',  label: 'Rüstung',  icon: '🛡️', silhouette: '👕' },
  { id: 'boots',  label: 'Stiefel',  icon: '🥾', silhouette: '👢' },
  { id: 'ring',   label: 'Ring',     icon: '💍', silhouette: '⭕' },
  { id: 'amulet', label: 'Amulett',  icon: '📿', silhouette: '🔮' },
]
export const SLOT_MAP = Object.fromEntries(EQUIP_SLOTS.map((sl) => [sl.id, sl]))

// Feste Slot-Zuordnung je Artefakt (welcher Ausrüstungsplatz passt).
export const ARTIFACT_SLOT = {
  // Krieger-Set
  kr_schwert: 'weapon', kr_schild: 'armor', kr_helm: 'helm',
  // Naturläufer-Set
  nl_stab: 'weapon', nl_beutel: 'amulet', nl_mantel: 'armor',
  // Gelehrten-Set
  ge_pergament: 'amulet', ge_tinte: 'ring', ge_brille: 'helm',
  // Legendär
  lg_drachenherz: 'amulet', lg_krone: 'helm', lg_phoenix: 'boots',
  lg_zeitsanduhr: 'amulet', lg_sternenklinge: 'weapon',
  // Setlos
  c_muenze: 'ring', c_kristall: 'amulet', c_fackel: 'boots',
  r_amulett: 'amulet', r_ring: 'ring', e_kelch: 'boots', e_orbis: 'amulet',
}

// Slot eines Artefakts ermitteln (per ID oder Objekt). Fallback nach Effekt.
export function slotForArtifact(idOrArt) {
  const id = typeof idOrArt === 'string' ? idOrArt : idOrArt?.id
  if (id && ARTIFACT_SLOT[id]) return ARTIFACT_SLOT[id]
  const art = typeof idOrArt === 'string' ? getArtifact(idOrArt) : idOrArt
  if (!art) return 'amulet'
  if (art.effect_type === 'boss_damage') return 'weapon'
  if (art.effect_type === 'streak_shield') return 'armor'
  return 'amulet'
}

// Einheitliche XP-Berechnung inkl. Streak, ausgerüsteter Artefakte
// (doppelt für Loadout-Slots) und abgeschlossener Set-Boni.
export function applyXp(baseXp, streakDays = 0, opts = {}) {
  const { equippedArtifactIds = [], ownedArtifactIds = [], doubledArtifactIds = [], stats = {} } = opts
  const doubled = new Set(doubledArtifactIds)
  let xp = baseXp * getStreakMultiplier(streakDays)
  
  // Intelligenz-Bonus: +1% XP pro Punkt
  const intBonus = (stats.intelligenz || 0) / 100
  xp *= (1 + intBonus)

  // Glücks-Bonus: Chance auf kritische XP (doppelt)
  const luck = stats.glueck || 0
  const critChance = Math.min(0.5, luck / 100) // max 50% chance
  if (Math.random() < critChance) {
    xp *= 2
    console.log("✨ Kritische XP durch Glück!")
  }

  for (const id of equippedArtifactIds) {
    const art = getArtifact(id); if (!art) continue
    const factor = doubled.has(id) ? 2 : 1
    if (art.effect_type === 'xp_boost' && art.effect_value?.percent) xp *= (1 + factor * art.effect_value.percent / 100)
    if (art.effect_type === 'multiplier' && art.effect_value?.streak_multiplier) xp *= Math.pow(art.effect_value.streak_multiplier, factor)
  }
  for (const bonus of getCompletedSetBonuses(ownedArtifactIds)) {
    if (bonus.effect_type === 'xp_boost' && bonus.effect_value?.percent) xp *= (1 + bonus.effect_value.percent / 100)
    if (bonus.effect_type === 'multiplier' && bonus.effect_value?.streak_multiplier) xp *= bonus.effect_value.streak_multiplier
  }
  return Math.round(xp)
}
