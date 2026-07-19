// Globale Drop-Animation: zeigt ein neu erhaltenes Artefakt großflächig an.
import { useAdventure } from '../context/AdventureContext'
import { rarityInfo } from '../utils/adventure'
import { Sparkles } from 'lucide-react'

const sourceLabels = {
  quest: 'Quest-Belohnung', boss: 'Boss-Beute', craft: 'Geschmiedet',
  arena: 'Arena-Sieg', default: 'Neues Artefakt',
}

export default function DropReveal() {
  const { lastDrop, clearLastDrop } = useAdventure()
  if (!lastDrop?.artifact) return null
  const art = lastDrop.artifact
  const r = rarityInfo(art.rarity)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-pointer animate-fade-in" onClick={clearLastDrop}>
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest">{sourceLabels[lastDrop.source] || sourceLabels.default}</p>
        <div className={`mx-auto w-32 h-32 rounded-2xl ${r.bg} border-2 ${r.border} flex items-center justify-center text-6xl shadow-2xl ${r.glow} animate-bounce-in`}>
          {art.icon || '💎'}
        </div>
        <Sparkles className={`w-8 h-8 mx-auto my-3 ${r.text} animate-pulse`} />
        <h2 className={`font-title text-2xl ${r.text} ${art.rarity === 'legendary' ? 'animate-glow' : ''}`}>{art.name}</h2>
        <span className={`badge ${r.bg} ${r.text} border ${r.border} mt-2 inline-block`}>{r.name}</span>
        <p className="text-gray-400 text-sm mt-2">{art.description}</p>
        <p className="text-gray-600 text-xs mt-6">Tippen zum Schließen</p>
      </div>
    </div>
  )
}
