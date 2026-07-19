import { useEffect, useRef } from 'react'
import { useCharacter } from '../hooks/useCharacter'
export default function XPBar({ compact = false }) {
  const { levelInfo, character } = useCharacter()
  const barRef = useRef(null)
  useEffect(() => {
    if (barRef.current) barRef.current.style.width = `${levelInfo.progressPercent}%`
  }, [levelInfo.progressPercent])
  if (!character) return null
  if (compact) return (
    <div className="flex items-center gap-2">
      <span className="text-gold-400 font-title font-bold text-sm">Lv.{levelInfo.level}</span>
      <div className="flex-1 h-2 bg-dark-400 rounded-full overflow-hidden">
        <div ref={barRef} className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full transition-all duration-1000 ease-out" style={{width:'0%'}} />
      </div>
      <span className="text-gray-400 text-xs">{levelInfo.currentXpInLevel}/{levelInfo.xpNeededForNextLevel}</span>
    </div>
  )
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="font-title text-gold-400 font-bold">Level {levelInfo.level}</span>
        <span className="text-sm text-gray-400">{levelInfo.currentXpInLevel} / {levelInfo.xpNeededForNextLevel} XP</span>
      </div>
      <div className="w-full h-3 bg-dark-400 rounded-full overflow-hidden border border-gray-700">
        <div ref={barRef} className="h-full bg-gradient-to-r from-gold-700 via-gold-500 to-gold-300 rounded-full transition-all duration-1000 ease-out relative" style={{width:'0%'}}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  )
}
