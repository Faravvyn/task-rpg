// Datei: src/pages/ArenaPage.jsx
// Arena-Duell 1v1: Artefakt als Einsatz, Stats + Items entscheiden den Kampf.
import { useState, useMemo } from 'react'
import { useAdventure } from '../context/AdventureContext'
import { useGame } from '../context/GameContext'
import { useCharacter } from '../hooks/useCharacter'
import { Swords, Trophy, Shield, Zap, Heart, ChevronRight } from 'lucide-react'
import { rarityInfo, getArtifact, MAX_PROTECTED_ARTIFACTS, ARENA_CONSOLATION_XP } from '../utils/adventure'

// Da echte Gegner-Stats nicht synchron vorliegen, erzeugen wir plausible
// Gegnerwerte deterministisch aus dem Namen (Demo-PvP).
function deriveOpponent(name, seedBoost = 0) {
  let h = seedBoost
  for (let i = 0; i < (name || 'Gegner').length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973
  const staerke = 3 + (h % 8)
  const ausdauer = 3 + ((h >> 3) % 8)
  // gelegentlich setzt der Gegner ein Artefakt als Beute ein
  const pool = ['kr_schwert', 'r_amulett', 'e_kelch', 'nl_mantel', 'c_kristall', 'r_ring']
  const stakeArtifactId = h % 2 === 0 ? pool[h % pool.length] : null
  const equippedArtifactIds = stakeArtifactId ? [stakeArtifactId] : []
  return { name, stats: { staerke, ausdauer }, stakeArtifactId, equippedArtifactIds }
}

export default function ArenaPage() {
  const { characterArtifacts, arena, fightArena, toggleProtect, protectedCount, equippedItems } = useAdventure()
  const { friends } = useGame()
  const { character } = useCharacter()

  const [opponentName, setOpponentName] = useState('')
  const [stakeUid, setStakeUid] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  // Einsetzbare Artefakte = nicht geschützt
  const stakeable = useMemo(() => characterArtifacts.filter((c) => !c.is_protected), [characterArtifacts])

  const opponents = useMemo(() => {
    const list = (friends || []).map((f, i) => deriveOpponent(f.username || 'Held', i + 1))
    // Falls keine Freunde: Trainings-Gegner
    if (list.length === 0) {
      return [deriveOpponent('Trainingspuppe', 1), deriveOpponent('Schatten-Rivale', 7), deriveOpponent('Arena-Champion', 13)]
    }
    return list
  }, [friends])

  const handleFight = async () => {
    if (!opponentName) return
    setBusy(true); setResult(null)
    const base = opponents.find((o) => o.name === opponentName) || deriveOpponent(opponentName)
    const opponent = { ...base, stakeArtifactUid: stakeUid || null }
    const res = await fightArena(opponent)
    setResult(res)
    setStakeUid('')
    setBusy(false)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Swords className="w-6 h-6" />Arena</h1>
        <div className="text-right text-sm">
          <p className="text-gold-400 font-title">{arena.wins} Siege</p>
          <p className="text-gray-500 text-xs">{arena.losses} Niederlagen</p>
        </div>
      </div>

      <div className="card text-sm text-gray-400">
        <p>Wähle einen Gegner und optional ein Artefakt als <b className="text-gray-200">Einsatz</b>. Der Kampf läuft rundenbasiert: <b>Stärke</b> bestimmt den Schaden, <b>Ausdauer</b> dein Leben. Ausgerüstete Artefakte verstärken dich.</p>
        <p className="mt-1 text-xs text-gray-500">Sieg = du gewinnst den Einsatz des Gegners. Niederlage = du verlierst deinen Einsatz, bekommst aber {ARENA_CONSOLATION_XP} Trost-XP. Arena-Siege zählen zur Wochenwertung.</p>
      </div>

      {/* Gegner wählen */}
      <div className="card">
        <h3 className="font-title text-gray-200 mb-3">Gegner</h3>
        <div className="space-y-2">
          {opponents.map((o) => (
            <button key={o.name} onClick={() => setOpponentName(o.name)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left ${opponentName === o.name ? 'border-gold-500 bg-gold-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
              <span className="text-2xl">🧑‍🤝‍🧑</span>
              <div className="flex-1">
                <p className="text-gray-200 font-semibold">{o.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><Zap className="w-3 h-3 text-red-400" />{o.stats.staerke}</span>
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-green-400" />{o.stats.ausdauer}</span>
                  {o.stakeArtifactId && <span className="text-gold-500">Einsatz: {getArtifact(o.stakeArtifactId)?.icon} {getArtifact(o.stakeArtifactId)?.name}</span>}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          ))}
        </div>
      </div>

      {/* Eigener Einsatz */}
      <div className="card">
        <h3 className="font-title text-gray-200 mb-1">Dein Einsatz (optional)</h3>
        <p className="text-xs text-gray-500 mb-3">Geschützte Artefakte ({protectedCount}/{MAX_PROTECTED_ARTIFACTS}) können nicht gesetzt werden.</p>
        <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
          <button onClick={() => setStakeUid('')} className={`p-2 rounded-lg border text-sm text-left ${!stakeUid ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-gray-700 text-gray-400'}`}>Kein Einsatz (nur Ruhm)</button>
          {stakeable.map((ca) => {
            const r = rarityInfo(ca.artifacts.rarity)
            return (
              <button key={ca.id} onClick={() => setStakeUid(ca.id)}
                className={`p-2 rounded-lg border text-sm text-left flex items-center gap-2 ${stakeUid === ca.id ? 'border-gold-500 bg-gold-500/10' : 'border-gray-700'}`}>
                <span className="text-xl">{ca.artifacts.icon}</span>
                <span className={`flex-1 ${r.text}`}>{ca.artifacts.name}</span>
                <span className={`badge ${r.bg} ${r.text} border ${r.border}`}>{r.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={handleFight} disabled={!opponentName || busy} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
        <Swords className="w-5 h-5" /> {busy ? 'Kämpfe...' : 'Duell starten!'}
      </button>

      {/* Ergebnis */}
      {result && (
        <div className={`card ${result.iWon ? 'border-green-700/40' : 'border-red-800/40'} animate-slide-up`}>
          <div className="text-center mb-3">
            <Trophy className={`w-10 h-10 mx-auto mb-1 ${result.iWon ? 'text-gold-400' : 'text-gray-600'}`} />
            <h3 className={`font-title text-xl ${result.iWon ? 'text-green-400' : 'text-red-400'}`}>{result.iWon ? 'Sieg!' : 'Niederlage'}</h3>
            {result.iWon && result.rewardArtifact && <p className="text-sm text-gold-300 mt-1">Beute: {result.rewardArtifact.icon} {result.rewardArtifact.name}</p>}
            {!result.iWon && <p className="text-sm text-gray-400 mt-1">+{result.consolationXp} Trost-XP</p>}
          </div>
          <div className="bg-dark-400/50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-0.5">
            {result.log.map((l, i) => (
              <p key={i} className="text-xs text-gray-400">R{l.round}: <b className="text-gray-300">{l.attacker}</b> → {l.dmg} Schaden ({l.defender}: {l.defHp} HP)</p>
            ))}
          </div>
        </div>
      )}

      {/* Schutz-Verwaltung */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3"><Shield className="w-5 h-5 text-gold-500" /><h3 className="font-title text-gray-200">Artefakt-Schutz ({protectedCount}/{MAX_PROTECTED_ARTIFACTS})</h3></div>
        <p className="text-xs text-gray-500 mb-3">Geschützte Artefakte können nicht als Einsatz verwettet werden.</p>
        <div className="space-y-2">
          {characterArtifacts.length === 0 ? <p className="text-sm text-gray-500">Noch keine Artefakte.</p> :
            characterArtifacts.map((ca) => (
              <div key={ca.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{ca.artifacts.icon}</span>
                <span className={`flex-1 ${rarityInfo(ca.artifacts.rarity).text}`}>{ca.artifacts.name}</span>
                <button onClick={() => toggleProtect(ca.id)}
                  className={`text-xs px-2 py-1 rounded border ${ca.is_protected ? 'border-gold-500 text-gold-400' : 'border-gray-700 text-gray-400'}`}>
                  {ca.is_protected ? '🔒 Geschützt' : 'Schützen'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}