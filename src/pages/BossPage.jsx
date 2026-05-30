// Datei: src/pages/BossPage.jsx
// Wöchentlicher Raid-Boss. Tasks = Angriffe. Artefakte erhöhen den Schaden.
import { useState } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { useCharacter } from '../hooks/useCharacter'
import { Link } from 'react-router-dom'
import { Swords, Users, Trophy, Sparkles, ListTodo, Shield } from 'lucide-react'
import {
  BASE_TASK_DAMAGE, getDamageMultiplier, getBossLootTier, rarityInfo,
} from '../utils/adventure'

export default function BossPage() {
  const { boss, claimBossLoot, equippedArtifactIds, equippedArtifactIdsUnique, equippedItems } = useAdventure()
  const [lootMsg, setLootMsg] = useState(null)

  if (!boss) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Swords className="w-6 h-6" />Wöchentlicher Boss</h1>
        <div className="card text-center py-12"><p className="text-gray-400">Kein aktiver Boss.</p></div>
      </div>
    )
  }

  const totalDmg = boss.myDamage + boss.communityDamage
  const myPercent = totalDmg > 0 ? (boss.myDamage / totalDmg) * 100 : 0
  const hpPercent = (boss.hp / boss.maxHp) * 100
  const dmgMult = getDamageMultiplier(equippedArtifactIds, equippedArtifactIdsUnique)
  const lootTier = getBossLootTier(myPercent)

  const handleClaim = () => {
    const res = claimBossLoot()
    if (res) setLootMsg(res)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Swords className="w-6 h-6" />Wöchentlicher Boss</h1>

      {/* Boss-Karte */}
      <div className={`card relative overflow-hidden ${boss.defeated ? 'border-green-700/40' : 'border-red-800/40'}`}>
        <div className="absolute right-2 top-0 text-[140px] leading-none opacity-10 pointer-events-none">{boss.icon}</div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{boss.icon}</span>
            <div className="flex-1">
              <h2 className="font-title text-2xl text-red-300">{boss.name}</h2>
              <p className="text-xs text-gray-500">Diese-Woche-Boss · {boss.weekStart}</p>
            </div>
            {boss.defeated && <span className="badge bg-green-900/50 text-green-400 border border-green-700/50">Besiegt!</span>}
          </div>

          {/* HP-Balken */}
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-400">HP</span>
            <span className="text-red-300 font-mono">{boss.hp} / {boss.maxHp}</span>
          </div>
          <div className="h-5 bg-dark-400 rounded-full overflow-hidden border border-gray-700">
            <div className="h-full bg-gradient-to-r from-red-800 via-red-600 to-red-400 transition-all duration-700 ease-out flex items-center justify-end pr-2"
              style={{ width: `${hpPercent}%` }}>
            </div>
          </div>
        </div>
      </div>

      {/* Schadensanteil (Community) */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-gold-500" /><h3 className="font-title text-gray-200">Schadensverteilung</h3></div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1"><span className="text-gold-400">⚔️ Dein Schaden</span><span className="text-gold-300 font-mono">{boss.myDamage} ({myPercent.toFixed(1)}%)</span></div>
            <div className="stat-bar"><div className="stat-bar-fill bg-gold-500" style={{ width: `${myPercent}%` }} /></div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span className="text-gray-400">👥 Community</span><span className="text-gray-400 font-mono">{boss.communityDamage}</span></div>
            <div className="stat-bar"><div className="stat-bar-fill bg-blue-500" style={{ width: `${100 - myPercent}%` }} /></div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">💡 Wer mehr als <span className="text-gold-400">10%</span> des Gesamtschadens beiträgt, erhält bessere Beute. Über <span className="text-gold-400">25%</span> = Champion-Beute.</p>
      </div>

      {/* Dein Schadensprofil */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-gold-500" /><h3 className="font-title text-gray-200">Dein Angriffsprofil</h3></div>
        <p className="text-sm text-gray-400 mb-3">Schadensmultiplikator durch Artefakte & Sets: <span className="text-gold-400 font-bold">×{dmgMult.toFixed(2)}</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(BASE_TASK_DAMAGE).filter(([k]) => k !== 'episch').map(([diff, base]) => (
            <div key={diff} className="bg-dark-400 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 capitalize">{diff}</p>
              <p className="font-title text-gold-300">{Math.round(base * dmgMult)} ⚔️</p>
            </div>
          ))}
        </div>
        {equippedItems.length === 0 && <p className="text-xs text-yellow-500/80 mt-3">Du hast keine Artefakte ausgerüstet. Rüste welche im <Link to="/adventure/inventory" className="underline">Inventar</Link> aus, um mehr Schaden zu machen!</p>}
      </div>

      {/* Aktion */}
      {!boss.defeated ? (
        <Link to="/tasks" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <ListTodo className="w-5 h-5" /> Tasks erledigen = Boss angreifen
        </Link>
      ) : boss.looted ? (
        <div className="card text-center py-6 border-green-700/30">
          <Trophy className="w-10 h-10 text-gold-400 mx-auto mb-2" />
          <p className="text-gray-300">Beute bereits eingesammelt. Nächster Boss erscheint am Montag!</p>
        </div>
      ) : lootTier ? (
        <button onClick={handleClaim} className="btn-primary w-full py-3 flex items-center justify-center gap-2 animate-pulse-gold">
          <Sparkles className="w-5 h-5" /> {lootTier.label} einsammeln (min. {rarityInfo(lootTier.minRarity).name})
        </button>
      ) : (
        <div className="card text-center py-6"><p className="text-gray-400">Du hast keinen Schaden beigetragen – keine Beute diese Woche.</p></div>
      )}

      {lootMsg && (
        <div className="card border-gold-500/40 text-center py-6">
          <p className="text-gray-400 text-sm">Du erhältst:</p>
          <p className={`font-title text-xl ${rarityInfo(lootMsg.artifact.rarity).text}`}>{lootMsg.artifact.icon} {lootMsg.artifact.name}</p>
          <p className="text-xs text-gray-500 mt-1">{lootMsg.tier.label} · Dein Anteil: {lootMsg.percent.toFixed(1)}%</p>
        </div>
      )}
    </div>
  )
}