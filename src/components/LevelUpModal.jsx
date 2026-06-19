import { useEffect, useState } from 'react'
import { useGame } from '../hooks/useGame'
import { useCharacter } from '../hooks/useCharacter'
import { Sparkles } from 'lucide-react'
import { playLevelUp } from '../utils/sound'

// Vollbild-Level-Up-Moment mit aufsteigenden Partikeln, Strahlenkranz,
// Skalierungs-Animation und optionalem Sound.
export default function LevelUpModal() {
  const { levelUpModal, dispatch } = useGame()
  const { levelInfo } = useCharacter()
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (levelUpModal) {
      playLevelUp()
      const t1 = setTimeout(() => setAnimate(true), 60)
      const t2 = setTimeout(() => { setAnimate(false); dispatch({ type: 'HIDE_LEVEL_UP' }) }, 4200)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [levelUpModal, dispatch])

  if (!levelUpModal) return null

  return (
    <div className="level-up-overlay" onClick={() => dispatch({ type: 'HIDE_LEVEL_UP' })}>
      {/* Strahlenkranz */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-[140vmax] h-[140vmax] rounded-full animate-[spin_14s_linear_infinite]"
          style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(212,160,23,0.10) 12deg, transparent 24deg, rgba(212,160,23,0.10) 36deg, transparent 48deg, rgba(212,160,23,0.10) 60deg, transparent 72deg, rgba(212,160,23,0.10) 84deg, transparent 96deg)' }} />
      </div>

      {/* Aufsteigende Partikel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 44 }).map((_, i) => (
          <span key={i} className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`, bottom: `-10px`,
              width: `${4 + Math.random() * 8}px`, height: `${4 + Math.random() * 8}px`,
              backgroundColor: ['#FFD040', '#D4A017', '#FFE699', '#FFF0BF', '#FFFFFF'][i % 5],
              boxShadow: '0 0 8px rgba(212,160,23,0.8)',
              animation: `levelUpRise ${2.2 + Math.random() * 2}s ease-in ${Math.random() * 1.2}s forwards`,
            }} />
        ))}
      </div>

      <div className={`text-center z-10 transition-all duration-500 ${animate ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <Sparkles className="w-20 h-20 text-gold-400 mx-auto mb-4 animate-pulse" />
        <h1 className="font-title text-6xl md:text-8xl text-gold-400 neon-glow mb-4 animate-glow">LEVEL UP!</h1>
        <div className="bg-dark-300/80 backdrop-blur-sm rounded-2xl px-10 py-6 border border-gold-500/30 inline-block">
          <p className="text-gray-300 text-lg mb-1">Du bist jetzt</p>
          <p className="font-title text-5xl text-gold-300 font-bold mb-2">Level {levelInfo.level}</p>
          <p className="text-gray-400">+2 Statuspunkte freigeschaltet!</p>
        </div>
        <p className="text-gray-600 text-xs mt-6">Tippen zum Schließen</p>
      </div>
    </div>
  )
}