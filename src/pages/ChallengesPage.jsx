// Datei: src/pages/ChallengesPage.jsx
// Challenges / Wetten: Erstellen, Annehmen, Verfolgen
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { Swords, Clock, Trophy, Target, Zap, Flame, CheckCircle, XCircle, Plus } from 'lucide-react'

const challengeTypes = [
  { id: 'xp_duel', label: 'XP-Duell', icon: <Zap className="w-4 h-4" />, description: 'Wer sammelt mehr XP?' },
  { id: 'task_duel', label: 'Task-Duell', icon: <Target className="w-4 h-4" />, description: 'Wer erledigt mehr Tasks?' },
  { id: 'streak_duel', label: 'Streak-Duell', icon: <Flame className="w-4 h-4" />, description: 'Wer hat den längeren Streak?' }
]

const durations = [
  { id: 3, label: '3 Tage' },
  { id: 7, label: '7 Tage' }
]

export default function ChallengesPage() {
  const { user, profile } = useAuth()
  const { challenges, friends, createChallenge, acceptChallenge, declineChallenge } = useGame()
  const [tab, setTab] = useState('active') // active | invitations | history | create
  const [form, setForm] = useState({
    opponent_id: '',
    type: 'xp_duel',
    duration: 3,
    stake_xp: 0
  })

  const activeChallenges = challenges.filter(c => c.status === 'active')
  const pendingChallenges = challenges.filter(c =>
    c.status === 'pending' && c.opponent_id === user?.id
  )
  const sentInvitations = challenges.filter(c =>
    c.status === 'pending' && c.challenger_id === user?.id
  )
  const completedChallenges = challenges.filter(c => c.status === 'completed')
  const historyChallenges = [...pendingChallenges, ...sentInvitations, ...completedChallenges].slice(0, 10)

  const handleCreate = async () => {
    if (!form.opponent_id) return
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + form.duration)
    await createChallenge({
      opponent_id: form.opponent_id,
      type: form.type,
      target: '',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      stake_xp: form.stake_xp
    })
    setTab('active')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2">
          <Swords className="w-6 h-6" />
          Duelle
        </h1>
        <button
          onClick={() => setTab('create')}
          className="btn-primary flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Neues Duell
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'active', label: `Aktiv (${activeChallenges.length})` },
          { id: 'invitations', label: `Einladungen (${pendingChallenges.length})` },
          { id: 'history', label: 'Verlauf' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-btn whitespace-nowrap ${tab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Neues Duell erstellen */}
      {tab === 'create' && (
        <div className="card border-gold-500/30 space-y-4">
          <h3 className="font-title text-gold-400">⚔️ Neues Duell starten</h3>

          {/* Freund auswählen */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Gegner wählen</label>
            {friends.length === 0 ? (
              <p className="text-gray-500 text-sm">Du brauchst zuerst Freunde!</p>
            ) : (
              <div className="space-y-2">
                {friends.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setForm({ ...form, opponent_id: f.id })}
                    className={`w-full card flex items-center gap-3 transition-all ${
                      form.opponent_id === f.id ? 'border-gold-500 bg-gold-500/5' : ''
                    }`}
                  >
                    <span className="text-2xl">{f.avatar_url || '🧙‍♂️'}</span>
                    <span className="text-gray-200">{f.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Typ */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Duell-Typ</label>
            <div className="space-y-2">
              {challengeTypes.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => setForm({ ...form, type: ct.id })}
                  className={`w-full card flex items-center gap-3 transition-all ${
                    form.type === ct.id ? 'border-gold-500 bg-gold-500/5' : ''
                  }`}
                >
                  <span className="text-gold-400">{ct.icon}</span>
                  <div className="text-left">
                    <p className="text-sm text-gray-200">{ct.label}</p>
                    <p className="text-xs text-gray-500">{ct.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dauer */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Dauer</label>
            <div className="flex gap-2">
              {durations.map(d => (
                <button
                  key={d.id}
                  onClick={() => setForm({ ...form, duration: d.id })}
                  className={`tab-btn flex-1 ${form.duration === d.id ? 'active' : ''}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* XP-Einsatz */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">XP-Einsatz (optional)</label>
            <input
              type="number"
              value={form.stake_xp}
              onChange={(e) => setForm({ ...form, stake_xp: parseInt(e.target.value) || 0 })}
              min={0}
              className="input-field"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Einsatz wird dem Verlierer abgezogen</p>
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.opponent_id}
            className="btn-primary w-full"
          >
            ⚔️ Duell starten
          </button>
        </div>
      )}

      {/* Aktive Duelle */}
      {tab === 'active' && (
        <div className="space-y-3">
          {activeChallenges.length === 0 ? (
            <div className="card text-center py-12">
              <Swords className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Keine aktiven Duelle</p>
              <p className="text-gray-500 text-sm mt-1">Fordere einen Freund heraus!</p>
            </div>
          ) : (
            activeChallenges.map(ch => {
              const isChallenger = ch.challenger_id === user?.id
              const opponent = isChallenger ? ch.opponent : ch.challenger
              const endDate = new Date(ch.end_date)
              const remaining = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)))

              return (
                <div key={ch.id} className="card border-gold-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-title text-gold-300">
                      {ch.type === 'xp_duel' ? '⚡ XP-Duell' :
                       ch.type === 'task_duel' ? '🎯 Task-Duell' : '🔥 Streak-Duell'}
                    </h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {remaining}d verbleibend
                    </span>
                  </div>

                  {/* Fortschrittsbalken */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{profile?.avatar_url || '🧙‍♂️'}</span>
                        <span className="text-sm text-gray-300">{profile?.username || 'Du'}</span>
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full">
                        <div className="h-full bg-gold-500 rounded-full" style={{ width: '50%' }} />
                      </div>
                    </div>
                    <span className="text-gold-500 font-title text-lg">VS</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{opponent?.avatar_url || '🧙‍♂️'}</span>
                        <span className="text-sm text-gray-300">{opponent?.username || 'Gegner'}</span>
                      </div>
                      <div className="h-2 bg-dark-400 rounded-full">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>

                  {ch.stake_xp > 0 && (
                    <p className="text-xs text-gold-500 mt-2 text-center">
                      💰 Einsatz: {ch.stake_xp} XP
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Einladungen */}
      {tab === 'invitations' && (
        <div className="space-y-3">
          {pendingChallenges.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Keine Einladungen</p>
            </div>
          ) : (
            pendingChallenges.map(ch => (
              <div key={ch.id} className="card border-gold-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{ch.challenger?.avatar_url || '🧙‍♂️'}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-200">{ch.challenger?.username}</p>
                    <p className="text-xs text-gray-500">Fordert dich zu einem Duell heraus!</p>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  {ch.type === 'xp_duel' ? '⚡ XP-Duell' :
                   ch.type === 'task_duel' ? '🎯 Task-Duell' : '🔥 Streak-Duell'}
                  {' · '}{Math.ceil((new Date(ch.end_date) - new Date(ch.start_date)) / 86400000)} Tage
                  {ch.stake_xp > 0 && ` · 💰 ${ch.stake_xp} XP Einsatz`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptChallenge(ch.id)}
                    className="btn-primary flex-1 flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" /> Annehmen
                  </button>
                  <button
                    onClick={() => declineChallenge(ch.id)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Ablehnen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Verlauf */}
      {tab === 'history' && (
        <div className="space-y-2">
          {historyChallenges.length === 0 ? (
            <div className="card text-center py-12">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Keine vergangenen Duelle</p>
            </div>
          ) : (
            historyChallenges.map(ch => {
              const isWinner = ch.winner_id === user?.id
              const isCompleted = ch.status === 'completed'
              const opponent = ch.challenger_id === user?.id ? ch.opponent : ch.challenger

              return (
                <div key={ch.id} className={`card ${isCompleted ? (isWinner ? 'border-green-700/30' : 'border-red-700/30') : 'border-gray-700/30'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{opponent?.avatar_url || '🧙‍♂️'}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">vs. {opponent?.username || 'Gegner'}</p>
                      <p className="text-xs text-gray-500">
                        {ch.type === 'xp_duel' ? '⚡' : ch.type === 'task_duel' ? '🎯' : '🔥'}
                        {' '}{ch.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      {isCompleted ? (
                        <span className={`badge ${isWinner ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50'}`}>
                          {isWinner ? '🏆 Sieg' : '💀 Niederlage'}
                        </span>
                      ) : (
                        <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
                          ⏳ Ausstehend
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}