// Datei: src/pages/InventoryPage.jsx
// Artefakt-Inventar: ausrüsten, schützen, nach Seltenheit filtern.
import { useState, useMemo } from 'react'
import { useAdventure } from '../context/AdventureContext'
import ArtifactCard from '../components/ArtifactCard'
import EmptyState from '../components/EmptyState'
import { Package, Sparkles } from 'lucide-react'
import { RARITIES, rarityInfo, rollArtifact } from '../utils/adventure'

export default function InventoryPage() {
  const { characterArtifacts, equipArtifact, toggleProtect, addArtifact, equippedItems, protectedCount } = useAdventure()
  const [filter, setFilter] = useState('all')

  const testKey = 'taskrpg_test_artifact_claimed'
  const [testClaimed, setTestClaimed] = useState(() => localStorage.getItem(testKey) === '1')

  const handleGrantTest = async () => {
    if (testClaimed) return
    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 24) // 1 Tag Haltbarkeit
    await addArtifact(rollArtifact('common').id, 'quest', expiry.toISOString())
    localStorage.setItem(testKey, '1')
    setTestClaimed(true)
  }

  const filtered = useMemo(() => {
    let list = [...characterArtifacts]
    if (filter !== 'all') list = list.filter((c) => c.artifacts.rarity === filter)
    // Sortierung: ausgerüstet zuerst, dann nach Seltenheit absteigend
    return list.sort((a, b) => {
      if (a.is_equipped !== b.is_equipped) return a.is_equipped ? -1 : 1
      return rarityInfo(b.artifacts.rarity).order - rarityInfo(a.artifacts.rarity).order
    })
  }, [characterArtifacts, filter])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Package className="w-6 h-6" />Inventar</h1>
        <span className="text-xs text-gray-500">{equippedItems.length} ausgerüstet · {protectedCount} geschützt</span>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter('all')} className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap ${filter === 'all' ? 'border-gold-500 text-gold-400 bg-gold-500/10' : 'border-gray-700 text-gray-500'}`}>Alle ({characterArtifacts.length})</button>
        {Object.values(RARITIES).map((r) => {
          const count = characterArtifacts.filter((c) => c.artifacts.rarity === r.id).length
          return (
            <button key={r.id} onClick={() => setFilter(r.id)} className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap ${filter === r.id ? `${r.border} ${r.text} ${r.bg}` : 'border-gray-700 text-gray-500'}`}>{r.name} ({count})</button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState emoji="💎" title="Leere Schatztruhe" subtitle="Noch keine Artefakte. Besiege Bosse, erfülle Quests oder gewinne Duelle!"
          action={!testClaimed && <button onClick={handleGrantTest} className="btn-secondary inline-flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4" /> Einmaliges Test-Artefakt (24h)</button>} />
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map((ca) => (
              <ArtifactCard key={ca.id} charArtifact={ca} onEquip={equipArtifact} onProtect={toggleProtect} />
            ))}
          </div>
          {!testClaimed && (
            <button onClick={handleGrantTest} className="btn-secondary w-full mt-4 inline-flex items-center justify-center gap-2 text-sm">
              <Sparkles className="w-4 h-4" /> Einmaliges Test-Artefakt finden (24h Haltbarkeit)
            </button>
          )}
        </>
      )}
    </div>
  )
}
