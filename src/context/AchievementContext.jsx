// =====================================================================
// AchievementContext – Meilensteine, (geheime) Errungenschaften und
// Zufalls-Events. Wertet Fortschritt aus Game/Adventure/Auth aus,
// vergibt XP-Belohnungen und zeigt eine Freischalt-Feier.
//
// Persistenz: localStorage pro Nutzer (freigeschaltete IDs).
// =====================================================================
import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useGame } from './GameContext'
import { useAdventure } from './AdventureContext'
import { MILESTONES, ACHIEVEMENTS, getTodayEvent } from '../utils/achievements'
import { calculateStreak, formatDate } from '../utils/streak'
import { calculateLevel } from '../utils/xp'
import { rarityInfo } from '../utils/adventure'
import { useRemote, fetchUserAchievements, insertUserAchievement } from '../lib/adventureRepo'

const AchievementContext = createContext({})
const unlockedKey = (uid) => `taskrpg_unlocked_${uid}`

export function AchievementProvider({ children }) {
  const { user, character, updateCharacter } = useAuth()
  const { completions, tasks, friends } = useGame()
  const { characterArtifacts, ownedArtifactIds, setProgress, boss, arena, friendTasks } = useAdventure()
  const REMOTE = useRemote()

  const [unlocked, setUnlocked] = useState(() => new Set())
  const [celebration, setCelebration] = useState(null)  // { items: [{type,icon,title,rewardXp}] }
  const [loading, setLoading] = useState(true)
  const initRef = useRef(false)
  const charRef = useRef(character)
  useEffect(() => { charRef.current = character }, [character])

  // ---- Laden ----
  useEffect(() => {
    if (!user) { setUnlocked(new Set()); initRef.current = false; setLoading(false); return }
    let cancelled = false
    
    async function load() {
      if (REMOTE) {
        const remoteIds = await fetchUserAchievements(user.id)
        if (cancelled) return
        setUnlocked(new Set(remoteIds))
      } else {
        try {
          const raw = localStorage.getItem(unlockedKey(user.id))
          setUnlocked(new Set(raw ? JSON.parse(raw) : []))
        } catch { setUnlocked(new Set()) }
      }
      initRef.current = false
      setLoading(false)
    }
    
    load()
    return () => { cancelled = true }
  }, [user, REMOTE])

  const persist = useCallback((ids) => {
    if (!user) return
    if (REMOTE) {
      const arr = Array.from(ids)
      arr.forEach(id => insertUserAchievement(user.id, id))
    } else {
      try { localStorage.setItem(unlockedKey(user.id), JSON.stringify(Array.from(ids))) } catch { /* ignore */ }
    }
  }, [user, REMOTE])

  // ---- Statistik aus allen Quellen zusammenbauen ----
  const stats = useMemo(() => {
    const comp = completions || []
    let before9 = 0, after23 = 0, weekend = 0
    const perDay = {}
    for (const c of comp) {
      const d = new Date(c.completed_at)
      const h = d.getHours()
      if (h < 9) before9++
      if (h >= 23) after23++
      const wd = d.getDay()
      if (wd === 0 || wd === 6) weekend++
      const key = formatDate(c.completed_at)
      perDay[key] = (perDay[key] || 0) + 1
    }
    const maxTasksInOneDay = Object.values(perDay).reduce((m, v) => Math.max(m, v), 0)

    // Comeback: irgendeine Lücke ≥ 3 Tage zwischen aktiven Tagen, danach wieder aktiv
    const days = Object.keys(perDay).sort()
    let hadComeback = false
    for (let i = 1; i < days.length; i++) {
      const gap = (new Date(days[i]) - new Date(days[i - 1])) / 86400000
      if (gap >= 3) { hadComeback = true; break }
    }

    const hasLegendary = (characterArtifacts || []).some((c) => c.artifacts?.rarity === 'legendary')
    const completedSets = (setProgress || []).filter((p) => p.complete).length
    const questsDone = comp.length && false ? 0 : 0 // (Quest-Completions separat unten)

    return {
      totalCompletions: comp.length,
      streak: calculateStreak(comp),
      level: character ? calculateLevel(character.xp || 0).level : 1,
      currentXp: character?.xp || 0,
      artifactCount: (characterArtifacts || []).length,
      hasLegendary,
      completedSets,
      friendCount: (friends || []).length,
      arenaWins: arena?.wins || 0,
      bossDefeatedContrib: !!(boss?.defeated && (boss?.myDamage || 0) > 0),
      friendQuestsSent: (friendTasks || []).filter((t) => t.sender_id === user?.id).length,
      tasksBefore9: before9,
      tasksAfter23: after23,
      weekendTasks: weekend,
      maxTasksInOneDay,
      hadComeback,
      questsDone,
    }
  }, [completions, character, characterArtifacts, setProgress, friends, arena, boss, friendTasks, user])

  // questsDone aus Adventure-Quest-Completions (separat, da nicht in stats-Closure)
  const { completedQuests } = useAdventure()
  const statsWithQuests = useMemo(() => ({ ...stats, questsDone: (completedQuests || []).length }), [stats, completedQuests])

  // ---- Fortschritt der Meilensteine ----
  const milestoneProgress = useMemo(() => MILESTONES.map((m) => {
    const value = statsWithQuests[m.metric] || 0
    return { ...m, value, percent: Math.min(100, Math.round((value / m.goal) * 100)), done: value >= m.goal || unlocked.has('ms_' + m.id) }
  }), [statsWithQuests, unlocked])

  // ---- Achievements (mit hidden-Logik) ----
  const achievementStates = useMemo(() => ACHIEVEMENTS.map((a) => ({
    ...a, done: unlocked.has('ac_' + a.id) || (() => { try { return a.cond(statsWithQuests) } catch { return false } })(),
  })), [statsWithQuests, unlocked])

  // ---- Erkennung neuer Freischaltungen + Belohnung ----
  useEffect(() => {
    if (!user || !character) return
    // Erster Lauf: bereits erfüllte still als freigeschaltet markieren (kein Spam, keine XP)
    if (!initRef.current) {
      const next = new Set(unlocked)
      let changed = false
      for (const m of MILESTONES) if ((statsWithQuests[m.metric] || 0) >= m.goal && !next.has('ms_' + m.id)) { next.add('ms_' + m.id); changed = true }
      for (const a of ACHIEVEMENTS) { let ok = false; try { ok = a.cond(statsWithQuests) } catch {} if (ok && !next.has('ac_' + a.id)) { next.add('ac_' + a.id); changed = true } }
      if (changed) { setUnlocked(next); persist(next) }
      initRef.current = true
      return
    }

    const newlyUnlocked = []
    const next = new Set(unlocked)
    for (const m of MILESTONES) {
      const id = 'ms_' + m.id
      if (!next.has(id) && (statsWithQuests[m.metric] || 0) >= m.goal) { next.add(id); newlyUnlocked.push({ kind: 'milestone', ...m }) }
    }
    for (const a of ACHIEVEMENTS) {
      const id = 'ac_' + a.id
      let ok = false; try { ok = a.cond(statsWithQuests) } catch {}
      if (!next.has(id) && ok) { next.add(id); newlyUnlocked.push({ kind: 'achievement', ...a }) }
    }
    if (newlyUnlocked.length > 0) {
      setUnlocked(next); persist(next)
      const totalXp = newlyUnlocked.reduce((s, it) => s + (it.rewardXp || 0), 0)
      if (totalXp > 0 && updateCharacter) {
        const c = charRef.current
        const newXp = (c.xp || 0) + totalXp
        updateCharacter({ xp: newXp, level: calculateLevel(newXp).level })
      }
      setCelebration({ items: newlyUnlocked, totalXp })
    }
  }, [statsWithQuests, user, character, unlocked, persist, updateCharacter])

  const dismissCelebration = useCallback(() => setCelebration(null), [])

  // ---- Zufalls-Event des Tages ----
  const todayEvent = useMemo(() => getTodayEvent(formatDate(new Date())), [])

  const unlockedCount = useMemo(() =>
    achievementStates.filter((a) => a.done).length + milestoneProgress.filter((m) => m.done).length,
    [achievementStates, milestoneProgress])

  const value = {
    stats: statsWithQuests,
    milestones: milestoneProgress,
    achievements: achievementStates,
    unlockedCount,
    totalCount: MILESTONES.length + ACHIEVEMENTS.length,
    celebration, dismissCelebration,
    todayEvent,
  }

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>
}

export function useAchievements() {
  const ctx = useContext(AchievementContext)
  if (!ctx) throw new Error('useAchievements muss innerhalb eines AchievementProvider verwendet werden')
  return ctx
}

export default AchievementContext