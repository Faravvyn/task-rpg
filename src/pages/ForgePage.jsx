// Datei: src/pages/ForgePage.jsx
// Crafting / Schmiede: 3 Artefakte gleicher Seltenheit + 50 XP → 1 Stufe höher (zufällig).
import { useState, useMemo } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { useCharacter } from '../hooks/useCharacter'
import ArtifactCard from '../components/ArtifactCard'
import { Hammer, Sparkles, AlertCircle } from 'lucide-react'
import { rarityInfo, CRAFT_FEE_XP, CRAFT_COST_COUNT, craftResultRarity } from '../utils/adventure'

export default function ForgePage() {
  const { characterArtifacts, craft } = useAdventure()
  const { character } = useCharacter()
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState('')

  const xp = character?.xp || 0

  // Auswahl-Logik: nur Artefakte gleicher Seltenheit, max. 3, keine geschützten
  const selectedItems = useMemo(
    () => selected.map((uid) => characterArtifacts.find((c) => c.id === uid)).filter(Boolean),
    [selected, characterArtifacts]
  )
  const selectedRarity = selectedItems[0]?.artifacts?.rarity || null

  const toggle = (uid) => {
    setError('')
    const item = characterArtifacts.find((c) => c.id === uid)
    if (!item) return
    if (item.is_protected) { setError('Geschützte Artefakte können nicht verschmolzen werden.'); return }
    if (selected.includes(uid)) {
      setSelected(selected.filter((s) => s !== uid))
      return
    }
    if (selectedRarity && item.artifacts.rarity !== selectedRarity) {
      setError('Alle Artefakte müssen dieselbe Seltenheit haben.'); return
    }
    if (selected.length >= CRAFT_COST_COUNT) { setError(`Maximal ${CRAFT_COST_COUNT} Artefakte.`); return }
    setSelected([...selected, uid])
  }

  const canCraftNow = selected.length === CRAFT_COST_COUNT && xp >= CRAFT_FEE_XP && selectedRarity && rarityInfo(selectedRarity).next
  const resultRarity = selectedRarity ? craftResultRarity(selectedRarity) : null

  const handleCraft = async () => {
    setBusy(true); setError(''); setMsg(null)
    const res = await craft(selected)
    if (res?.error) setError(res.error.message)
    else { setMsg(res.result); setSelected([]) }
    setBusy(false)
  }

  // Gruppiere wählbare Artefakte nach Seltenheit
  const craftable = characterArtifacts.filter((c) => !c.is_protected)

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Hammer className="w-6 h-6" />Schmiede</h1>

      <div className="card text-sm text-gray-400">
        <p>Verschmelze <b className="text-gray-200">{CRAFT_COST_COUNT} Artefakte gleicher Seltenheit</b> + <b className="text-gold-400">{CRAFT_FEE_XP} XP</b> zu einem zufälligen Artefakt der nächsten Stufe.</p>
        <p className="mt-1 text-xs text-gray-500">3× Gewöhnlich → Selten · 3× Selten → Episch · 3× Episch → Legendär</p>
      </div>

      {/* Amboss / Auswahl */}
      <div className="card border-gold-500/20">
        <div className="flex items-center justify-center gap-3 mb-4">
          {Array.from({ length: CRAFT_COST_COUNT }).map((_, i) => {
            const item = selectedItems[i]
            const r = item ? rarityInfo(item.artifacts.rarity) : null
            return (
              <div key={i} className={`w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center text-3xl ${item ? `${r.bg} ${r.border} border-solid` : 'border-gray-700'}`}>
                {item ? item.artifacts.icon : '➕'}
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-gray-400 mb-4">
          <span>+ {CRAFT_FEE_XP} XP</span>
          <span>→</span>
          {resultRarity
            ? <span className={`font-bold ${rarityInfo(resultRarity).text}`}>1× {rarityInfo(resultRarity).name} (zufällig)</span>
            : <span className="text-gray-600">? ? ?</span>}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>Deine XP: <b className={xp >= CRAFT_FEE_XP ? 'text-gold-400' : 'text-red-400'}>{xp}</b></span>
          <span>Ausgewählt: {selected.length}/{CRAFT_COST_COUNT}</span>
        </div>

        {error && <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2 text-red-300 text-sm flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />{error}</div>}

        <button onClick={handleCraft} disabled={!canCraftNow || busy} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Hammer className="w-5 h-5" /> {busy ? 'Schmiede...' : 'Verschmelzen'}
        </button>
      </div>

      {msg && (
        <div className="card border-gold-500/40 text-center py-6 animate-bounce-in">
          <Sparkles className={`w-8 h-8 mx-auto mb-2 ${rarityInfo(msg.rarity).text}`} />
          <p className="text-gray-400 text-sm">Erschmiedet:</p>
          <p className={`font-title text-xl ${rarityInfo(msg.rarity).text}`}>{msg.icon} {msg.name}</p>
          <span className={`badge ${rarityInfo(msg.rarity).bg} ${rarityInfo(msg.rarity).text} border ${rarityInfo(msg.rarity).border} mt-2 inline-block`}>{rarityInfo(msg.rarity).name}</span>
        </div>
      )}

      {/* Auswählbares Inventar */}
      <div>
        <h2 className="font-title text-lg text-gray-200 mb-3">Wählbare Artefakte</h2>
        {craftable.length === 0 ? (
          <div className="card text-center py-8"><p className="text-gray-400">Keine verschmelzbaren Artefakte. Sammle erst welche!</p></div>
        ) : (
          <div className="space-y-2">
            {craftable.map((ca) => (
              <ArtifactCard
                key={ca.id} charArtifact={ca} selectable
                selected={selected.includes(ca.id)} onSelect={toggle}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
