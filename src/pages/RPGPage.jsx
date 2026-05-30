// Datei: src/pages/RPGPage.jsx
// RPG-Bereich: Dungeon / Shop / Quests (vereinfacht)
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCharacter } from '../hooks/useCharacter'
import { Swords, Shield, Zap, Heart, ShoppingBag, Skull, Trophy, Lock } from 'lucide-react'
import { classDefinitions } from '../utils/xp'

// Einfache Gegner basierend auf Level
const enemies = [
  { name: 'Schleim', icon: '🟢', hp: 20, attack: 3, xp: 15, minLevel: 1 },
  { name: 'Ratte', icon: '🐀', hp: 30, attack: 5, xp: 25, minLevel: 1 },
  { name: 'Goblin', icon: '👺', hp: 50, attack: 8, xp: 40, minLevel: 2 },
  { name: 'Skelett', icon: '💀', hp: 70, attack: 12, xp: 60, minLevel: 3 },
  { name: 'Wolf', icon: '🐺', hp: 60, attack: 15, xp: 55, minLevel: 4 },
  { name: 'Ork', icon: '👹', hp: 100, attack: 18, xp: 80, minLevel: 5 },
  { name: 'Troll', icon: '🧌', hp: 150, attack: 22, xp: 120, minLevel: 7 },
  { name: 'Drache', icon: '🐉', hp: 250, attack: 35, xp: 250, minLevel: 10 }
]

// Shop-Items
const shopItems = [
  { id: 'ring_power', name: 'Ring der Macht', icon: '💍', type: 'ring', cost: 100, bonus: { staerke: 3 }, description: '+3 Stärke' },
  { id: 'amulet_wisdom', name: 'Amulett der Weisheit', icon: '📿', type: 'amulet', cost: 100, bonus: { intelligenz: 3 }, description: '+3 Intelligenz' },
  { id: 'armor_stamina', name: 'Rüstung der Ausdauer', icon: '🛡️', type: 'armor', cost: 150, bonus: { ausdauer: 5 }, description: '+5 Ausdauer' },
  { id: 'boots_speed', name: 'Stiefel der Geschwindigkeit', icon: '👢', type: 'boots', cost: 120, bonus: { ausdauer: 2, staerke: 2 }, description: '+2 Ausdauer, +2 Stärke' },
  { id: 'crown_will', name: 'Krone der Willenskraft', icon: '👑', type: 'crown', cost: 200, bonus: { willenskraft: 5 }, description: '+5 Willenskraft' },
  { id: 'sword_flame', name: 'Flammenschwert', icon: '🗡️', type: 'weapon', cost: 250, bonus: { staerke: 5, willenskraft: 2 }, description: '+5 Stärke, +2 Willenskraft' }
]

export default function RPGPage() {
  const { character, updateCharacter } = useAuth()
  const { levelInfo } = useCharacter()
  const [tab, setTab] = useState('dungeon') // dungeon | shop
  const [battleLog, setBattleLog] = useState([])
  const [currentEnemy, setCurrentEnemy] = useState(null)
  const [enemyHp, setEnemyHp] = useState(0)
  const [playerHp, setPlayerHp] = useState(100)
  const [battling, setBattling] = useState(false)
  const [inventory, setInventory] = useState(character?.equipment || [])

  const stats = character?.stats || { staerke: 1, ausdauer: 1, intelligenz: 1, willenskraft: 1 }
  const playerAttack = (stats.staerke || 1) * 2 + Math.floor(Math.random() * 6)
  const playerDefense = (stats.ausdauer || 1) + Math.floor(Math.random() * 4)
  const playerMaxHp = 50 + (stats.willenskraft || 1) * 10 + levelInfo.level * 5

  const startBattle = (enemy) => {
    setCurrentEnemy(enemy)
    setEnemyHp(enemy.hp)
    setPlayerHp(playerMaxHp)
    setBattleLog([`⚔️ Ein wilder ${enemy.name} erscheint!`])
    setBattling(true)
  }

  const attackRound = () => {
    if (!currentEnemy) return

    const pAtk = (stats.staerke || 1) * 2 + Math.floor(Math.random() * 8)
    const eAtk = currentEnemy.attack + Math.floor(Math.random() * 5)
    const eDef = Math.floor(Math.random() * 3)
    const damageToEnemy = Math.max(1, pAtk - eDef)
    const damageToPlayer = Math.max(1, eAtk - (stats.ausdauer || 1))

    const newEnemyHp = enemyHp - damageToEnemy
    const newPlayerHp = playerHp - damageToPlayer

    const log = [...battleLog]
    log.push(`⚔️ Du triffst ${currentEnemy.name} für ${damageToEnemy} Schaden!`)
    log.push(`💥 ${currentEnemy.name} trifft dich für ${damageToPlayer} Schaden!`)

    setEnemyHp(Math.max(0, newEnemyHp))
    setPlayerHp(Math.max(0, newPlayerHp))
    setBattleLog(log)

    if (newEnemyHp <= 0) {
      log.push(`🎉 Du hast ${currentEnemy.name} besiegt! +${currentEnemy.xp} XP`)
      setBattleLog(log)
      setBattling(false)
      // XP hinzufügen
      updateCharacter({ xp: (character?.xp || 0) + currentEnemy.xp })
    } else if (newPlayerHp <= 0) {
      log.push(`💀 Du wurdest besiegt... Sei beim nächsten Mal stärker!`)
      setBattleLog(log)
      setBattling(false)
    }
  }

  const buyItem = (item) => {
    if ((character?.xp || 0) < item.cost) return
    if (inventory.find(i => i.id === item.id)) return

    const newInventory = [...inventory, item]
    setInventory(newInventory)
    updateCharacter({
      xp: (character?.xp || 0) - item.cost,
      equipment: newInventory
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400">🏰 RPG-Bereich</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('dungeon')}
          className={`tab-btn ${tab === 'dungeon' ? 'active' : ''}`}
        >
          <Skull className="w-4 h-4 inline mr-1" /> Dungeon
        </button>
        <button
          onClick={() => setTab('shop')}
          className={`tab-btn ${tab === 'shop' ? 'active' : ''}`}
        >
          <ShoppingBag className="w-4 h-4 inline mr-1" /> Shop
        </button>
      </div>

      {/* Dungeon */}
      {tab === 'dungeon' && (
        <div className="space-y-4">
          {!currentEnemy ? (
            <>
              <p className="text-gray-400 text-sm">
                Wähle einen Gegner. Höhere Level schalten stärkere Gegner frei!
              </p>
              <div className="grid grid-cols-2 gap-3">
                {enemies.map((enemy, i) => {
                  const locked = levelInfo.level < enemy.minLevel
                  return (
                    <button
                      key={i}
                      onClick={() => !locked && startBattle(enemy)}
                      disabled={locked}
                      className={`card text-center transition-all ${
                        locked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:border-gold-500/30 cursor-pointer'
                      }`}
                    >
                      <span className="text-3xl block mb-2">
                        {locked ? <Lock className="w-8 h-8 mx-auto text-gray-600" /> : enemy.icon}
                      </span>
                      <h3 className="font-title text-sm text-gray-200">{enemy.name}</h3>
                      <p className="text-xs text-gray-500">HP: {enemy.hp} | ATK: {enemy.attack}</p>
                      <p className="text-xs text-gold-500 mt-1">+{enemy.xp} XP</p>
                      {locked && (
                        <p className="text-xs text-red-400 mt-1">Ab Level {enemy.minLevel}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            /* Kampfbildschirm */
            <div className="space-y-4">
              {/* Gegner */}
              <div className="card border-red-800/30">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{currentEnemy.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-title text-lg text-red-400">{currentEnemy.name}</h3>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">HP</span>
                        <span className="text-red-400">{enemyHp}/{currentEnemy.hp}</span>
                      </div>
                      <div className="h-3 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${(enemyHp / currentEnemy.hp) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spieler */}
              <div className="card border-green-800/30">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{character?.name?.charAt(0) || '⚔️'}</span>
                  <div className="flex-1">
                    <h3 className="font-title text-lg text-green-400">{character?.name || 'Held'}</h3>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">HP</span>
                        <span className="text-green-400">{playerHp}/{playerMaxHp}</span>
                      </div>
                      <div className="h-3 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-700 to-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kampf-Log */}
              <div className="card bg-dark-400/50 max-h-40 overflow-y-auto">
                {battleLog.map((entry, i) => (
                  <p key={i} className="text-sm text-gray-300 py-0.5">{entry}</p>
                ))}
              </div>

              {/* Aktionen */}
              <div className="flex gap-3">
                {battling ? (
                  <button onClick={attackRound} className="btn-primary flex-1 py-3 text-lg">
                    ⚔️ Angreifen
                  </button>
                ) : (
                  <button
                    onClick={() => { setCurrentEnemy(null); setBattleLog([]) }}
                    className="btn-secondary flex-1 py-3"
                  >
                    🔙 Zurück
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Shop */}
      {tab === 'shop' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">Kaufe Ausrüstung mit deinen XP!</p>
            <span className="text-gold-400 font-title font-bold">{character?.xp || 0} XP</span>
          </div>
          <div className="space-y-3">
            {shopItems.map(item => {
              const owned = inventory.find(i => i.id === item.id)
              const canAfford = (character?.xp || 0) >= item.cost
              return (
                <div key={item.id} className={`card ${owned ? 'border-green-700/30 opacity-70' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-title text-gray-200">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      {owned ? (
                        <span className="badge bg-green-900/50 text-green-400 border border-green-700/50">
                          ✓ Besessen
                        </span>
                      ) : (
                        <button
                          onClick={() => buyItem(item)}
                          disabled={!canAfford}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          {item.cost} XP
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}