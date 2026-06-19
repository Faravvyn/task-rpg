import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGame } from './useGame'
import { calculateLevel, classDefinitions, statNames, statColors } from '../utils/xp'
import { calculateStreak, calculateTodayXp, calculateWeekXp, hasCompletedToday } from '../utils/streak'
export function useCharacter() {
  const { character, profile } = useAuth()
  const { completions } = useGame()
  const levelInfo = useMemo(() => {
    if (!character) return { level:1, currentXpInLevel:0, xpNeededForNextLevel:100, progressPercent:0 }
    return calculateLevel(character.xp || 0)
  }, [character])
  const streak = useMemo(() => calculateStreak(completions), [completions])
  const todayXp = useMemo(() => calculateTodayXp(completions), [completions])
  const weekXp = useMemo(() => calculateWeekXp(completions), [completions])
  const hasDoneTaskToday = useMemo(() => hasCompletedToday(completions), [completions])
  const classInfo = useMemo(() => character ? classDefinitions[character.class] || null : null, [character])
  const displayStats = useMemo(() => {
    if (!character?.stats) return []
    return Object.entries(character.stats).map(([key, value]) => ({
      key, value, name: statNames[key] || key, color: statColors[key] || 'bg-gray-500'
    }))
  }, [character])
  return { character, profile, levelInfo, streak, todayXp, weekXp, hasDoneTaskToday, classInfo, displayStats, completions }
}