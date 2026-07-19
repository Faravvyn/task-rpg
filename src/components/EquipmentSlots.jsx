// Ausrüstungs-Slots des Helden (Helm, Waffe, Rüstung, Stiefel, Ring, Amulett).
// Ausgerüstete Artefakte sind aktiv und geben ihren Bonus; pro Slot genau eines.
import { useState } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { EQUIP_SLOTS, slotForArtifact, rarityInfo } from '../utils/adventure'
import { X } from 'lucide-react'

export default function EquipmentSlots() {
  const { characterArtifacts, equippedBySlot, equipArtifact } = useAdventure()
  const [picking, setPicking] = useState(null) // slotId

  // Inventar-Artefakte, die zu einem bestimmten Slot passen
  const candidatesFor = (slotId) =>
    characterArtifacts.filter((c) => slotForArtifact(c.artifacts) === slotId)

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {EQUIP_SLOTS.map((slot) => {
          const eq = equippedBySlot?.[slot.id]
          const art = eq?.artifacts
          const r = art ? rarityInfo(art.rarity) : null
          return (
            <button
              key={slot.id}
              onClick={() => setPicking(slot.id)}
              className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${art ? `${r.border} ${r.bg}` : 'border-dashed border-gray-700 bg-dark-400/40 hover:border-gray-500'}`}
              title={slot.label}
            >
              {art ? (
                <>
                  <span className="text-3xl leading-none">{art.icon}</span>
                  <span className={`text-[10px] mt-1 text-center leading-tight ${r.text}`}>{art.name}</span>
                </>
              ) : (
                <>
                  <span className="text-3xl leading-none opacity-30 grayscale">{slot.silhouette}</span>
                  <span className="text-[10px] mt-1 text-gray-600">{slot.label}</span>
                </>
              )}
              <span className="absolute top-1 left-1 text-[10px] text-gray-500">{slot.icon}</span>
            </button>
          )
        })}
      </div>

      {/* Auswahl-Modal */}
      {picking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setPicking(null)}>
          <div className="bg-dark-300 rounded-xl p-5 max-w-sm w-full border border-gold-500/30 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-title text-gold-400 text-lg">{EQUIP_SLOTS.find((s) => s.id === picking)?.icon} {EQUIP_SLOTS.find((s) => s.id === picking)?.label}</h3>
              <button onClick={() => setPicking(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* aktuell ausgerüstet -> ablegen */}
            {equippedBySlot?.[picking] && (
              <button
                onClick={() => { equipArtifact(equippedBySlot[picking].id, false); setPicking(null) }}
                className="w-full mb-3 text-sm py-2 rounded-lg border border-red-700/50 text-red-300 hover:bg-red-900/20"
              >
                Aktuelles Artefakt ablegen
              </button>
            )}

            <div className="space-y-2">
              {candidatesFor(picking).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Keine passenden Artefakte im Inventar.</p>
              )}
              {candidatesFor(picking).map((ca) => {
                const r = rarityInfo(ca.artifacts.rarity)
                const isEquipped = ca.is_equipped
                return (
                  <button
                    key={ca.id}
                    onClick={() => { equipArtifact(ca.id, !isEquipped); setPicking(null) }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left ${isEquipped ? 'border-gold-500 bg-gold-500/10' : 'border-gray-700 hover:border-gray-500'}`}
                  >
                    <span className="text-xl">{ca.artifacts.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${r.text}`}>{ca.artifacts.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{ca.artifacts.description}</p>
                    </div>
                    <span className={`badge ${r.bg} ${r.text} border ${r.border}`}>{r.name}</span>
                    {isEquipped && <span className="text-[10px] text-gold-400">aktiv</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
