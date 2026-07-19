// Freundes-Quest-Karte: zeigt Quest, Modus, Einsatz & Belohnung.
import { Swords, HeartHandshake, Gift, Clock, CheckCircle2, XCircle, Send } from 'lucide-react'
import { FRIEND_QUEST_XP } from '../utils/quests'

const modeMeta = {
  challenge: { label: 'Challenge', icon: <Swords className="w-3 h-3" />, cls: 'text-red-400 border-red-500/40 bg-red-500/10' },
  coop: { label: 'Coop', icon: <HeartHandshake className="w-3 h-3" />, cls: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
  gift: { label: 'Geschenk', icon: <Gift className="w-3 h-3" />, cls: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
}
const statusMeta = {
  pending: { label: 'Offen', cls: 'text-yellow-400' },
  accepted: { label: 'Angenommen', cls: 'text-blue-400' },
  completed: { label: 'Erledigt', cls: 'text-green-400' },
  declined: { label: 'Abgelehnt', cls: 'text-gray-500' },
}

export default function FriendTaskCard({ friendTask, isReceiver, questMap, onAccept, onDecline, onComplete }) {
  const isCustom = friendTask.quest_id === '__custom__'
  const quest = isCustom
    ? { icon: '✏️', title: friendTask.custom_title || 'Eigene Quest', description: friendTask.custom_description || '' }
    : questMap?.[friendTask.quest_id]
  const mode = modeMeta[friendTask.mode] || modeMeta.gift
  const status = statusMeta[friendTask.status] || { label: friendTask.status, cls: 'text-gray-500' }
  const reward = FRIEND_QUEST_XP + (friendTask.stake_xp || 0)

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`badge border ${mode.cls}`}>{mode.icon} {mode.label}</span>
        <span className={`text-xs font-semibold ${status.cls}`}>{status.label}</span>
        {!isReceiver && <span className="text-xs text-gray-600 flex items-center gap-1"><Send className="w-3 h-3" />an {friendTask.receiver_name || 'Freund'}</span>}
        {isReceiver && friendTask.sender_name && <span className="text-xs text-gray-600">von {friendTask.sender_name}</span>}
      </div>

      {quest ? (
        <div className="flex items-start gap-2">
          <span className="text-2xl">{quest.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-gray-100">{quest.title}</p>
            <p className="text-xs text-gray-400">{quest.description}</p>
          </div>
        </div>
      ) : <p className="font-semibold text-gray-200">Quest #{friendTask.quest_id}</p>}

      {friendTask.message && <p className="text-sm text-gray-400 mt-2 italic">„{friendTask.message}"</p>}

      <p className="text-xs text-gold-500 mt-2">🎁 Belohnung bei Erfüllung: +{reward} XP für euch beide</p>

      {isReceiver && friendTask.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => onAccept?.(friendTask.id)} className="btn-primary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Annehmen</button>
          <button onClick={() => onDecline?.(friendTask.id)} className="btn-secondary text-xs py-1.5 flex-1 flex items-center justify-center gap-1"><XCircle className="w-3 h-3" />Ablehnen</button>
        </div>
      )}
      {isReceiver && friendTask.status === 'accepted' && (
        <button onClick={() => onComplete?.(friendTask.id)} className="btn-primary text-xs py-1.5 w-full mt-3 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Erledigt ✓</button>
      )}
      {friendTask.status === 'completed' && (
        <p className="text-xs text-green-400 mt-3 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Quest abgeschlossen – XP gutgeschrieben!</p>
      )}
    </div>
  )
}
