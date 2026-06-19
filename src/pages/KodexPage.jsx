// Datei: src/pages/KodexPage.jsx
// Sammelalbum / Kodex – Themen-Sets vervollständigen für permanente Boni.
// Nicht gefundene Artefakte erscheinen als Silhouetten mit "???".
import { useAdventure } from '../context/AdventureContext'
import { SETS, getArtifact, rarityInfo } from '../utils/adventure'
import { BookOpen, CheckCircle2, Lock } from 'lucide-react'

export default function KodexPage() {
  const { ownedArtifactIds, setProgress, completedSetBonuses } = useAdventure()
  const owned = new Set(ownedArtifactIds)

  const totalArtifacts = SETS.reduce((s, set) => s + set.artifactIds.length, 0)
  const totalOwned = SETS.reduce((s, set) => s + set.artifactIds.filter((id) => owned.has(id)).length, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><BookOpen className="w-6 h-6" />Kodex</h1>

      {/* Gesamtfortschritt */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-title text-gray-200">Sammlung</h3>
          <span className="text-gold-400 font-mono">{totalOwned} / {totalArtifacts}</span>
        </div>
        <div className="stat-bar"><div className="stat-bar-fill bg-gold-500" style={{ width: `${(totalOwned / totalArtifacts) * 100}%` }} /></div>
        {completedSetBonuses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {completedSetBonuses.map((b, i) => (
              <span key={i} className="badge bg-green-900/40 text-green-300 border border-green-700/40">✓ {b.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Sets */}
      {setProgress.map(({ set, complete, ownedCount, total, percent }) => {
        const r = rarityInfo('legendary')
        return (
          <div key={set.id} className={`card ${complete ? 'border-green-700/40' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{set.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-title text-lg text-gray-100">{set.name}</h3>
                  {complete && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xs text-gray-500">{set.description}</p>
              </div>
              <span className="text-sm font-mono text-gold-400">{ownedCount}/{total}</span>
            </div>

            <div className="stat-bar mb-3"><div className={`stat-bar-fill ${complete ? 'bg-green-500' : 'bg-gold-500'}`} style={{ width: `${percent}%` }} /></div>

            {/* Artefakt-Slots */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {set.artifactIds.map((id) => {
                const art = getArtifact(id)
                const has = owned.has(id)
                const ar = rarityInfo(art?.rarity)
                return (
                  <div key={id} className={`rounded-lg border p-2 text-center ${has ? `${ar.bg} ${ar.border}` : 'border-gray-800 bg-dark-400/50'}`}>
                    <div className={`text-2xl ${has ? '' : 'grayscale opacity-30 blur-[1px]'}`}>{has ? art.icon : '❔'}</div>
                    <p className={`text-[11px] mt-1 truncate ${has ? ar.text : 'text-gray-600'}`}>{has ? art.name : '???'}</p>
                  </div>
                )
              })}
            </div>

            <div className={`mt-3 text-xs rounded-lg px-3 py-2 ${complete ? 'bg-green-900/30 text-green-300 border border-green-700/30' : 'bg-dark-400 text-gray-400 border border-gray-700/50'}`}>
              {complete ? <span>🎉 Set abgeschlossen – Bonus aktiv: <b>{set.bonus.label}</b></span>
                : <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Belohnung: {set.bonus.label}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}