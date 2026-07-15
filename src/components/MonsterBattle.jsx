import { useState, useEffect } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { MOVES, TYPE_CHART, MONSTER_MAP, getMonsterImageUrl } from '../utils/monsters'
import { vibrate, VIBRATION_PATTERNS } from '../utils/vibrate'
import { Swords, Heart, Zap, Sparkles, AlertCircle } from 'lucide-react'

export default function MonsterBattle() {
  const { activeMiniBoss, setActiveMiniBoss, userMonsters, userTeam, catchMonster } = useAdventure()
  const [playerMonster, setPlayerMonster] = useState(null)
  const [enemyHp, setEnemyHp] = useState(0)
  const [playerHp, setPlayerHp] = useState(0)
  const [battleLog, setBattleLog] = useState([])
  const [turn, setPlayerTurn] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [animEffect, setAnimEffect] = useState(null) // 'hit-enemy' | 'hit-player' | 'crit'
  const [battleMode, setBattleMode] = useState(null) // 'free' | 'task'

  // Initialisierung des Kampfes
  useEffect(() => {
    if (activeMiniBoss) {
      setEnemyHp(activeMiniBoss.maxHp)
      const firstId = userTeam.slot_1 || userTeam.slot_2 || userTeam.slot_3
      const monster = userMonsters.find(m => m.id === firstId)
      if (monster) {
        setPlayerMonster(monster)
        setPlayerHp(monster.stats.hp * 2)
      }
      setBattleLog([`Ein wildes ${activeMiniBoss.name} greift an!`])
      setBattleMode(null)
    }
  }, [activeMiniBoss])

  if (!activeMiniBoss) return null

  if (!battleMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-dark-500/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center space-y-6">
          <h2 className="font-title text-2xl text-gold-400">Kampf-Modus wählen</h2>
          <div className="grid gap-3">
            <button onClick={() => setBattleMode('free')} className="btn-secondary py-4">
               <span className="block font-bold">Freier Kampf</span>
               <span className="text-[10px] text-gray-500">Keine Tasks nötig, aber Fangen unmöglich.</span>
            </button>
            <button onClick={() => setBattleMode('task')} className="btn-primary py-4">
               <span className="block font-bold text-dark-600">Kampf mit Tasks</span>
               <span className="text-[10px] text-dark-500">Führen von realen Übungen erlaubt das Fangen!</span>
            </button>
          </div>
          <button onClick={() => setActiveMiniBoss(null)} className="text-gray-500 text-sm">Flüchten</button>
        </div>
      </div>
    )
  }

  const calculateDamage = (attacker, defender, move) => {
    let mult = 1
    let isWeak = false
    let isStrong = false
    
    const defType = defender.type || MONSTER_MAP[defender.monster_id]?.type
    
    if (TYPE_CHART[move.type]?.strong === defType) {
       mult = 2.0 // Doppelt bei Schwäche
       isStrong = true
    }
    if (TYPE_CHART[move.type]?.weak === defType) {
       mult = 0.5
       isWeak = true
    }
    
    // Crit Chance
    const isCrit = Math.random() < (move.critChance || 0.05)
    if (isCrit) mult *= 1.5

    const atkVal = attacker.stats?.atk || attacker.baseStats?.atk || 10
    const baseDmg = Math.round((move.power + atkVal) * mult)
    
    return { 
      dmg: Math.max(5, baseDmg), 
      isCrit, 
      isWeak, 
      isStrong 
    }
  }

  const handleMove = (moveKey) => {
    if (!turn || !playerMonster || enemyHp <= 0) return
    const move = MOVES[moveKey]
    
    if (battleMode === 'task' && move.taskReq) {
      if (!window.confirm(`Dieser Move erfordert: ${move.taskReq}. Hast du das erledigt?`)) return
    }

    const { dmg, isCrit, isStrong, isWeak } = calculateDamage(playerMonster, activeMiniBoss, move)
    const newEnemyHp = Math.max(0, enemyHp - dmg)
    
    setEnemyHp(newEnemyHp)
    setAnimEffect('hit-enemy')
    setTimeout(() => setAnimEffect(null), 500)

    let msg = `${playerMonster.nickname || playerMonster.monster_id} nutzt ${move.name}!`
    if (isCrit) { msg += " KRITISCHER TREFFER!"; vibrate(VIBRATION_PATTERNS.CRIT); }
    if (isStrong) msg += " Sehr effektiv!";
    if (isWeak) msg += " Nicht sehr effektiv...";
    
    setBattleLog(prev => [`${msg} (-${dmg} HP)`, ...prev])
    vibrate(VIBRATION_PATTERNS.SUCCESS)

    if (newEnemyHp <= 0) {
      setBattleLog(prev => [`Sieg! Das ${activeMiniBoss.name} ist geschwächt.`, ...prev])
    } else {
      setPlayerTurn(false)
      setTimeout(enemyTurn, 1000)
    }
  }

  const enemyTurn = () => {
    if (playerHp <= 0) return
    const move = MOVES.tackle
    const { dmg, isCrit } = calculateDamage(activeMiniBoss, playerMonster, move)
    const newPlayerHp = Math.max(0, playerHp - dmg)
    
    setPlayerHp(newPlayerHp)
    setAnimEffect('hit-player')
    setTimeout(() => setAnimEffect(null), 500)

    setBattleLog(prev => [`${activeMiniBoss.name} nutzt ${move.name}! (-${dmg} HP)`, ...prev])
    setPlayerTurn(true)
    
    if (newPlayerHp <= 0) {
       setBattleLog(prev => [`Dein Monster wurde besiegt!`, ...prev])
       vibrate(VIBRATION_PATTERNS.ITEM_DROP)
    }
  }

  const handleCatch = async () => {
    if (isCapturing || enemyHp > (activeMiniBoss.maxHp * 0.5)) {
       alert("Du musst das Monster erst schwächen (unter 50% HP)!");
       return;
    }
    setIsCapturing(true)
    const catchRate = (1 - (enemyHp / activeMiniBoss.maxHp)) * 0.7 + 0.1 
    
    setBattleLog(prev => ["Versuche zu fangen...", ...prev])
    await new Promise(r => setTimeout(r, 1500))

    if (Math.random() < catchRate) {
      vibrate(VIBRATION_PATTERNS.LEVEL_UP)
      setBattleLog(prev => [`Erfolg! ${activeMiniBoss.name} wurde gefangen!`, ...prev])
      
      // Nutze die monster_id aus dem aktiven Boss für den Eintrag
      await catchMonster(activeMiniBoss.monster_id || activeMiniBoss.id)
      
      setTimeout(() => setActiveMiniBoss(null), 2000)
    } else {
      setBattleLog(prev => ["Es ist ausgebrochen!", ...prev])
      setIsCapturing(false)
      setPlayerTurn(false)
      setTimeout(enemyTurn, 1000)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-dark-500 flex flex-col overflow-hidden animate-fade-in">
      {/* HEADER */}
      <div className="p-4 flex justify-between items-center border-b border-gray-800">
        <h2 className="font-title text-gold-400">Monster Kampf</h2>
        <button onClick={() => setActiveMiniBoss(null)} className="text-gray-500">Flüchten</button>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-around relative">
        {/* ENEMY */}
        <div className={`flex justify-end pr-4 transition-transform duration-300 ${animEffect === 'hit-enemy' ? 'scale-90 opacity-50' : ''}`}>
           <div className="card w-64 border-red-900/40 relative bg-dark-400/80">
              <div className="absolute -top-16 -left-12 w-32 h-32 overflow-hidden rounded-full border-2 border-red-500/30">
                 <img src={getMonsterImageUrl(activeMiniBoss)} alt="Monster" className="w-full h-full object-cover" />
              </div>
              <p className="font-title text-sm text-gray-100 pl-16">{activeMiniBoss.name}</p>
              <div className="mt-2 h-2 bg-dark-500 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${(enemyHp/activeMiniBoss.maxHp)*100}%` }} />
              </div>
              <p className="text-[10px] text-right mt-1 text-gray-500">{enemyHp} / {activeMiniBoss.maxHp} HP</p>
           </div>
        </div>

        {/* PLAYER */}
        {playerMonster ? (
          <div className={`flex justify-start pl-4 transition-transform duration-300 ${animEffect === 'hit-player' ? 'scale-90 opacity-50' : ''}`}>
            <div className="card w-64 border-blue-900/40 relative bg-dark-400/80">
               <div className="absolute -top-16 -right-12 w-32 h-32 overflow-hidden rounded-full border-2 border-blue-500/30 shadow-lg">
                  <img src={getMonsterImageUrl(playerMonster)} alt="Player Monster" className="w-full h-full object-cover" />
               </div>
               <p className="font-title text-sm text-gray-100 pr-16">{playerMonster.nickname || MONSTER_MAP[playerMonster.monster_id].name}</p>
               <div className="mt-2 h-2 bg-dark-500 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(playerHp/(playerMonster.stats.hp*2))*100}%` }} />
               </div>
               <p className="text-[10px] text-right mt-1 text-gray-500">{playerHp} HP</p>
            </div>
          </div>
        ) : (
          <div className="card text-center py-10 bg-red-900/10 border-red-900/20">
             <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
             <p className="text-sm text-red-400">Kein Monster im Team! Du kannst nicht kämpfen.</p>
             <button onClick={() => setActiveMiniBoss(null)} className="btn-secondary mt-4">Flüchten</button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="bg-dark-300 p-4 border-t border-gray-800 h-72 flex flex-col">
        <div className="flex-1 bg-dark-500 rounded-lg p-3 mb-4 overflow-y-auto border border-gray-800">
           {battleLog.slice(0, 3).map((log, i) => (
             <p key={i} className={`text-xs ${i === 0 ? 'text-gray-100 font-bold' : 'text-gray-500'}`}>{log}</p>
           ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {playerMonster?.moves.map(m => {
            const move = MOVES[m]
            const typeMismatch = move.learnableTypes && !move.learnableTypes.includes(MONSTER_MAP[playerMonster.monster_id].type) && move.type !== 'neutral'
            return (
              <button 
                key={m} 
                onClick={() => handleMove(m)}
                disabled={!turn || playerHp <= 0 || enemyHp <= 0 || typeMismatch}
                className={`btn-secondary py-2 text-xs flex flex-col items-center ${typeMismatch ? 'opacity-30' : ''}`}
              >
                <span>{move.name}</span>
                {move.taskReq && <span className="text-[8px] text-gold-500 uppercase">{move.taskReq}</span>}
                {typeMismatch && <span className="text-[7px] text-red-500">Inkompatibel</span>}
              </button>
            )
          })}
          <button 
            onClick={handleCatch}
            disabled={!turn || isCapturing || enemyHp <= 0 || playerHp <= 0 || battleMode !== 'task'}
            className={`btn-primary py-2 text-xs flex items-center justify-center gap-1 ${battleMode !== 'task' ? 'opacity-30 grayscale' : ''}`}
            title={battleMode !== 'task' ? 'Nur im Task-Kampf möglich' : ''}
          >
            <Sparkles className="w-3 h-3"/> Fangen
          </button>
        </div>
      </div>
    </div>
  )
}
