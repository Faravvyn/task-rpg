// Datei: src/pages/RPGPage.jsx
// RPG-Hub: Dungeon-Crawler, Shop (Verbrauchsgüter) und Skill-Tree.
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCharacter } from '../hooks/useCharacter'
import { SKILL_TREE } from '../utils/xp'
import { BACKSTORY } from '../utils/adventure'
import { 
  Skull, ShoppingBag, GraduationCap, Coins, 
  Map as MapIcon, ChevronRight, Lock, CheckCircle2, 
  Zap, Star, Sparkles, Flame 
} from 'lucide-react'

const consumables = [
  { id: 'potion_xp', name: 'XP-Elixier', desc: '+50% XP für die nächste Stunde.', cost: 50, icon: '🧪', type: 'buff' },
  { id: 'potion_luck', name: 'Glücks-Tinktur', desc: '+20% Artefakt-Drop-Chance (1h).', cost: 75, icon: '🍀', type: 'buff' },
  { id: 'monster_lure', name: 'Monster-Köder', desc: 'Garantiert eine Monster-Spur bei der nächsten Task.', cost: 100, icon: '🍖', type: 'item' },
  { id: 'streak_shield', name: 'Streak-Schild', desc: 'Schützt deinen Streak bei Vergessen.', cost: 150, icon: '🛡️', type: 'item' },
]

function getDungeonBg(floor) {
  if (floor <= 10) return '/assets/dungeon_bg_1.jpg'
  return '/assets/dungeon_bg_2.jpg'
}

export default function RPGPage() {
  const { character, updateCharacter } = useAuth()
  const { levelInfo } = useCharacter()
  const [tab, setTab] = useState('dungeon') // dungeon | shop | skills
  
  const gold = character?.gold || 0
  const room = character?.dungeon_room || 0
  const floor = character?.dungeon_floor || 1
  const skillPoints = character?.skill_points || 0
  const ownedSkills = character?.skills || {}

  const handleBuy = async (item) => {
    if (gold < item.cost) return
    const newConsumables = { ...(character.consumables || {}) }
    newConsumables[item.id] = (newConsumables[item.id] || 0) + 1
    await updateCharacter({ gold: gold - item.cost, consumables: newConsumables })
  }

  const handleLearnSkill = async (id, skill) => {
    if (skillPoints < skill.cost || levelInfo.level < skill.reqLevel) return
    const newSkills = { ...ownedSkills, [id]: true }
    await updateCharacter({ skill_points: skillPoints - skill.cost, skills: newSkills })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400">🏰 RPG-Hub</h1>
        <div className="flex items-center gap-2 bg-dark-400 px-3 py-1.5 rounded-full border border-gold-500/30">
          <Coins className="w-4 h-4 text-gold-400" />
          <span className="font-title text-gold-300">{gold}</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'dungeon', label: 'Dungeon', icon: Skull },
          { id: 'shop', label: 'Shop', icon: ShoppingBag },
          { id: 'skills', label: 'Talente', icon: GraduationCap },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`tab-btn flex items-center gap-2 ${tab === t.id ? 'active' : ''}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* DUNGEON TAB */}
      {tab === 'dungeon' && (
        <div className="space-y-4">
          <div className="card bg-dark-400 border-gray-700 border-l-4 border-l-red-500">
             <p className="text-xs italic text-gray-400">
               {floor <= 10 ? BACKSTORY.dungeon[1] : floor <= 20 ? BACKSTORY.dungeon[11] : BACKSTORY.dungeon[21]}
             </p>
          </div>

          <div 
            className="card relative overflow-hidden bg-cover bg-center border-red-900/40 min-h-[200px] flex flex-col justify-end"
            style={{ backgroundImage: `linear-gradient(to top, rgba(16,18,26,0.95), rgba(16,18,26,0.4)), url(${getDungeonBg(floor)})` }}
          >
            <div className="relative z-10 p-2">
              <h2 className="font-title text-2xl text-red-400 mb-1 drop-shadow-md">Ebene {floor}</h2>
              <p className="text-sm text-gray-200 mb-4 font-semibold drop-shadow-md">Raum {room} von 10</p>
              
              <div className="flex gap-1.5 mb-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`flex-1 h-3 rounded-sm border ${i < room ? 'bg-red-600 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : i === room ? 'bg-white/20 border-white/40 animate-pulse' : 'bg-black/40 border-gray-700'}`} />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-300 bg-black/40 backdrop-blur-sm p-2 rounded-lg">
                <span className="flex items-center gap-1"><MapIcon className="w-3 h-3" /> Jede erledigte Aufgabe führt dich weiter.</span>
                <span className="font-semibold text-gold-400">🎁 Belohnung in {10 - room} Räumen</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="card border-blue-900/20 bg-blue-900/5">
                <h3 className="font-title text-blue-300 text-sm mb-2">Expeditions-Status</h3>
                <p className="text-xs text-gray-400">Du hast diese Woche bereits <b className="text-gray-200">{(floor-1)*10 + room}</b> Räume gesäubert. Weiter so!</p>
             </div>
             <div className="card border-gold-900/20 bg-gold-900/5">
                <h3 className="font-title text-gold-300 text-sm mb-2">Combo-Bonus</h3>
                <p className="text-xs text-gray-400">Erledige 3 Aufgaben in 15 Min für den <b className="text-gold-400">Frenzy-Modus</b> (+20% Belohnungen).</p>
             </div>
          </div>
        </div>
      )}

      {/* SHOP TAB */}
      {tab === 'shop' && (
        <div className="space-y-3">
          <div className="card h-40 bg-cover bg-center flex items-end p-4 border-gold-500/20" 
               style={{ backgroundImage: "linear-gradient(to top, rgba(16,18,26,0.9), transparent), url('/assets/shop_bg.jpg')" }}>
            <p className="text-sm text-gold-300 font-title drop-shadow-md">Willkommen im Archiv des Alchemisten...</p>
          </div>
          <p className="text-sm text-gray-400 px-1 italic">Tausche dein Gold gegen seltene Gebräue und Relikte.</p>
          {consumables.map(item => {
            const count = character.consumables?.[item.id] || 0
            return (
              <div key={item.id} className="card flex items-center gap-4 group hover:border-gold-500/40 transition-all">
                <div className="w-12 h-12 rounded-xl bg-dark-400 flex items-center justify-center text-3xl shadow-inner">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-title text-gray-100 flex items-center gap-2">{item.name} {count > 0 && <span className="text-[10px] bg-gold-500/20 text-gold-400 px-1.5 rounded">{count}x</span>}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                </div>
                <button 
                  onClick={() => handleBuy(item)} 
                  disabled={gold < item.cost}
                  className="btn-primary py-1 px-4 text-sm flex flex-col items-center min-w-[80px]"
                >
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> {item.cost}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* SKILLS TAB */}
      {tab === 'skills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-400">Verfügbare Talentpunkte: <b className="text-gold-400">{skillPoints}</b></p>
            <p className="text-xs text-gray-500">Level {levelInfo.level}</p>
          </div>
          <div className="grid gap-2">
            {Object.entries(SKILL_TREE).map(([id, skill]) => {
              const owned = ownedSkills[id]
              const locked = levelInfo.level < skill.reqLevel
              const canAfford = skillPoints >= skill.cost
              return (
                <div key={id} className={`card flex items-center gap-4 ${owned ? 'border-green-500/30 bg-green-500/5' : locked ? 'opacity-50 grayscale' : ''}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${owned ? 'bg-green-500/20' : 'bg-dark-400'}`}>{skill.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-title text-sm text-gray-200">{skill.name} {locked && <span className="text-[10px] text-red-400 ml-1">Ab Lv.{skill.reqLevel}</span>}</h3>
                    <p className="text-[11px] text-gray-500">{skill.desc}</p>
                  </div>
                  {owned ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <button 
                      onClick={() => handleLearnSkill(id, skill)} 
                      disabled={locked || !canAfford}
                      className={`text-xs px-3 py-1.5 rounded-lg border ${canAfford ? 'border-gold-500 text-gold-400 hover:bg-gold-500/10' : 'border-gray-700 text-gray-600'}`}
                    >
                      {skill.cost} Punkt{skill.cost > 1 ? 'e' : ''}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
