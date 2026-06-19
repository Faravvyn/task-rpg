// Datei: src/pages/LoadoutPage.jsx
// Ausrüstungs-Slots als Silhouetten (Helm, Rüstung, Waffe, Ring).
// Die hier gewählten Artefakte bringen DIESE WOCHE doppelten Bonus.
import { useState } from 'react'
import { useAdventure } from '../context/AdventureContext'
import EmptyState from '../components/EmptyState'
import { rarityInfo } from '../utils/adventure'
import { Shield, X, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LoadoutPage() {
  const { equipSlots, loadout, setLoadoutSlot, characterArtifacts } = useAdventure()
  const [picking, setPicking] = useState(null) // slotId

  const byUid = Object.fromEntries(characterArtifacts.map((c) => [c.id, c]))
  const usedUids = new Set(Object.values(loadout))

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Shield className="w-6 h-6" />Ausrüstung</h1>

      <div className="card text-sm text-gray-400">
        <p>Wähle pro Slot ein Artefakt – diese bringen <b className="text-gold-400">diese Woche doppelten Bonus</b> (XP & Boss-Schaden). Jede Woche neu wählbar!</p>
      </div>

      {characterArtifacts.length === 0 ? (
        <EmptyState emoji="🛡️" title="Keine Artefakte zum Ausrüsten"
          subtitle="Besiege Bosse, erfülle Quests oder gewinne Duelle, um Artefakte zu finden."
          action={<Link to="/adventure" className="btn-primary text-sm">Zum Abenteuer</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {equipSlots.map((slot) => {
            const uid = loadout[slot.id]
            const item = uid ? byUid[uid] : null
            const r = item ? rarityInfo(item.artifacts.rarity) : null
            return (
              <div key={slot.id} className={`card flex flex-col items-center text-center py-5 ${item ? r.border : 'border-dashed border-gray-700'}`}>
                <p className="text-xs text-gray-500 mb-2">{slot.label}</p>
                <button onClick={() => setPicking(slot.id)}
                  className={`w-20 h-20 rounded-xl flex items-center justify-center text-4xl border-2 transition-all ${item ? `${r.bg} ${r.border} shadow ${r.glow}` : 'border-gray-700 bg-dark-400/50 hover:border-gold-600/40'}`}>
                  {item ? item.artifacts.icon : <span className="opacity-30 grayscale">{slot.silhouette}</span>}
                </button>
                {item ? (
                  <>
                    <p className={`text-sm mt-2 ${r.text}`}>{item.artifacts.name}</p>
                    <p className="text-[11px] text-gold-400 mt-0.5 flex items-center gap-0.5"><Sparkles className="w-3 h-3" />Doppelter Bonus</p>
                    <button onClick={() => setLoadoutSlot(slot.id, null)} className="text-xs text-gray-500 hover:text-red-400 mt-1 flex items-center gap-0.5"><X className="w-3 h-3" />Entfernen</button>
                  </>
                ) : (
                  <p className="text-xs text-gray-600 mt-2">Leer – tippen zum Wählen</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Auswahl-Modal */}
      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setPicking(null)}>
          <div className="bg-dark-300 rounded-xl p-5 max-w-sm w-full border border-gold-500/30 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-title text-gold-400 text-lg mb-3">Artefakt für „{equipSlots.find((s) => s.id === picking)?.label}"</h3>
            <div className="space-y-2">
              {characterArtifacts.map((ca) => {
                const r = rarityInfo(ca.artifacts.rarity)
                const usedElsewhere = usedUids.has(ca.id) && loadout[picking] !== ca.id
                return (
                  <button key={ca.id} disabled={usedElsewhere}
                    onClick={() => { setLoadoutSlot(picking, ca.id); setPicking(null) }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left ${loadout[picking] === ca.id ? 'border-gold-500 bg-gold-500/10' : 'border-gray-700'} ${usedElsewhere ? 'opacity-40 cursor-not-allowed' : 'hover:border-gray-500'}`}>
                    <span className="text-xl">{ca.artifacts.icon}</span>
                    <span className={`flex-1 text-sm ${r.text}`}>{ca.artifacts.name}</span>
                    <span className={`badge ${r.bg} ${r.text} border ${r.border}`}>{r.name}</span>
                    {usedElsewhere && <span className="text-[10px] text-gray-500">belegt</span>}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setPicking(null)} className="btn-secondary w-full mt-3">Schließen</button>
          </div>
        </div>
      )}
    </div>
  )
}