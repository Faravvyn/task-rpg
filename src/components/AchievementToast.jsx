// Freischalt-Feier für Meilensteine & (geheime) Errungenschaften.
import { useEffect } from 'react'
import { useAchievements } from '../context/AchievementContext'
import { playAchievement } from '../utils/sound'
import { Trophy, Star } from 'lucide-react'

export default function AchievementToast() {
  const { celebration, dismissCelebration } = useAchievements()

  useEffect(() => {
    if (celebration) {
      playAchievement()
      const t = setTimeout(dismissCelebration, 6000)
      return () => clearTimeout(t)
    }
  }, [celebration, dismissCelebration])

  if (!celebration) return null
  const { items, totalXp } = celebration

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 cursor-pointer animate-fade-in" onClick={dismissCelebration}>
      <div className="ach-pop bg-dark-300 border-2 border-gold-500/50 rounded-2xl px-6 py-7 max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Trophy className="w-12 h-12 text-gold-400 mx-auto mb-2 animate-pulse" />
        <h2 className="font-title text-2xl text-gold-300">
          {items.length > 1 ? `${items.length} Freischaltungen!` : (items[0].kind === 'achievement' ? 'Errungenschaft!' : 'Meilenstein erreicht!')}
        </h2>
        {items.some((i) => i.kind === 'achievement' && i.hidden) && (
          <p className="text-xs text-purple-300 mt-1">🔓 Geheime Errungenschaft entdeckt!</p>
        )}

        <div className="space-y-2 mt-4">
          {items.map((it) => (
            <div key={it.kind + it.id} className="flex items-center gap-3 bg-dark-400/60 rounded-lg px-3 py-2 text-left">
              <span className="text-3xl">{it.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-100 truncate">{it.title}</p>
                <p className="text-xs text-gray-500 truncate">{it.desc}</p>
              </div>
              {it.rewardXp > 0 && <span className="text-xs text-gold-400 font-bold whitespace-nowrap">+{it.rewardXp} XP</span>}
            </div>
          ))}
        </div>

        {totalXp > 0 && (
          <p className="mt-4 text-gold-400 font-title flex items-center justify-center gap-1">
            <Star className="w-4 h-4" /> +{totalXp} XP erhalten
          </p>
        )}
        <p className="text-gray-600 text-xs mt-4">Tippen zum Schließen</p>
      </div>
    </div>
  )
}
