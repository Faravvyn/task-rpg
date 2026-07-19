// =====================================================================
// AdventureContext – zentrale Spiel-Engine für den Adventure-Mode.
//
// Persistenz:
//   • Supabase, wenn konfiguriert (cross-device, cross-account, Realtime).
//   • localStorage als Fallback (offline / ohne Supabase).
//
// Öffentliche API bleibt identisch zur lokalen Variante, damit die Seiten
// unverändert funktionieren.
// =====================================================================
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './AuthContext'
import {
  ARTIFACTS, getArtifact, getSetProgress, getCompletedSetBonuses,
  getWeekStartStr, getBossForWeek, getBossLootTier, calculateTaskDamage,
  rollArtifact, rollCraftResult, craftResultRarity, canCraft,
  CRAFT_FEE_XP, CRAFT_COST_COUNT, MAX_PROTECTED_ARTIFACTS, ARENA_CONSOLATION_XP,
  buildFighter, simulateDuel, getSetXpBonusPercent, EQUIP_SLOTS, slotForArtifact,
} from '../utils/adventure'
import {
  generateWeeklyQuests, isQuestActive, getQuestTemplate, QUEST_MAP,
  SPECIAL_QUESTS, FRIEND_QUEST_XP,
} from '../utils/quests'
import { calculateLevel } from '../utils/xp'
import { getTodayEvent } from '../utils/achievements'
import { formatDate } from '../utils/streak'
import { 
  useRemote, fetchInventory, fetchBoss, fetchArena, fetchQuestCompletions, 
  fetchLoadout, insertArtifact, updateArtifact, deleteArtifacts, 
  attackBoss, markBossLooted, insertArenaResult, insertQuestCompletion, 
  fetchFriendTasks, insertFriendTask, updateFriendTaskStatus, 
  completeFriendTaskRpc, subscribeFriendTasks, upsertLoadout,
  fetchUserMonsters, insertUserMonster, fetchUserTeam, upsertUserTeam,
  updateMonster, releaseMonster
} from '../lib/adventureRepo'
import { MONSTERS, MONSTER_MAP, calculateMonsterXpForLevel } from '../utils/monsters'

const AdventureContext = createContext({})

const storageKey = (userId) => `taskrpg_adventure_${userId || 'guest'}`
const FRIEND_MAILBOX_KEY = 'taskrpg_friend_tasks'
const pendingRewardsKey = (uid) => `taskrpg_pending_rewards_${uid}`

function defaultState(weekStart) {
  return {
    inventory: [],
    boss: null,
    arena: { weekStart, wins: 0, losses: 0, history: [] },
    craftCount: 0,
    questCompletions: [],
    loadout: { weekStart, slots: {} },
  }
}

let uidCounter = 0
const newUid = () => `a_${Date.now().toString(36)}_${(uidCounter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`

function readMailbox() { try { return JSON.parse(localStorage.getItem(FRIEND_MAILBOX_KEY) || '[]') } catch { return [] } }
function writeMailbox(t) { try { localStorage.setItem(FRIEND_MAILBOX_KEY, JSON.stringify(t)) } catch { /* ignore */ } }

export function AdventureProvider({ children }) {
  const { user, profile, character, updateCharacter, reloadCharacter } = useAuth()
  const REMOTE = useRemote()
  const weekStart = getWeekStartStr()
  const todayEvent = getTodayEvent(formatDate(new Date()))
  const eventDamageMult = todayEvent?.effect?.type === 'damage_mult' ? todayEvent.effect.value : 1
  const eventDropBoost = todayEvent?.effect?.type === 'drop_boost' ? todayEvent.effect.value : 0
  const [state, setState] = useState(() => defaultState(weekStart))
  const [loaded, setLoaded] = useState(false)
  const [lastDrop, setLastDrop] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [mailbox, setMailbox] = useState([])     // lokaler Fallback
  const [remoteFriendTasks, setRemoteFriendTasks] = useState([])  // Supabase
  const [userMonsters, setUserMonsters] = useState([])
  const [userTeam, setUserTeam] = useState({ slot_1: null, slot_2: null, slot_3: null })
  const [activeMiniBoss, setActiveMiniBoss] = useState(null)

  const charRef = useRef(character)
  useEffect(() => { charRef.current = character }, [character])

  // Uhr für Quest-Ablauf
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60 * 1000); return () => clearInterval(t) }, [])

  // ---------------- LADEN ----------------
  useEffect(() => {
    if (!user) { setLoaded(false); return }
    let cancelled = false

    const buildFreshBoss = () => {
      const b = getBossForWeek(weekStart)
      const communitySeed = (weekStart.split('-').reduce((a, c) => a + parseInt(c, 10), 0) * 37) % 400
      return { weekStart, name: b.name, icon: b.icon, image: b.image, maxHp: b.maxHp, hp: b.maxHp, myDamage: 0, communityDamage: communitySeed, defeated: false, looted: false }
    }

    async function loadRemote() {
      const [inventory, { bossRow, dmgRow }, arenaRows, questCompletions, slots, monsters, team] = await Promise.all([
        fetchInventory(user.id),
        fetchBoss(user.id, weekStart),
        fetchArena(user.id, weekStart),
        fetchQuestCompletions(user.id),
        fetchLoadout(user.id, weekStart),
        fetchUserMonsters(user.id),
        fetchUserTeam(user.id),
      ])
      if (cancelled) return
      const base = getBossForWeek(weekStart)
      const totalDamage = bossRow?.total_damage || 0
      const myDamage = dmgRow?.damage || 0
      const maxHp = bossRow?.max_hp || base.maxHp
      const boss = {
        weekStart, name: bossRow?.name || base.name, icon: bossRow?.icon || base.icon,
        image: base.image,
        maxHp, hp: Math.max(0, maxHp - totalDamage),
        myDamage, communityDamage: Math.max(0, totalDamage - myDamage),
        defeated: bossRow?.defeated || totalDamage >= maxHp, looted: !!dmgRow?.looted,
      }
      const wins = arenaRows.filter((a) => a.won).length
      const losses = arenaRows.length - wins
      setState({
        inventory, boss,
        arena: { weekStart, wins, losses, history: arenaRows.map((a) => ({ id: a.id, opponent: a.opponent_name, won: a.won, at: a.created_at })) },
        craftCount: 0, questCompletions,
        loadout: { weekStart, slots: slots || {} },
      })
      setUserMonsters(monsters)
      if (team) setUserTeam({ slot_1: team.slot_1, slot_2: team.slot_2, slot_3: team.slot_3 })
      setLoaded(true)
    }

    function loadLocal() {
      let data = defaultState(weekStart)
      try { const raw = localStorage.getItem(storageKey(user.id)); if (raw) data = { ...data, ...JSON.parse(raw) } } catch { /* ignore */ }
      if (!data.boss || data.boss.weekStart !== weekStart) data.boss = buildFreshBoss()
      if (!data.arena || data.arena.weekStart !== weekStart) data.arena = { weekStart, wins: 0, losses: 0, history: [] }
      if (!Array.isArray(data.questCompletions)) data.questCompletions = []
      if (!data.loadout || data.loadout.weekStart !== weekStart) data.loadout = { weekStart, slots: {} }
      setState(data); setLoaded(true)
    }

    if (REMOTE) loadRemote().catch((e) => { console.warn('Adventure remote load:', e.message); loadLocal() })
    else loadLocal()

    return () => { cancelled = true }
  }, [user, weekStart])

  // ---------------- SPEICHERN (nur lokal) ----------------
  useEffect(() => {
    if (REMOTE || !user || !loaded) return
    try { localStorage.setItem(storageKey(user.id), JSON.stringify(state)) } catch { /* ignore */ }
  }, [state, user, loaded])

  // ---------------- Pending-Rewards (nur lokaler Fallback) ----------------
  useEffect(() => {
    if (REMOTE || !user || !character) return
    let pending = []
    try { pending = JSON.parse(localStorage.getItem(pendingRewardsKey(user.id)) || '[]') } catch { pending = [] }
    if (pending.length === 0) return
    const totalXp = pending.reduce((s, p) => s + (p.xp || 0), 0)
    if (totalXp > 0 && updateCharacter) {
      const newXp = (character.xp || 0) + totalXp
      updateCharacter({ xp: newXp, level: calculateLevel(newXp).level })
    }
    try { localStorage.removeItem(pendingRewardsKey(user.id)) } catch { /* ignore */ }
  }, [user, character?.xp, REMOTE, updateCharacter])

  // ---------------- Freundes-Quests laden ----------------
  const refreshFriendTasks = useCallback(async () => {
    if (!user) return
    if (REMOTE) {
      const rows = await fetchFriendTasks(user.id)
      setRemoteFriendTasks(rows)
    } else {
      setMailbox(readMailbox())
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    refreshFriendTasks()
    if (REMOTE) {
      const unsub = subscribeFriendTasks(user.id, () => {
        refreshFriendTasks()
        // XP des Senders kann sich serverseitig geändert haben
        if (reloadCharacter) reloadCharacter()
      })
      return unsub
    } else {
      const onStorage = (e) => { if (e.key === FRIEND_MAILBOX_KEY) setMailbox(readMailbox()) }
      window.addEventListener('storage', onStorage)
      const t = setInterval(() => setMailbox(readMailbox()), 15 * 1000)
      return () => { window.removeEventListener('storage', onStorage); clearInterval(t) }
    }
  }, [user, refreshFriendTasks, reloadCharacter])

  // ---------------- Abgeleitete Werte: Inventar ----------------
  const ownedArtifactIds = useMemo(() => state.inventory.map((i) => i.artifactId), [state.inventory])
  const uniqueOwnedIds = useMemo(() => [...new Set(ownedArtifactIds)], [ownedArtifactIds])
  const equippedItems = useMemo(() => state.inventory.filter((i) => i.equipped).map((i) => ({ ...i, artifacts: getArtifact(i.artifactId) })), [state.inventory])
  const equippedArtifactIds = useMemo(() => equippedItems.map((i) => i.artifactId), [equippedItems])
  const characterArtifacts = useMemo(() =>
    state.inventory.map((i) => ({ id: i.uid, is_equipped: !!i.equipped, is_protected: !!i.protected, obtained_at: i.obtainedAt, artifacts: getArtifact(i.artifactId), artifact_id: i.artifactId })).filter((c) => c.artifacts),
    [state.inventory])
  // Aktiv = ausgerüstet. Nur ausgerüstete Artefakte zählen für Set-Boni & Effekte.
  const equippedArtifactIdsUnique = useMemo(() => [...new Set(equippedArtifactIds)], [equippedArtifactIds])
  const equippedBySlot = useMemo(() => {
    const map = {}
    for (const it of equippedItems) map[slotForArtifact(it.artifacts)] = it
    return map
  }, [equippedItems])
  const setProgress = useMemo(() => getSetProgress(uniqueOwnedIds), [uniqueOwnedIds])
  const completedSetBonuses = useMemo(() => getCompletedSetBonuses(equippedArtifactIdsUnique), [equippedArtifactIdsUnique])
  const protectedCount = useMemo(() => state.inventory.filter((i) => i.protected).length, [state.inventory])

  // Loadout: ausgewählte Artefakte (per Slot) bringen diese Woche doppelten Bonus
  const loadout = state.loadout?.slots || {}
  const doubledArtifactIds = useMemo(() => {
    const uids = Object.values(loadout)
    return state.inventory.filter((i) => uids.includes(i.uid)).map((i) => i.artifactId)
  }, [loadout, state.inventory])

  const setLoadoutSlot = useCallback((slotId, uid) => {
    let newSlots = {}
    setState((st) => {
      const slots = { ...(st.loadout?.slots || {}) }
      // gleichen uid aus anderen Slots entfernen
      for (const k of Object.keys(slots)) if (slots[k] === uid) delete slots[k]
      if (uid) slots[slotId] = uid; else delete slots[slotId]
      newSlots = slots
      return { ...st, loadout: { weekStart, slots } }
    })
    if (REMOTE && user) {
      upsertLoadout(user.id, weekStart, newSlots)
    }
  }, [weekStart, user])

  // ---------------- Inventar-Aktionen ----------------
  const addArtifact = useCallback(async (artifactId, source = 'quest') => {
    const art = getArtifact(artifactId); if (!art) return null
    let item
    if (REMOTE && user) {
      item = await insertArtifact(user.id, artifactId, source)
      if (!item) item = { uid: newUid(), artifactId, equipped: false, protected: false, obtainedAt: new Date().toISOString(), source }
    } else {
      item = { uid: newUid(), artifactId, equipped: false, protected: false, obtainedAt: new Date().toISOString(), source }
    }
    setState((s) => ({ ...s, inventory: [...s.inventory, item] }))
    setLastDrop({ artifact: art, source })
    return item
  }, [user])

  const clearLastDrop = useCallback(() => setLastDrop(null), [])

  const equipArtifact = useCallback((uid, equip) => {
    let unequippedUid = null
    setState((s) => {
      const target = s.inventory.find((i) => i.uid === uid)
      if (!target) return s
      const art = getArtifact(target.artifactId)
      const slot = slotForArtifact(art)
      
      // Validierung: Nur in den richtigen Slot erlauben
      // (Wird hier beim automatischen Slot-Binding erzwungen)

      const inventory = s.inventory.map((i) => {
        if (i.uid === uid) return { ...i, equipped: equip }
        // Beim Ausrüsten: anderes Artefakt im selben Slot automatisch ablegen
        if (equip && i.equipped && slotForArtifact(getArtifact(i.artifactId)) === slot) {
          unequippedUid = i.uid
          return { ...i, equipped: false }
        }
        return i
      })
      return { ...s, inventory }
    })
    if (REMOTE) {
      updateArtifact(uid, { equipped: equip })
      if (unequippedUid) updateArtifact(unequippedUid, { equipped: false })
    }
  }, [REMOTE])

  const toggleProtect = useCallback((uid) => {
    let willProtect = null
    setState((s) => {
      const item = s.inventory.find((i) => i.uid === uid); if (!item) return s
      const count = s.inventory.filter((i) => i.protected).length
      if (!item.protected && count >= MAX_PROTECTED_ARTIFACTS) return s
      willProtect = !item.protected
      return { ...s, inventory: s.inventory.map((i) => i.uid === uid ? { ...i, protected: willProtect } : i) }
    })
    if (REMOTE && willProtect !== null) updateArtifact(uid, { protected: willProtect })
  }, [])

  // ---------------- Boss ----------------
  const dealBossDamage = useCallback((difficulty) => {
    if (!state.boss || state.boss.defeated) return null
    const dmg = Math.round(calculateTaskDamage(difficulty, equippedArtifactIds, equippedArtifactIdsUnique, doubledArtifactIds) * eventDamageMult)
    // Optimistisch lokal
    setState((s) => {
      if (!s.boss || s.boss.defeated) return s
      const newHp = Math.max(0, s.boss.hp - dmg)
      return { ...s, boss: { ...s.boss, hp: newHp, myDamage: s.boss.myDamage + dmg, defeated: newHp <= 0 || s.boss.defeated } }
    })
    // Serverseitig atomar
    if (REMOTE && user) {
      const b = state.boss
      attackBoss({ weekStart, name: b.name, icon: b.icon, maxHp: b.maxHp, damage: dmg }).then((res) => {
        if (!res) return
        setState((s) => s.boss ? ({ ...s, boss: { ...s.boss, hp: res.boss_hp, myDamage: res.my_damage, communityDamage: Math.max(0, res.total_damage - res.my_damage), defeated: res.defeated } }) : s)
      })
    }
    return { dmg, defeated: state.boss.hp - dmg <= 0 }
  }, [state.boss, equippedArtifactIds, equippedArtifactIdsUnique, doubledArtifactIds, eventDamageMult, user, weekStart])

  const claimBossLoot = useCallback(async () => {
    if (!state.boss || state.boss.looted) return null
    const totalDmg = state.boss.myDamage + state.boss.communityDamage
    const percent = totalDmg > 0 ? (state.boss.myDamage / totalDmg) * 100 : 0
    const tier = getBossLootTier(percent); if (!tier) return null
    const art = rollArtifact(tier.minRarity)
    let item
    if (REMOTE && user) {
      item = await insertArtifact(user.id, art.id, 'boss')
      await markBossLooted(user.id, weekStart)
    }
    if (!item) item = { uid: newUid(), artifactId: art.id, equipped: false, protected: false, obtainedAt: new Date().toISOString(), source: 'boss' }
    setState((s) => ({ ...s, boss: { ...s.boss, looted: true }, inventory: [...s.inventory, item] }))
    setLastDrop({ artifact: art, source: 'boss' })
    return { artifact: art, tier, percent }
  }, [state.boss, user, weekStart, REMOTE])

  // Bereinige abgelaufene Items & Schritte-Reset nur bei Load-Änderung
  const inventoryCleanupRef = useRef(null)
  useEffect(() => {
    if (!loaded || !character) return
    const lastSync = character?.last_step_sync ? new Date(character.last_step_sync) : new Date(0)
    const nowDate = new Date()
    const diff = (nowDate - lastSync) / (1000 * 60 * 60 * 24)
    const updates = {}
    if (diff >= 7) {
      updates.weekly_steps = 0
      updates.steps_reward_claimed = false
    }
    if (lastSync.toDateString() !== nowDate.toDateString()) {
      updates.daily_steps = 0
    }
    if (Object.keys(updates).length > 0) {
      updateCharacter(updates)
    }
  }, [loaded, character?.last_step_sync, character?.weekly_steps])

  // Abgelaufene Items separat behandeln (nur bei Inventory-Änderungen)
  useEffect(() => {
    if (!loaded) return
    const nowIso = new Date().toISOString()
    const expired = state.inventory.filter(i => i.expiresAt && i.expiresAt < nowIso)
    if (expired.length > 0) {
      const expiredUids = expired.map(i => i.uid)
      setState(s => ({ ...s, inventory: s.inventory.filter(i => !expiredUids.includes(i.uid)) }))
      if (REMOTE) deleteArtifacts(expiredUids)
    }
  }, [loaded, state.inventory, REMOTE])

  // ---------------- Sonderquests ----------------
  const weeklyQuestInstances = useMemo(() => generateWeeklyQuests(weekStart, user?.id || ''), [weekStart, user])
  const completedInstanceIds = useMemo(() => new Set(state.questCompletions.map((c) => c.instanceId)), [state.questCompletions])

  const activeQuests = useMemo(() =>
    weeklyQuestInstances.filter((q) => isQuestActive(q, now) && !completedInstanceIds.has(q.id))
      .map((q) => ({ id: q.id, quest_id: q.quest_id, status: 'available', quests: q.template, assignedAt: q.assignedAt, expiresAt: q.expiresAt, durationDays: q.durationDays })),
    [weeklyQuestInstances, now, completedInstanceIds])

  const completedQuests = useMemo(() =>
    state.questCompletions.filter((c) => weeklyQuestInstances.some((q) => q.id === c.instanceId))
      .map((c) => ({ ...c, quests: getQuestTemplate(c.quest_id) })),
    [state.questCompletions, weeklyQuestInstances])

  const completeQuest = useCallback(async (instanceId) => {
    const inst = weeklyQuestInstances.find((q) => q.id === instanceId)
    if (!inst) return { error: { message: 'Quest nicht gefunden.' } }
    if (completedInstanceIds.has(instanceId)) return { error: { message: 'Bereits erledigt.' } }
    if (!isQuestActive(inst, Date.now())) return { error: { message: 'Quest ist abgelaufen.' } }
    const tpl = inst.template
    
    // Glücks-Bonus auf Drop-Chance: +0.5% pro Punkt
    const luck = charRef.current?.stats?.glueck || 0
    const luckBoost = luck * 0.005
    
    let xpGain = tpl.xp
    const setBonus = getSetXpBonusPercent(equippedArtifactIdsUnique)
    if (setBonus > 0) xpGain = Math.round(xpGain * (1 + setBonus / 100))

    let droppedArtifact = null, newItem = null
    if (Math.random() < ((tpl.dropChance ?? 0) + eventDropBoost + luckBoost)) {
      droppedArtifact = rollArtifact(tpl.minRarity || 'common')
      if (REMOTE && user) newItem = await insertArtifact(user.id, droppedArtifact.id, 'quest')
      if (!newItem) newItem = { uid: newUid(), artifactId: droppedArtifact.id, equipped: false, protected: false, obtainedAt: new Date().toISOString(), source: 'quest' }
    }

    const c = charRef.current
    if (updateCharacter && c) {
      const newXp = (c.xp || 0) + xpGain
      await updateCharacter({ xp: newXp, level: calculateLevel(newXp).level })
    }
    if (REMOTE && user) {
      await insertQuestCompletion(user.id, { instanceId, questId: tpl.id, xpGained: xpGain, artifactId: droppedArtifact?.id || null })
    }
    setState((s) => ({
      ...s,
      inventory: newItem ? [...s.inventory, newItem] : s.inventory,
      questCompletions: [...s.questCompletions, { instanceId, quest_id: tpl.id, completedAt: new Date().toISOString(), xpGained: xpGain, artifactId: droppedArtifact?.id || null }],
    }))
    if (droppedArtifact) setLastDrop({ artifact: droppedArtifact, source: 'quest' })
    return { xp: xpGain, artifact: droppedArtifact }
  }, [weeklyQuestInstances, completedInstanceIds, uniqueOwnedIds, updateCharacter, user])

  // ---------------- Crafting ----------------
  const craft = useCallback(async (uids) => {
    if (!uids || uids.length !== CRAFT_COST_COUNT) return { error: { message: `Genau ${CRAFT_COST_COUNT} Artefakte nötig.` } }
    const items = uids.map((uid) => state.inventory.find((i) => i.uid === uid)).filter(Boolean)
    if (items.length !== CRAFT_COST_COUNT) return { error: { message: 'Artefakte nicht gefunden.' } }
    const rarities = items.map((i) => getArtifact(i.artifactId)?.rarity)
    if (new Set(rarities).size !== 1) return { error: { message: 'Alle 3 Artefakte müssen dieselbe Seltenheit haben.' } }
    if (items.some((i) => i.protected)) return { error: { message: 'Geschützte Artefakte können nicht verschmolzen werden.' } }
    const rarity = rarities[0]
    if (!canCraft(rarity)) return { error: { message: 'Legendäre Artefakte können nicht weiter aufgewertet werden.' } }
    const c = charRef.current
    if ((c?.xp || 0) < CRAFT_FEE_XP) return { error: { message: `Nicht genug XP. Schmiedegebühr: ${CRAFT_FEE_XP} XP.` } }

    const result = rollCraftResult(rarity)
    if (updateCharacter) await updateCharacter({ xp: (c?.xp || 0) - CRAFT_FEE_XP })

    let newItem
    if (REMOTE && user) {
      await deleteArtifacts(uids)
      newItem = await insertArtifact(user.id, result.id, 'craft')
    }
    if (!newItem) newItem = { uid: newUid(), artifactId: result.id, equipped: false, protected: false, obtainedAt: new Date().toISOString(), source: 'craft' }

    setState((s) => ({ ...s, craftCount: (s.craftCount || 0) + 1, inventory: [...s.inventory.filter((i) => !uids.includes(i.uid)), newItem] }))
    setLastDrop({ artifact: result, source: 'craft' })
    return { result, resultRarity: craftResultRarity(rarity) }
  }, [state.inventory, updateCharacter, user])

  // ---------------- Arena ----------------
  const fightArena = useCallback(async (opponent) => {
    const c = charRef.current
    const myFighter = buildFighter(c?.name || 'Du', c?.stats, equippedArtifactIds, equippedArtifactIdsUnique, doubledArtifactIds)
    const oppEquipped = opponent.equippedArtifactIds || []
    const oppFighter = buildFighter(opponent.name || 'Gegner', opponent.stats || { staerke: 3, ausdauer: 4 }, oppEquipped, oppEquipped)
    const { winner, log, finalA, finalB } = simulateDuel(myFighter, oppFighter)
    const iWon = winner === 'a'

    let rewardArtifact = null
    let removedUids = []
    setState((s) => {
      let inv = [...s.inventory]
      if (iWon && opponent.stakeArtifactId) {
        const art = getArtifact(opponent.stakeArtifactId)
        if (art) { rewardArtifact = art }
      } else if (!iWon && opponent.stakeArtifactUid) {
        const lost = inv.find((i) => i.uid === opponent.stakeArtifactUid)
        if (lost && !lost.protected) { removedUids = [opponent.stakeArtifactUid]; inv = inv.filter((i) => i.uid !== opponent.stakeArtifactUid) }
      }
      const entry = { id: newUid(), opponent: opponent.name, won: iWon, at: new Date().toISOString() }
      return { ...s, inventory: inv, arena: { ...s.arena, wins: s.arena.wins + (iWon ? 1 : 0), losses: s.arena.losses + (iWon ? 0 : 1), history: [entry, ...(s.arena.history || [])].slice(0, 20) } }
    })

    // Persistenz
    if (REMOTE && user) {
      insertArenaResult(user.id, { opponentId: opponent.opponentId, opponentName: opponent.name, won: iWon, stakeArtifactId: opponent.stakeArtifactId || null, weekStart })
      if (removedUids.length) deleteArtifacts(removedUids)
      if (iWon && rewardArtifact) {
        const item = await insertArtifact(user.id, rewardArtifact.id, 'arena')
        if (item) setState((s) => ({ ...s, inventory: [...s.inventory, item] }))
      }
    } else if (iWon && rewardArtifact) {
      setState((s) => ({ ...s, inventory: [...s.inventory, { uid: newUid(), artifactId: rewardArtifact.id, equipped: false, protected: false, obtainedAt: new Date().toISOString(), source: 'arena' }] }))
    }

    if (!iWon && updateCharacter && c) await updateCharacter({ xp: (c.xp || 0) + ARENA_CONSOLATION_XP })
    if (rewardArtifact) setLastDrop({ artifact: rewardArtifact, source: 'arena' })
    return { iWon, log, myFighter, oppFighter, finalA, finalB, rewardArtifact, consolationXp: iWon ? 0 : ARENA_CONSOLATION_XP }
  }, [equippedArtifactIds, equippedArtifactIdsUnique, updateCharacter, user, weekStart])

  // ---------------- Freundes-Quests ----------------
  const friendTasks = useMemo(() => {
    if (!user) return []
    if (REMOTE) return remoteFriendTasks
    return mailbox.filter((t) => t.sender_id === user.id || t.receiver_id === user.id)
  }, [REMOTE, remoteFriendTasks, mailbox, user])

  const pendingFriendTasksCount = useMemo(
    () => friendTasks.filter((t) => t.receiver_id === user?.id && t.status === 'pending').length,
    [friendTasks, user])

  const sendFriendTask = useCallback(async ({ friendId, friendName, questId, customTitle = '', customDescription = '', mode = 'gift', message = '', stakeXp = 0 }) => {
    if (!user) return { error: { message: 'Nicht eingeloggt' } }
    const isCustom = questId === '__custom__'
    if (isCustom) {
      if (!customTitle.trim()) return { error: { message: 'Bitte einen Titel für die eigene Quest angeben.' } }
    } else {
      if (!questId) return { error: { message: 'Bitte eine Quest wählen.' } }
      if (!getQuestTemplate(questId)) return { error: { message: 'Unbekannte Quest.' } }
    }
    const senderName = profile?.username || character?.name || 'Held'
    if (REMOTE) {
      const { error } = await insertFriendTask({
        sender_id: user.id, receiver_id: friendId, sender_name: senderName, receiver_name: friendName || null,
        quest_id: questId, custom_title: isCustom ? customTitle.trim() : null,
        custom_description: isCustom ? (customDescription.trim() || null) : null,
        mode, message, stake_xp: stakeXp,
      })
      if (error) return { error: { message: error.message } }
      refreshFriendTasks()
      return { error: null }
    }
    const task = { id: newUid(), sender_id: user.id, sender_name: senderName, receiver_id: friendId, receiver_name: friendName || null, quest_id: questId, custom_title: isCustom ? customTitle.trim() : null, custom_description: isCustom ? (customDescription.trim() || null) : null, mode, message: message || '', stake_xp: stakeXp || 0, status: 'pending', created_at: new Date().toISOString() }
    const box = readMailbox(); box.push(task); writeMailbox(box); setMailbox(box)
    return { error: null }
  }, [user, profile, character, refreshFriendTasks])

  const acceptFriendTask = useCallback(async (id) => {
    if (REMOTE) { await updateFriendTaskStatus(id, 'accepted'); refreshFriendTasks() }
    else { const box = readMailbox().map((t) => t.id === id ? { ...t, status: 'accepted' } : t); writeMailbox(box); setMailbox(box) }
  }, [refreshFriendTasks])

  const declineFriendTask = useCallback(async (id) => {
    if (REMOTE) { await updateFriendTaskStatus(id, 'declined'); refreshFriendTasks() }
    else { const box = readMailbox().map((t) => t.id === id ? { ...t, status: 'declined' } : t); writeMailbox(box); setMailbox(box) }
  }, [refreshFriendTasks])

  const completeFriendTask = useCallback(async (id) => {
    if (REMOTE) {
      const { reward, error } = await completeFriendTaskRpc(id)
      if (error) return { error: { message: error.message } }
      await refreshFriendTasks()
      if (reloadCharacter) await reloadCharacter()  // eigene (Empfänger-)XP aktualisieren
      return { reward }
    }
    // Lokaler Fallback (wie zuvor)
    const task = readMailbox().find((t) => t.id === id)
    if (!task || task.receiver_id !== user?.id) return { error: { message: 'Nicht erlaubt.' } }
    const reward = FRIEND_QUEST_XP + (task.stake_xp || 0)
    const c = charRef.current
    if (updateCharacter && c) { const newXp = (c.xp || 0) + reward; await updateCharacter({ xp: newXp, level: calculateLevel(newXp).level }) }
    try { const key = pendingRewardsKey(task.sender_id); const pending = JSON.parse(localStorage.getItem(key) || '[]'); pending.push({ xp: reward }); localStorage.setItem(key, JSON.stringify(pending)) } catch { /* ignore */ }
    const box = readMailbox().map((t) => t.id === id ? { ...t, status: 'completed', completed_at: new Date().toISOString() } : t); writeMailbox(box); setMailbox(box)
    return { reward }
  }, [user, updateCharacter, refreshFriendTasks, reloadCharacter])

  // ---------------- Monster System ----------------
  const catchMonster = useCallback(async (monsterId, nickname = null) => {
    if (!user) return null
    const m = MONSTER_MAP[monsterId]
    if (!m) return null
    
    // Zufällige IVs (Individual Values) für Stats
    const stats = {
      hp: m.baseStats.hp + Math.floor(Math.random() * 10),
      atk: m.baseStats.atk + Math.floor(Math.random() * 5),
      def: m.baseStats.def + Math.floor(Math.random() * 5),
    }

    let caught
    if (REMOTE) {
      caught = await insertUserMonster(user.id, monsterId, stats, m.moves, nickname)
    } else {
      caught = { id: newUid(), monster_id: monsterId, stats, moves: m.moves, nickname, caught_at: new Date().toISOString(), level: 1, xp: 0 }
    }
    
    if (caught) setUserMonsters(prev => [caught, ...prev])
    return caught
  }, [user, REMOTE])

  const updateTeam = useCallback(async (slots) => {
    if (!user) return
    setUserTeam(slots)
    if (REMOTE) {
      await upsertUserTeam(user.id, slots)
    }
  }, [user, REMOTE])

  const deleteMonster = useCallback(async (monsterUid) => {
    if (!user) return
    
    // Zuerst aus dem Team entfernen, falls vorhanden
    setUserTeam(prev => {
      const next = { ...prev }
      if (next.slot_1 === monsterUid) next.slot_1 = null
      if (next.slot_2 === monsterUid) next.slot_2 = null
      if (next.slot_3 === monsterUid) next.slot_3 = null
      
      if (REMOTE) {
        upsertUserTeam(user.id, next)
      }
      return next
    })

    // Dann aus der Sammlung entfernen
    setUserMonsters(prev => prev.filter(m => m.id !== monsterUid))
    
    if (REMOTE) {
      await releaseMonster(monsterUid)
    }
  }, [user, REMOTE])

  const spawnMiniBoss = useCallback((password = '') => {
    if (password !== 'test') {
      const p = window.prompt("Entwickler-Passwort erforderlich:")
      if (p !== 'test') return null
    }
    const pool = MONSTERS.filter(m => m.rarity !== 'legendary')
    const boss = pool[Math.floor(Math.random() * pool.length)]
    setActiveMiniBoss({
      ...boss,
      hp: boss.baseStats.hp * 2,
      maxHp: boss.baseStats.hp * 2,
      isMiniBoss: true,
      monster_id: boss.id // WICHTIG: monster_id setzen für catchMonster
    })
    return boss
  }, [])

  // ---------------- Monster Affection / Decay ----------------
  useEffect(() => {
    if (!loaded || !userMonsters.length) return
    const interval = setInterval(() => {
      setUserMonsters(prev => {
        let changed = false
        const next = prev.map(m => {
          if ((m.affection || 100) > 0) {
            changed = true
            const newAff = Math.max(0, (m.affection || 100) - 1)
            // Fire-and-forget Persistenz – nicht im setState blocken
            if (REMOTE) {
              setTimeout(() => updateMonster(m.id, { affection: newAff }), 0)
            }
            return { ...m, affection: newAff }
          }
          return m
        })
        return changed ? next : prev
      })
    }, 1000 * 60 * 60) // -1 Affection pro Stunde
    return () => clearInterval(interval)
  }, [loaded, userMonsters, REMOTE])

  const interactWithMonster = useCallback(async (monsterUid, type = 'pet') => {
    const m = userMonsters.find(it => it.id === monsterUid)
    if (!m) return
    const bonus = type === 'feed' ? 20 : 10
    const newAff = Math.min(100, (m.affection || 0) + bonus)
    setUserMonsters(prev => prev.map(it => it.id === monsterUid ? { ...it, affection: newAff, last_interaction: new Date().toISOString() } : it))
    if (REMOTE) await updateMonster(monsterUid, { affection: newAff, last_interaction: new Date().toISOString() })
    vibrate(VIBRATION_PATTERNS.SUCCESS)
  }, [userMonsters, REMOTE])

  // ---------------- DEV / Demo ----------------
  const grantRandomArtifact = useCallback((minRarity = 'common') => addArtifact(rollArtifact(minRarity).id, 'quest'), [addArtifact])

  const value = {
    loaded, isRemote: REMOTE,
    inventory: state.inventory, characterArtifacts, ownedArtifactIds: uniqueOwnedIds,
    equippedBySlot, equippedArtifactIdsUnique,
    equippedItems, equippedArtifactIds, protectedCount,
    addArtifact, equipArtifact, toggleProtect, grantRandomArtifact, lastDrop, clearLastDrop,
    boss: state.boss, dealBossDamage, claimBossLoot,
    loadout, setLoadoutSlot, doubledArtifactIds, equipSlots: EQUIP_SLOTS,
    todayEvent,
    setProgress, completedSetBonuses,
    craft,
    arena: state.arena, fightArena,
    dailyQuests: activeQuests, activeQuests, completedQuests, completeQuest,
    questCatalog: SPECIAL_QUESTS, questMap: QUEST_MAP, now,
    friendTasks, pendingFriendTasksCount, sendFriendTask, acceptFriendTask, declineFriendTask, completeFriendTask,
    allArtifacts: ARTIFACTS,
    userMonsters, userTeam, activeMiniBoss, setActiveMiniBoss, catchMonster, updateTeam, spawnMiniBoss, setUserMonsters,
    allMonsters: MONSTERS, monsterMap: MONSTER_MAP,
    claimStepReward, syncSteps,
    interactWithMonster, deleteMonster
  }

  async function claimStepReward() {
    if (!user || !character || character.steps_reward_claimed) return
    let rarity = 'common'
    const steps = character.weekly_steps || 0
    if (steps >= 80000) rarity = 'legendary'
    else if (steps >= 60000) rarity = 'epic'
    else if (steps >= 50000) rarity = 'rare'
    else return

    await addArtifact(rollArtifact(rarity).id, 'quest')
    await updateCharacter({ steps_reward_claimed: true })
  }

  async function syncSteps(steps) {
    if (!user) return
    const newWeekly = (character.weekly_steps || 0) + steps
    const newDaily = (character.daily_steps || 0) + steps
    await updateCharacter({ 
      total_steps: (character.total_steps || 0) + steps,
      weekly_steps: newWeekly,
      daily_steps: newDaily,
      last_step_sync: new Date().toISOString()
    })
  }

  return <AdventureContext.Provider value={value}>{children}</AdventureContext.Provider>
}

export function useAdventure() {
  const context = useContext(AdventureContext)
  if (!context) throw new Error('useAdventure muss innerhalb eines AdventureProvider verwendet werden')
  return context
}

export default AdventureContext
