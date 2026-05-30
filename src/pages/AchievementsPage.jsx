// Datei: src/pages/AchievementsPage.jsx
// Meilensteine + (geheime) Errungenschaften. Geheime, noch nicht entdeckte
// Achievements erscheinen als "???".
import { useAchievements } from '../context/AchievementContext'
import EmptyState from '../components/EmptyState'
import { Award, Trophy, Lock, Star, HelpCircle } from 'lucide-react'

export default function AchievementsPage() {
  const { milestones, achievements, unlockedCount, totalCount } = useAchievements()

  const visibleAch = achievements.filter((a) => !a.hidden || a.done)
  const hiddenLocked = achievements.filter((a) => a.hidden && !a.done)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Award className="w-6 h-6" />Errungenschaften</h1>
        <span className="text-sm text-gray-400">{unlockedCount}/{totalCount}</span>
      </div>

      <div className="card">
        <div className="stat-bar"><div className="stat-bar-fill bg-gold-500" style={{ width: `${(unlockedCount / totalCount) * 100}%` }} /></div>
        <p className="text-xs text-gray-500 mt-2">Tipp: Manche Errungenschaften sind <span className="text-purple-300">geheim</span> – entdecke sie durch Spielen!</p>
      </div>

      {/* Meilensteine */}
      <div>
        <h2 className="font-title text-lg text-gray-200 mb-3 flex items-center gap-2"><Trophy className="w-5 h-5 text-gold-500" />Meilensteine</h2>
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className={`card ${m.done ? 'border-green-700/30' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${m.done ? '' : 'grayscale opacity-50'}`}>{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${m.done ? 'text-gray-100' : 'text-gray-300'}`}>{m.title}</p>
                    {m.done && <span className="badge bg-green-900/40 text-green-300 border border-green-700/40">✓</span>}
                  </div>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                  {!m.done && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="stat-bar flex-1"><div className="stat-bar-fill bg-gold-500" style={{ width: `${m.percent}%` }} /></div>
                      <span className="text-[11px] text-gray-500 font-mono">{m.value}/{m.goal}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gold-500 font-bold whitespace-nowrap flex items-center gap-0.5"><Star className="w-3 h-3" />{m.rewardXp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Errungenschaften */}
      <div>
        <h2 className="font-title text-lg text-gray-200 mb-3 flex items-center gap-2"><Award className="w-5 h-5 text-gold-500" />Errungenschaften</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleAch.map((a) => (
            <div key={a.id} className={`card flex items-center gap-3 ${a.done ? 'border-gold-700/30' : ''}`}>
              <span className={`text-2xl ${a.done ? '' : 'grayscale opacity-40'}`}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className={`font-semibold truncate ${a.done ? 'text-gray-100' : 'text-gray-400'}`}>{a.title}</p>
                  {a.hidden && a.done && <span className="text-[10px] text-purple-300">geheim</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{a.desc}</p>
              </div>
              {a.done
                ? <span className="text-xs text-gold-500 font-bold flex items-center gap-0.5"><Star className="w-3 h-3" />{a.rewardXp}</span>
                : <Lock className="w-4 h-4 text-gray-600" />}
            </div>
          ))}

          {/* Geheime, unentdeckte als ??? */}
          {hiddenLocked.map((a) => (
            <div key={a.id} className="card flex items-center gap-3 border-dashed border-gray-700">
              <span className="text-2xl opacity-40"><HelpCircle className="w-6 h-6 text-purple-400/60" /></span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-500">???</p>
                <p className="text-xs text-gray-600">Geheime Errungenschaft – noch nicht entdeckt</p>
              </div>
              <Lock className="w-4 h-4 text-gray-700" />
            </div>
          ))}
        </div>
        {visibleAch.length === 0 && hiddenLocked.length === 0 && (
          <EmptyState emoji="🏆" title="Noch keine Errungenschaften" subtitle="Erledige Aufgaben, um deine ersten Trophäen zu verdienen!" />
        )}
      </div>
    </div>
  )
}