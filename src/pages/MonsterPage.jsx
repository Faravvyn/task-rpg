import { useState } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { MONSTER_MAP } from '../utils/monsters'
import { Shield, Swords, Plus, CheckCircle2, ChevronRight, Zap, Heart, Star } from 'lucide-react'
import { updateMonster } from '../lib/adventureRepo'

export default function MonsterPage() {
  const { userMonsters, userTeam, updateTeam, spawnMiniBoss } = useAdventure()
  const [selectingFor, setSelectingFor] = useState(null) // slot_1, slot_2, slot_3
  const [inspecting, setInspecting] = useState(null) // monsterUid

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
    
    const newStats = { ...m.stats }
    newStats[statKey] = (newStats[statKey] || 0) + 1
    
    await updateMonster(monsterUid, {
      stats: newStats,
      stat_points: m.stat_points - 1
    })
    // In einer echten App würden wir den State hier global refreshen
    window.location.reload(); // Quick Fix für Demo
  }

  const inspectedMonster = userMonsters.find(m => m.id === inspecting)

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2">🐾 Monster-Team</h1>
        <button 
           onClick={() => spawnMiniBoss()}
           className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full"
        >
          Boss spawnen (Dev)
        </button>
      </div>

      {/* TEAM SECTION */}
      <div className="grid grid-cols-3 gap-3">
        {team.map((t, i) => {
          const monster = userMonsters.find(m => m.id === t.id)
          const meta = monster ? MONSTER_MAP[monster.monster_id] : null
          return (
            <div key={t.slot} className={`card flex flex-col items-center p-3 border-2 ${selectingFor === t.slot ? 'border-gold-500 animate-pulse' : 'border-gray-800'}`}>
              <p className="text-[10px] text-gray-500 uppercase mb-2">Slot {i+1}</p>
              <button 
                onClick={() => setSelectingFor(t.slot)}
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl bg-dark-400 border border-gray-700 hover:border-gold-500/50 transition-all`}
              >
                {meta ? meta.icon : <Plus className="text-gray-600" />}
              </button>
              <p className="text-[11px] mt-2 text-gray-300 font-bold truncate w-full text-center">
                {monster?.nickname || meta?.name || 'Leer'}
              </p>
            </div>
          )
        })}
      </div>

      {/* INSPECT / UPGRADE */}
      {inspectedMonster && (
        <div className="card border-gold-500/40 bg-gold-500/5 animate-slide-up">
           <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                 <div className="text-5xl">{MONSTER_MAP[inspectedMonster.monster_id].icon}</div>
                 <div>
                    <h3 className="font-title text-lg text-gold-300">{inspectedMonster.nickname || MONSTER_MAP[inspectedMonster.monster_id].name}</h3>
                    <p className="text-xs text-gray-400 uppercase">Level {inspectedMonster.level}</p>
                 </div>
              </div>
              <button onClick={() => setInspecting(null)} className="text-gray-500">Schließen</button>
           </div>
           
           <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                 <span>Verfügbare Punkte: <b className="text-gold-400">{inspectedMonster.stat_points || 0}</b></span>
              </div>
              {['hp', 'atk', 'def'].map(stat => (
                <div key={stat} className="flex items-center gap-3">
                  <span className="text-xs w-8 uppercase">{stat}</span>
                  <div className="flex-1 h-2 bg-dark-500 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-500" style={{ width: `${Math.min(100, (inspectedMonster.stats[stat] || 10) * 2)}%` }} />
                  </div>
                  <span className="text-xs font-mono w-6">{inspectedMonster.stats[stat] || 0}</span>
                  <button 
                    disabled={(inspectedMonster.stat_points || 0) <= 0}
                    onClick={() => handleUpgradeStat(inspectedMonster.id, stat)}
                    className="w-6 h-6 rounded bg-gold-500 text-dark-600 flex items-center justify-center disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* COLLECTION */}
      <div className="space-y-3">
        <h2 className="font-title text-lg text-gray-200">Deine Sammlung ({userMonsters.length})</h2>
        <div className="grid gap-2">
          {userMonsters.length === 0 && <p className="text-center py-10 text-gray-500">Noch keine Monster gefangen.</p>}
          {userMonsters.map(m => {
            const meta = MONSTER_MAP[m.monster_id]
            const isTeam = Object.values(userTeam).includes(m.id)
            return (
              <div 
                key={m.id} 
                onClick={() => selectingFor ? handleSelect(m.id) : setInspecting(m.id)}
                className={`card flex items-center gap-4 ${isTeam ? 'border-gold-500/30 bg-gold-500/5' : ''} cursor-pointer hover:border-gold-400`}
              >
                <div className="text-3xl">{meta?.icon}</div>
                <div className="flex-1">
                  <h3 className="font-title text-sm text-gray-100">{m.nickname || meta?.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-dark-400 px-1.5 py-0.5 rounded text-gray-400 uppercase">{meta?.type}</span>
                    <span className="text-[10px] text-gold-500 font-bold">Lv. {m.level}</span>
                  </div>
                </div>
                {m.stat_points > 0 && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded-full animate-pulse">!</span>}
                {isTeam && <CheckCircle2 className="w-4 h-4 text-gold-400" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
