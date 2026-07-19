// Datei: src/pages/CharacterPage.jsx
// Charakter-Profil mit Ausrüstung (Equipment-Slots) und Inventar.
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCharacter } from '../hooks/useCharacter'
import { useAdventure } from '../context/AdventureContext'
import XPBar from '../components/XPBar'
import StatDistribution from '../components/StatDistribution'
import ArtifactCard from '../components/ArtifactCard'
import EquipmentSlots from '../components/EquipmentSlots'
import EmptyState from '../components/EmptyState'
import { 
  Edit3, Save, Shield, Swords, Package, Sparkles, 
  Zap, Coins, ChevronRight 
} from 'lucide-react'
import { rarityInfo } from '../utils/adventure'
import { Link } from 'react-router-dom'

export default function CharacterPage() {
  const { character, profile, updateProfile, updateCharacter } = useAuth()
  const { levelInfo, classInfo, displayStats } = useCharacter()
  const { characterArtifacts, equipArtifact, completedSetBonuses } = useAdventure()
  const [tab, setTab] = useState('profile')
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(character?.name || '')

  const avatars = ['🧙‍♂️', '⚔️', '🛡️', '🏹', '🎭', '🐉', '🗡️', '👑']

  if (!character) return null

  const equipped = characterArtifacts.filter((a) => a.is_equipped)
  const unequipped = characterArtifacts.filter((a) => !a.is_equipped)

  const handleAvatarChange = async (avatar) => { await updateProfile({ avatar_url: avatar }); setEditingAvatar(false) }
  const handleNameChange = async () => { if (newName.trim() && newName !== character.name) await updateCharacter({ name: newName.trim() }); setEditingName(false) }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400">🧙 Mein Held</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'profile', label: 'Profil', icon: <Swords className="w-4 h-4" /> },
          { id: 'equip', label: 'Ausrüstung', icon: <Shield className="w-4 h-4" /> },
          { id: 'stats', label: 'Stats', icon: <Zap className="w-4 h-4" /> },
          { id: 'inventory', label: 'Inventar', icon: <Package className="w-4 h-4" /> },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn flex items-center gap-1 ${tab === t.id ? 'active' : ''}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profil-Tab */}
      {tab === 'profile' && (
        <>
          <div className="card border-gold-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5"><div className="absolute top-0 right-0 text-[200px] text-gold-400 leading-none">{classInfo?.icon || '⚔️'}</div></div>
            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-dark-400 rounded-xl border-2 border-gold-500/30 flex items-center justify-center text-4xl cursor-pointer hover:border-gold-400" onClick={() => setEditingAvatar(!editingAvatar)}>
                    {profile?.avatar_url || '🧙‍♂️'}
                  </div>
                  <button onClick={() => setEditingAvatar(!editingAvatar)} className="absolute -bottom-1 -right-1 w-6 h-6 bg-dark-300 border border-gray-600 rounded-full flex items-center justify-center"><Edit3 className="w-3 h-3 text-gray-400" /></button>
                </div>
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex gap-2 mb-1">
                      <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field py-1 text-sm" autoFocus onBlur={handleNameChange} onKeyDown={(e) => e.key === 'Enter' && handleNameChange()} />
                      <button onClick={handleNameChange} className="text-gold-400"><Save className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <h2 className="font-title text-xl text-gold-300 cursor-pointer hover:text-gold-200 flex items-center gap-2" onClick={() => { setEditingName(true); setNewName(character.name) }}>
                      {character.name}<Edit3 className="w-4 h-4 text-gray-600" />
                    </h2>
                  )}
                  {classInfo && <span className="badge bg-gold-500/20 text-gold-400 border border-gold-500/30 mt-1">{classInfo.icon} {classInfo.name}</span>}
                </div>
              </div>

              {editingAvatar && (
                <div className="mb-4 p-3 bg-dark-400 rounded-lg animate-slide-up">
                  <p className="text-xs text-gray-400 mb-2">Avatar wählen:</p>
                  <div className="flex gap-2 flex-wrap">
                    {avatars.map((av, i) => (
                      <button key={i} onClick={() => handleAvatarChange(av)} className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl ${profile?.avatar_url === av ? 'border-gold-500 bg-gold-500/20' : 'border-gray-700'}`}>{av}</button>
                    ))}
                  </div>
                </div>
              )}
              <XPBar />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="card text-center py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gold</p>
                <p className="font-title text-2xl text-gold-400 flex items-center justify-center gap-2"><Coins className="w-5 h-5" /> {character.gold || 0}</p>
             </div>
             <div className="card text-center py-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ausrüstung</p>
                <p className="font-title text-2xl text-gray-200">{equipped.length} / 6</p>
             </div>
          </div>
        </>
      )}

      {/* Ausrüstungs-Tab */}
      {tab === 'equip' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-title text-lg text-gray-200 mb-1 flex items-center gap-2"><Shield className="w-5 h-5 text-gold-500" /> Ausrüstung verwalten</h2>
            <p className="text-xs text-gray-500 mb-4">Wähle einen Slot, um ein Artefakt auszurüsten. Nur <b className="text-gray-300">ausgerüstete</b> Artefakte sind aktiv.</p>
            <EquipmentSlots />
          </div>

          {completedSetBonuses.length > 0 && (
            <div className="card">
              <h3 className="font-title text-gray-200 mb-2 text-sm flex items-center gap-1"><Sparkles className="w-4 h-4 text-gold-500" /> Aktive Set-Boni</h3>
              <div className="flex flex-wrap gap-2">
                {completedSetBonuses.map((b, i) => <span key={i} className={`badge bg-green-900/40 text-green-300 border border-green-700/40`}>✓ {b.label}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats-Tab */}
      {tab === 'stats' && (
        <>
          <StatDistribution />
          <div>
            <h2 className="font-title text-lg text-gray-200 mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-gold-500" /> Attribut-Werte</h2>
            <div className="space-y-3">
              {displayStats.map((stat) => (
                <div key={stat.key} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">{stat.name}</span>
                    <span className="text-sm font-mono text-gold-400">{stat.value}</span>
                  </div>
                  <div className="stat-bar"><div className={`stat-bar-fill ${stat.color}`} style={{ width: `${Math.min(stat.value * 4, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Inventar-Tab */}
      {tab === 'inventory' && (
        <div className="space-y-5">
          {characterArtifacts.length === 0 ? (
            <EmptyState emoji="💎" title="Leeres Inventar" subtitle="Noch keine Artefakte. Spiele Quests, Bosse & Duelle, um welche zu finden!"
              action={<Link to="/adventure" className="btn-primary text-sm">Zum Abenteuer</Link>} />
          ) : (
            <>
              {/* Ausgerüstet (aktiv) */}
              <div>
                <h2 className="font-title text-lg text-gray-200 mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold-500" /> Ausgerüstet – aktiv ({equipped.length})</h2>
                {equipped.length === 0 ? (
                  <p className="text-sm text-gray-500 card py-4 text-center">Nichts ausgerüstet. Rüste Artefakte aus, damit sie wirken.</p>
                ) : (
                  <div className="space-y-2">
                    {equipped.map((ca) => <ArtifactCard key={ca.id} charArtifact={ca} onEquip={equipArtifact} />)}
                  </div>
                )}
              </div>

              {/* Nicht ausgerüstet (inaktiv) */}
              {unequipped.length > 0 && (
                <div>
                  <h2 className="font-title text-lg text-gray-400 mb-2 flex items-center gap-2"><Package className="w-5 h-5 text-gray-500" /> Inventar – inaktiv ({unequipped.length})</h2>
                  <div className="space-y-2 opacity-70">
                    {unequipped.map((ca) => <ArtifactCard key={ca.id} charArtifact={ca} onEquip={equipArtifact} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
