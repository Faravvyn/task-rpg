// Datei: src/pages/FriendsPage.jsx
// Freunde + Freundes-Quests
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { useAdventure } from '../context/AdventureContext'
import FriendTaskCard from '../components/FriendTaskCard'
import { Users, Search, UserPlus, Hand, AlertCircle, Swords } from 'lucide-react'

export default function FriendsPage() {
  const { user } = useAuth()
  const { friends, friendRequests, addFriend, acceptFriend, removeFriend, nudgeFriend } = useGame()
  const { friendTasks, sendFriendTask, acceptFriendTask, declineFriendTask, completeFriendTask, questCatalog, questMap: catalogMap } = useAdventure()
  const [tab, setTab] = useState('friends')
  const [searchUsername, setSearchUsername] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)
  const [sendModal, setSendModal] = useState(null) // { friendId, friendName }

  const showMsg = (text, type = 'error') => { setMessage(text); setMessageType(type); if (type === 'success') setTimeout(() => setMessage(''), 3000) }

  const handleAddFriend = async () => {
    if (!searchUsername.trim()) return
    setLoading(true); setMessage('')
    try {
      const { error } = await addFriend(searchUsername.trim())
      if (error) showMsg(error.message)
      else { showMsg(`Anfrage an "${searchUsername.trim()}" gesendet! ✨`, 'success'); setSearchUsername('') }
    } catch (err) { showMsg('Fehler: ' + err.message) }
    setLoading(false)
  }

  // Quest-Map für FriendTaskCard (gesamter Quest-Katalog)
  const questMap = catalogMap || {}

  // Eingehende/ausgehende Friend Tasks
  const incomingTasks = friendTasks.filter(t => t.receiver_id === user?.id && t.status !== 'declined')
  const outgoingTasks = friendTasks.filter(t => t.sender_id === user?.id)

  const handleSendQuest = async () => {
    if (!sendModal) return
    const { error } = await sendFriendTask({
      friendId: sendModal.friendId,
      friendName: sendModal.friendName,
      questId: sendModal.questId,
      customTitle: sendModal.customTitle,
      customDescription: sendModal.customDescription,
      mode: sendModal.mode,
      message: sendModal.message,
      stakeXp: sendModal.stakeXp
    })
    if (error) showMsg(error.message)
    else { showMsg('Quest gesendet! 🚀', 'success'); setSendModal(null) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Users className="w-6 h-6" /> Freunde</h1>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-slide-up ${messageType === 'success' ? 'bg-green-900/30 text-green-300 border border-green-800/50' : 'bg-red-900/30 text-red-300 border border-red-800/50'}`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{message}</span>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'friends', label: `Freunde (${friends.length})` },
          { id: 'requests', label: `Anfragen${friendRequests.length > 0 ? ` (${friendRequests.length})` : ''}` },
          { id: 'quests', label: `Quests${incomingTasks.filter(t => t.status === 'pending').length > 0 ? ` (${incomingTasks.filter(t => t.status === 'pending').length})` : ''}` },
          { id: 'search', label: 'Suchen' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn whitespace-nowrap ${tab === t.id ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {/* Freunde */}
      {tab === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="card text-center py-12"><Users className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">Noch keine Freunde</p>
              <button onClick={() => setTab('search')} className="btn-primary mt-4 text-sm"><UserPlus className="w-4 h-4 inline mr-1" /> Freund suchen</button>
            </div>
          ) : friends.map(f => (
            <div key={f.id} className="card">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{f.avatar_url || '🧙‍♂️'}</span>
                <div className="flex-1"><p className="font-semibold text-gray-200">{f.username}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSendModal({ friendId: f.id, friendName: f.username, questId: '', mode: 'gift', message: '', stakeXp: 0 })} className="btn-secondary text-xs py-1.5 px-2" title="Quest schicken"><Swords className="w-3 h-3 inline" /> Quest</button>
                  <button onClick={async () => { const { error } = await nudgeFriend(f.id); showMsg(error ? error.message : 'Angestupst! 👋', error ? 'error' : 'success') }} className="btn-secondary text-xs py-1.5 px-2">👋</button>
                  <button onClick={() => { if (window.confirm(`${f.username} entfernen?`)) removeFriend(f.friendship_id) }} className="p-1.5 text-gray-500 hover:text-red-400">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anfragen */}
      {tab === 'requests' && (
        <div className="space-y-2">
          {friendRequests.length === 0 ? <div className="card text-center py-12"><p className="text-gray-400">Keine Anfragen</p></div> : friendRequests.map(req => (
            <div key={req.id} className="card">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{req.requester?.avatar_url || '🧙‍♂️'}</span>
                <div className="flex-1"><p className="font-semibold text-gray-200">{req.requester?.username}</p><p className="text-xs text-gray-500">Möchte dein Freund sein</p></div>
                <div className="flex gap-2">
                  <button onClick={() => acceptFriend(req.id)} className="btn-primary text-xs py-1.5 px-3">Annehmen</button>
                  <button onClick={() => removeFriend(req.id)} className="p-1.5 text-gray-500 hover:text-red-400">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quests */}
      {tab === 'quests' && (
        <div className="space-y-4">
          <h2 className="font-title text-lg text-gray-200">Eingehende Quests</h2>
          {incomingTasks.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">Keine Quests</p></div> : (
            <div className="space-y-2">{incomingTasks.map(ft => <FriendTaskCard key={ft.id} friendTask={ft} isReceiver questMap={questMap} onAccept={acceptFriendTask} onDecline={declineFriendTask} onComplete={completeFriendTask} />)}</div>
          )}
          <h2 className="font-title text-lg text-gray-200 mt-4">Gesendete Quests</h2>
          {outgoingTasks.length === 0 ? <div className="card text-center py-8"><p className="text-gray-400">Keine gesendeten Quests</p></div> : (
            <div className="space-y-2">{outgoingTasks.map(ft => <FriendTaskCard key={ft.id} friendTask={ft} isReceiver={false} questMap={questMap} />)}</div>
          )}
        </div>
      )}

      {/* Suche */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input type="text" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} placeholder="Benutzername..." className="input-field flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()} />
            <button onClick={handleAddFriend} disabled={loading || !searchUsername.trim()} className="btn-primary flex items-center gap-1"><UserPlus className="w-4 h-4" /> Hinzufügen</button>
          </div>
          <div className="card"><p className="text-sm text-gray-400">💡 Gib den exakten Benutzernamen ein.</p></div>
        </div>
      )}

      {/* Quest-Senden Modal */}
      {sendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setSendModal(null)}>
          <div className="bg-dark-300 rounded-xl p-6 max-w-sm w-full border border-gold-500/30 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-title text-gold-400 text-lg mb-4">Quest senden an {sendModal.friendName}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quest</label>
                <select value={sendModal.questId} onChange={e => setSendModal({ ...sendModal, questId: e.target.value })} className="input-field">
                  <option value="">Quest wählen...</option>
                  <option value="__custom__">✏️ Eigene Quest erstellen…</option>
                  {questCatalog.map(q => (
                    <option key={q.id} value={q.id}>{q.icon} {q.title}</option>
                  ))}
                </select>
              </div>
              {sendModal.questId === '__custom__' && (
                <div className="space-y-2 p-3 rounded-lg border border-gold-500/20 bg-gold-500/5">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Eigener Titel *</label>
                    <input type="text" value={sendModal.customTitle || ''} onChange={e => setSendModal({ ...sendModal, customTitle: e.target.value })} className="input-field" placeholder="z.B. Geh 10.000 Schritte" maxLength={60} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Beschreibung (optional)</label>
                    <textarea value={sendModal.customDescription || ''} onChange={e => setSendModal({ ...sendModal, customDescription: e.target.value })} className="input-field" rows={2} placeholder="Worum geht es?" maxLength={200} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Modus</label>
                <div className="flex gap-2">
                  {[{ id: 'challenge', label: '⚔️ Challenge' }, { id: 'coop', label: '🤝 Coop' }, { id: 'gift', label: '🎁 Gift' }].map(m => (
                    <button key={m.id} onClick={() => setSendModal({ ...sendModal, mode: m.id })} className={`text-xs px-3 py-2 rounded-lg border ${sendModal.mode === m.id ? 'border-gold-500 text-gold-300' : 'border-gray-600 text-gray-400'}`}>{m.label}</button>
                  ))}
                </div>
              </div>
              {sendModal.mode === 'challenge' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Stake XP</label>
                  <input type="number" value={sendModal.stakeXp} onChange={e => setSendModal({ ...sendModal, stakeXp: parseInt(e.target.value) || 0 })} className="input-field" min={0} />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nachricht (optional)</label>
                <input type="text" value={sendModal.message} onChange={e => setSendModal({ ...sendModal, message: e.target.value })} className="input-field" placeholder="Viel Erfolg!" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSendQuest} disabled={!sendModal.questId || (sendModal.questId === '__custom__' && !(sendModal.customTitle || '').trim())} className="btn-primary flex-1">Senden</button>
              <button onClick={() => setSendModal(null)} className="btn-secondary flex-1">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}