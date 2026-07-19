import { useState, useMemo } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { MONSTERS, MONSTER_MAP, getMonsterImageUrl } from '../utils/monsters'
import { Shield, Swords, Plus, CheckCircle2, Zap, Heart, Star, Info, Trash2, Bone, Heart as HandHeart, BookOpen } from 'lucide-react'
import { updateMonster } from '../lib/adventureRepo'

export default function MonsterPage() {
  const { userMonsters, userTeam, updateTeam, spawnMiniBoss, interactWithMonster, deleteMonster, setUserMonsters } = useAdventure()
  const [selectingFor, setSelectingFor] = useState(null) // slot_1, slot_2, slot_3
  const [inspecting, setInspecting] = useState(null) // monsterUid
  const [view, setView] = useState('team') // team | lexicon

  const team = [
    { slot: 'slot_1', id: userTeam.slot_1 },
    { slot: 'slot_2', id: userTeam.slot_2 },
    { slot: 'slot_3', id: userTeam.slot_3 },
  ]

  const handleSelect = (monsterUid) => {
    if (!selectingFor) return
    const newTeam = { ...userTeam, [selectingFor]: monsterUid }
    updateTeam(newTeam)
    setSelectingFor(null)
  }

  const handleUpgradeStat = async (monsterUid, statKey) => {
    const m = userMonsters.find(it => it.id === monsterUid)
    if (!m || (m.stat_points || 0) <= 0) return
    const newStats = { ...m.stats }; newStats[statKey] = (newStats[statKey] || 0) + 1
    const updated = { stats: newStats, stat_points: m.stat_points - 1 }
    await updateMonster(monsterUid, updated)
    // Aktualisiere den lokalen State ohne Page-Reload
    setUserMonsters(prev => prev.map(it => it.id === monsterUid ? { ...it, ...updated } : it))
    setInspecting(prev => prev === monsterUid ? { ...m, ...updated } : prev)
  }

  const inspectedMonster = userMonsters.find(m => m.id === inspecting)
  const caughtIds = useMemo(() => new Set(userMonsters.map(m => m.monster_id)), [userMonsters])

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2">🐾 Monster</h1>
        <div className="flex gap-2">
           <button onClick={() => setView('team')} className={`tab-btn px-3 py-1 flex items-center gap-1 ${view === 'team' ? 'active' : ''}`}><Swords className="w-3 h-3" /> Team</button>
           <button onClick={() => setView('lexicon')} className={`tab-btn px-3 py-1 flex items-center gap-1 ${view === 'lexicon' ? 'active' : ''}`}><BookOpen className="w-3 h-3" /> Lexicon</button>
        </div>
      </div>

      {view === 'team' ? (
        <>
          {/* TEAM SECTION */}
          <div className="grid grid-cols-3 gap-3">
            {team.map((t, i) => {
              const monster = userMonsters.find(m => m.id === t.id)
              const meta = monster ? MONSTER_MAP[monster.monster_id] : null
              return (
                <div key={t.slot} className={`card flex flex-col items-center p-3 border-2 ${selectingFor === t.slot ? 'border-gold-500 animate-pulse' : 'border-gray-800'}`}>
                  <p className="text-[10px] text-gray-500 uppercase mb-2">Slot {i+1}</p>
                  <button onClick={() => setSelectingFor(t.slot)} className={`w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center text-4xl bg-dark-400 border border-gray-700 hover:border-gold-500/50 transition-all`}>
                    {meta ? <img src={getMonsterImageUrl(monster)} className="w-full h-full object-cover" /> : <Plus className="text-gray-600" />}
                  </button>
                  <p className="text-[11px] mt-2 text-gray-300 font-bold truncate w-full text-center">{monster?.nickname || meta?.name || 'Leer'}</p>
                </div>
              )
            })}
          </div>

          {/* INSPECT / UPGRADE / HAPPINESS */}
          {inspectedMonster && (
            <div className="card border-gold-500/40 bg-gold-500/5 animate-slide-up space-y-6">
              <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gold-500/30">
                       <img src={getMonsterImageUrl(inspectedMonster)} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-title text-lg text-gold-300">{inspectedMonster.nickname || MONSTER_MAP[inspectedMonster.monster_id]?.name || 'Unbekannt'}</h3>
                        <p className="text-xs text-gray-400">Level {inspectedMonster.level} • {MONSTER_MAP[inspectedMonster.monster_id]?.type || '???'}</p>
                        <div className="mt-2 flex items-center gap-2">
                           <span className="text-[10px] text-gray-500 uppercase">Zuneigung:</span>
                           <div className="w-20 h-1.5 bg-dark-500 rounded-full overflow-hidden">
                              <div className={`h-full ${inspectedMonster.affection < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${inspectedMonster.affection}%` }} />
                           </div>
                           <span className="text-[10px] text-gray-300">{inspectedMonster.affection}%</span>
                        </div>
                    </div>
                  </div>
                  <button onClick={() => setInspecting(null)} className="text-gray-500">✕</button>
              </div>

              {/* Interaction Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => interactWithMonster(inspectedMonster.id, 'pet')} className="btn-secondary py-2 text-xs flex items-center justify-center gap-2"><HandHeart className="w-3 h-3"/> Streicheln (500m Walk)</button>
                <button onClick={() => interactWithMonster(inspectedMonster.id, 'feed')} className="btn-secondary py-2 text-xs flex items-center justify-center gap-2"><Bone className="w-3 h-3"/> Füttern (10 Situps)</button>
              </div>
              
              <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400"><span>Punkte: <b className="text-gold-400">{inspectedMonster.stat_points || 0}</b></span></div>
                  {['hp', 'atk', 'def'].map(stat => (
                    <div key={stat} className="flex items-center gap-3">
                      <span className="text-[10px] w-8 uppercase">{stat}</span>
                      <div className="flex-1 h-1.5 bg-dark-500 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500" style={{ width: `${Math.min(100, (inspectedMonster.stats[stat] || 10) * 2)}%` }} />
                      </div>
                      <span className="text-[10px] font-mono w-6">{inspectedMonster.stats[stat] || 0}</span>
                      <button disabled={(inspectedMonster.stat_points || 0) <= 0} onClick={() => handleUpgradeStat(inspectedMonster.id, stat)} className="w-5 h-5 rounded bg-gold-500 text-dark-600 flex items-center justify-center text-xs">+</button>
                    </div>
                  ))}
              </div>

              <button onClick={() => { if(window.confirm('Monster wirklich freilassen?')) { deleteMonster(inspectedMonster.id); setInspecting(null); } }} className="w-full text-xs text-red-500/60 hover:text-red-500 flex items-center justify-center gap-1 py-1"><Trash2 className="w-3 h-3"/> In die Wildnis entlassen</button>
            </div>
          )}

          {/* COLLECTION LIST */}
          <div className="space-y-2">
            <h2 className="font-title text-sm text-gray-400 uppercase tracking-widest px-1">Deine Sammlung ({userMonsters.length})</h2>
            <div className="grid gap-2">
              {userMonsters.length === 0 && <p className="text-center py-10 text-gray-500">Noch keine Monster gefangen.</p>}
              {userMonsters.map(m => {
                const meta = MONSTER_MAP[m.monster_id]
                const isTeam = Object.values(userTeam).includes(m.id)
                return (
                  <div key={m.id} onClick={() => selectingFor ? handleSelect(m.id) : setInspecting(m.id)} className={`card flex items-center gap-4 ${isTeam ? 'border-gold-500/30 bg-gold-500/5' : ''} cursor-pointer hover:border-gold-400`}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700"><img src={getMonsterImageUrl(m)} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-title text-sm text-gray-100 truncate">{m.nickname || meta?.name}</h3>
                      <div className="flex items-center gap-2">
                         <span className="text-[9px] text-gold-500 font-bold">Lv. {m.level}</span>
                         <div className="w-12 h-1 bg-dark-500 rounded-full overflow-hidden"><div className="h-full bg-blue-400" style={{ width: `${m.affection}%` }} /></div>
                      </div>
                    </div>
                    {m.stat_points > 0 && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-full animate-pulse">!</span>}
                    {isTeam && <CheckCircle2 className="w-4 h-4 text-gold-400" />}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        /* MONSTER LEXICON VIEW */
        <div className="grid grid-cols-1 gap-4">
          <div className="card bg-gold-500/5 border-gold-500/20">
             <p className="text-xs text-gold-300 italic">"Das Monster Lexicon bewahrt das Wissen über alle Kreaturen, denen du auf deiner Reise begegnet bist."</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {MONSTERS.map(m => {
              const has = caughtIds.has(m.id)
              return (
                <div key={m.id} className={`card flex flex-col items-center p-2 text-center transition-all ${has ? 'border-gold-500/30' : 'opacity-40 grayscale'}`}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden mb-1 border border-gray-700">
                    <img src={getMonsterImageUrl(m)} alt="Monster" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[9px] font-bold text-gray-200 truncate w-full">{has ? m.name : '???'}</p>
                  <p className="text-[7px] text-gray-500 uppercase">{m.type}</p>
                  {has && m.info && (
                    <div className="mt-1 pt-1 border-t border-gray-800 w-full text-[6px] text-gray-400 space-y-0.5">
                       <p>⚖️ {m.info.weight}</p>
                       <p>📏 {m.info.size}</p>
                       <p className="truncate">❤️ {m.info.likes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      <button onClick={() => spawnMiniBoss('test')} className="text-[8px] opacity-10 fixed bottom-20 right-2">DEV</button>
    </div>
  )
}
