// Artefakt-Karte mit Seltenheits-Styling, Effekt-Anzeige, Ausrüsten- & Schutz-Button
import { Lock, Unlock, Check } from 'lucide-react'
import { rarityInfo, getSet } from '../utils/adventure'

export default function ArtifactCard({
  charArtifact, onEquip, onProtect, onSelect,
  selected = false, selectable = false, compact = false,
}) {
  const art = charArtifact?.artifacts
  if (!art) return null
  const r = rarityInfo(art.rarity)
  const set = art.setId ? getSet(art.setId) : null

  const handleClick = () => { if (selectable && onSelect) onSelect(charArtifact.id) }

  return (
    <div
      onClick={handleClick}
      className={`card flex items-center gap-3 transition-all ${r.border} ${selectable ? 'cursor-pointer' : ''}
        ${selected ? 'ring-2 ring-gold-400 ' + r.bg : ''}
        ${charArtifact.is_equipped && !selected ? 'border-gold-500/40 ' + r.bg : ''}`}
    >
      <div className={`w-11 h-11 flex-shrink-0 rounded-lg ${r.bg} ${r.border} border flex items-center justify-center text-2xl shadow ${r.glow}`}>
        {art.icon || '💎'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold truncate ${r.text}`}>{art.name}</p>
          <span className={`badge ${r.bg} ${r.text} border ${r.border}`}>{r.name}</span>
          {charArtifact.is_protected && <Lock className="w-3 h-3 text-gold-400" />}
        </div>
        {!compact && <p className="text-xs text-gray-500 truncate">{art.description}</p>}
        {!compact && set && <p className="text-[11px] text-gray-600 mt-0.5">{set.icon} {set.name}</p>}
      </div>

      {selectable ? (
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${selected ? 'bg-gold-500 border-gold-400 text-dark-600' : 'border-gray-600'}`}>
          {selected && <Check className="w-4 h-4" />}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {onProtect && (
            <button
              onClick={(e) => { e.stopPropagation(); onProtect(charArtifact.id) }}
              title={charArtifact.is_protected ? 'Schutz aufheben' : 'Schützen (nicht wettbar)'}
              className={`p-1.5 rounded-lg border ${charArtifact.is_protected ? 'border-gold-500 text-gold-400' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
            >
              {charArtifact.is_protected ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}
          {onEquip && (
            <button
              onClick={(e) => { e.stopPropagation(); onEquip(charArtifact.id, !charArtifact.is_equipped) }}
              className={`text-xs px-3 py-1.5 rounded-lg border whitespace-nowrap ${charArtifact.is_equipped ? 'border-gold-500 text-gold-400 bg-gold-500/10' : 'border-gray-700 text-gray-400 hover:text-gray-200'}`}
            >
              {charArtifact.is_equipped ? 'Ausgerüstet' : 'Ausrüsten'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}