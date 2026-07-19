// Datei: src/pages/QuestsPage.jsx
// Sonderquests – automatisch generierte Quests mit extra XP & höherer
// Artefakt-Drop-Chance. 1–3 pro Woche, jeweils nur 2–3 Tage verfügbar.
import { useState } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { Sparkles, Clock, Gift, CheckCircle2, ScrollText } from 'lucide-react'
import { formatTimeLeft } from '../utils/quests'
import { rarityInfo } from '../utils/adventure'
import EmptyState from '../components/EmptyState'

const categoryEmojis = { haushalt: '🏠', gesundheit: '💊', lernen: '📚', arbeit: '💼', sport: '🏋️' }

export default function QuestsPage() {
  const { activeQuests, completedQuests, completeQuest, now } = useAdventure()
  const [busy, setBusy] = useState(null)
  const [result, setResult] = useState(null)

  const handleComplete = async (id) => {
    setBusy(id); setResult(null)
    const res = await completeQuest(id)
    if (!res?.error) setResult({ id, ...res })
    setBusy(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><ScrollText className="w-6 h-6" />Sonderquests</h1>

      <div className="card text-sm text-gray-400">
        <p>Sonderquests erscheinen <b className="text-gray-200">1–3× pro Woche</b> und sind nur <b className="text-gray-200">2–3 Tage</b> verfügbar. Sie geben <b className="text-gold-400">extra XP</b> und haben eine <b className="text-gold-400">deutlich höhere Artefakt-Drop-Chance</b>.</p>
      </div>

      {/* Aktive Quests */}
      <div>
        <h2 className="font-title text-lg text-gray-200 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold-500" />Verfügbar ({activeQuests.length})</h2>
        {activeQuests.length === 0 ? (
          <EmptyState emoji="🗺️" title="Keine Sonderquest aktiv" subtitle="Die Späher sind unterwegs … neue Quests erscheinen im Laufe der Woche!" />
        ) : (
          <div className="space-y-3">
            {activeQuests.map((q) => {
              const tpl = q.quests
              const r = rarityInfo(tpl.minRarity)
              const justDone = result?.id === q.id
              return (
                <div key={q.id} className="card border-gold-500/20 relative overflow-hidden">
                  <div className="absolute right-2 top-1 text-6xl opacity-10 pointer-events-none">{tpl.icon}</div>
                  <div className="relative z-10">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{tpl.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-title text-gray-100">{tpl.title}</h3>
                          <span className="badge bg-dark-400 text-gray-400 border border-gray-700">{categoryEmojis[tpl.category] || '📝'} {tpl.category}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{tpl.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-gold-400 font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3" />+{tpl.xp} XP</span>
                          <span className={`flex items-center gap-1 ${r.text}`}><Gift className="w-3 h-3" />{Math.round((tpl.dropChance || 0) * 100)}% Drop (min. {r.name})</span>
                          <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeLeft(q.expiresAt, now)}</span>
                        </div>
                      </div>
                    </div>
                    {justDone ? (
                      <div className="mt-3 bg-green-900/30 border border-green-700/40 rounded-lg px-3 py-2 text-green-300 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> +{result.xp} XP{result.artifact ? ` · Artefakt erhalten: ${result.artifact.icon} ${result.artifact.name}!` : ' · kein Artefakt diesmal'}
                      </div>
                    ) : (
                      <button onClick={() => handleComplete(q.id)} disabled={busy === q.id} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {busy === q.id ? 'Wird abgeschlossen...' : 'Quest erfüllt!'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Erledigte Quests */}
      {completedQuests.length > 0 && (
        <div>
          <h2 className="font-title text-lg text-gray-200 mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" />Diese Woche erledigt ({completedQuests.length})</h2>
          <div className="space-y-2 opacity-70">
            {completedQuests.map((c) => (
              <div key={c.instanceId} className="card flex items-center gap-3 py-2 border-green-800/20">
                <span className="text-xl">{c.quests?.icon || '✅'}</span>
                <span className="flex-1 text-sm text-gray-300">{c.quests?.title || c.quest_id}</span>
                <span className="text-xs text-gold-500">+{c.xpGained} XP</span>
                {c.artifactId && <span className="text-xs">💎</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
