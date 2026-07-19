// Datei: src/pages/AdventurePage.jsx
// Adventure-Hub: Übersicht über Boss, Kodex, Schmiede, Arena & Inventar.
import { Link } from 'react-router-dom'
import { useAdventure } from '../context/AdventureContext'
import { Map, Swords, BookOpen, Hammer, Trophy, Package, ChevronRight, ScrollText, Shield } from 'lucide-react'
import { SETS } from '../utils/adventure'
import { useAchievements } from '../context/AchievementContext'

export default function AdventurePage() {
  const { boss, setProgress, characterArtifacts, arena, completedSetBonuses, activeQuests, loadout } = useAdventure()
  const { todayEvent } = useAchievements()

  const completedSets = setProgress.filter((p) => p.complete).length
  const bossHpPercent = boss ? (boss.hp / boss.maxHp) * 100 : 0

  const tiles = [
    {
      to: '/adventure/quests', icon: ScrollText, color: 'text-green-400', title: 'Sonderquests',
      desc: activeQuests.length > 0 ? `${activeQuests.length} aktiv – extra XP & Drops!` : 'Aktuell keine aktiv',
      accent: 'border-green-800/30',
    },
    {
      to: '/adventure/loadout', icon: Shield, color: 'text-cyan-400', title: 'Ausrüstung',
      desc: Object.keys(loadout || {}).length > 0 ? `${Object.keys(loadout).length} Slot(s) – doppelter Bonus` : 'Slots wählen für doppelten Bonus',
      accent: 'border-cyan-800/30',
    },
    {
      to: '/adventure/boss', icon: Swords, color: 'text-red-400', title: 'Wöchentlicher Boss',
      desc: boss ? (boss.defeated ? `${boss.name} besiegt! 🎉` : `${boss.name} · ${Math.round(bossHpPercent)}% HP`) : 'Kein Boss',
      accent: 'border-red-800/30',
    },
    {
      to: '/adventure/kodex', icon: BookOpen, color: 'text-blue-400', title: 'Kodex / Sammelalbum',
      desc: `${completedSets}/${SETS.length} Sets abgeschlossen`,
      accent: 'border-blue-800/30',
    },
    {
      to: '/adventure/forge', icon: Hammer, color: 'text-orange-400', title: 'Schmiede',
      desc: 'Artefakte verschmelzen & aufwerten',
      accent: 'border-orange-800/30',
    },
    {
      to: '/adventure/arena', icon: Trophy, color: 'text-gold-400', title: 'Arena',
      desc: `${arena.wins} Siege diese Woche`,
      accent: 'border-gold-700/30',
    },
    {
      to: '/adventure/inventory', icon: Package, color: 'text-purple-400', title: 'Inventar',
      desc: `${characterArtifacts.length} Artefakte`,
      accent: 'border-purple-800/30',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Map className="w-6 h-6" />Abenteuer</h1>

      {todayEvent && (
        <div className="card border-gold-500/30 bg-gold-500/5 flex items-center gap-3">
          <span className="text-3xl">{todayEvent.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-gold-300">Tages-Event: {todayEvent.title}</p>
            <p className="text-xs text-gray-400">{todayEvent.desc}</p>
          </div>
        </div>
      )}

      {/* Boss-Highlight */}
      {boss && (
        <Link to="/adventure/boss" className={`card block ${boss.defeated ? 'border-green-700/40' : 'border-red-800/40'} relative overflow-hidden`}>
          <div className="absolute right-2 top-0 text-[110px] leading-none opacity-10">{boss.icon}</div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{boss.icon}</span>
              <div className="flex-1">
                <h2 className="font-title text-lg text-red-300">{boss.name}</h2>
                <p className="text-xs text-gray-500">Wöchentlicher Raid-Boss</p>
              </div>
              {boss.defeated && <span className="badge bg-green-900/50 text-green-400 border border-green-700/50">Besiegt</span>}
            </div>
            <div className="h-3 bg-dark-400 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-700 to-red-400 transition-all" style={{ width: `${bossHpPercent}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Dein Schaden: <span className="text-gold-400">{boss.myDamage}</span></p>
          </div>
        </Link>
      )}

      {/* Aktive Set-Boni */}
      {completedSetBonuses.length > 0 && (
        <div className="card">
          <h3 className="font-title text-gray-200 mb-2 text-sm">Aktive permanente Boni</h3>
          <div className="flex flex-wrap gap-2">
            {completedSetBonuses.map((b, i) => <span key={i} className="badge bg-green-900/40 text-green-300 border border-green-700/40">✓ {b.label}</span>)}
          </div>
        </div>
      )}

      {/* Feature-Kacheln */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className={`card flex items-center gap-3 hover:border-gold-700/30 ${t.accent}`}>
            <t.icon className={`w-7 h-7 ${t.color}`} />
            <div className="flex-1">
              <p className="font-semibold text-gray-100">{t.title}</p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </Link>
        ))}
      </div>
    </div>
  )
}
