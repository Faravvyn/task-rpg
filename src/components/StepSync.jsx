// =====================================================================
// StepSync – Fitness-Provider & Schritte (Daily/Weekly/Monthly Toggle)
// =====================================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAdventure } from '../context/AdventureContext'
import {
  getConnectedProviders, getProvider,
  fetchStepsFromAllProviders, ManualProvider, ALL_PROVIDERS,
} from '../utils/fitnessProviders'
import {
  Footprints, Link2, Link2Off, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, ChevronDown, ChevronUp, Pencil,
  CalendarDays, Calendar, Clock, Gift,
} from 'lucide-react'

const TIME_RANGES = [
  { id: 'daily',   label: 'Heute',     icon: Clock,         key: 'daily_steps',   goal: 10000 },
  { id: 'weekly',  label: 'Woche',     icon: CalendarDays,  key: 'weekly_steps',  goal: 80000 },
  { id: 'monthly', label: 'Monat',     icon: Calendar,      key: 'monthly_steps', goal: 300000 },
]

const WEEKLY_TIERS = [
  { min: 80000, rarity: 'legendary', icon: '🌟', label: 'Legendär' },
  { min: 60000, rarity: 'epic',      icon: '💎', label: 'Episch' },
  { min: 50000, rarity: 'rare',      icon: '🔷', label: 'Selten' },
  { min: 25000, rarity: 'common',    icon: '⚪', label: 'Gewöhnlich' },
]

export default function StepSync() {
  const { character } = useAuth()
  const { syncSteps, claimStepReward } = useAdventure()
  const [expanded, setExpanded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('')
  const [connecting, setConnecting] = useState(null)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [timeRange, setTimeRange] = useState('weekly')
  const [connectedProviders, setConnectedProviders] = useState([])
  const [availableProviders, setAvailableProviders] = useState([])

  useEffect(() => {
    setAvailableProviders(ALL_PROVIDERS.filter(p => p.id !== 'manual' && p.id !== 'apple_health'))
    setConnectedProviders(getConnectedProviders())
  }, [])

  const showStatus = (msg, type) => {
    setStatusMsg(msg)
    setStatusType(type)
    setTimeout(() => setStatusMsg(''), 5000)
  }

  // ---- Verbinden / Trennen ----
  const handleConnect = async (providerId) => {
    const provider = getProvider(providerId)
    if (!provider) return
    if (providerId === 'manual') { setShowManualInput(true); return }
    setConnecting(providerId)
    try {
      await provider.connect()
      setConnectedProviders(getConnectedProviders())
      showStatus(`✅ Mit ${provider.name} verbunden!`, 'success')
    } catch (e) { showStatus(`❌ ${e.message}`, 'error') }
    setConnecting(null)
  }

  const handleDisconnect = (providerId) => {
    const provider = getProvider(providerId)
    if (!provider) return
    provider.disconnect()
    setConnectedProviders(getConnectedProviders())
  }

  // ---- Synchronisieren ----
  const handleSync = async () => {
    if (!character) return
    setSyncing(true)
    setStatusMsg('⏳ Rufe Schrittdaten ab...')
    setStatusType('success')

    try {
      const tokens = localStorage.getItem('taskrpg_fitness_google_fit')
      const hasToken = !!tokens

      const today = new Date()
      const lastWeek = new Date(today)
      lastWeek.setHours(0, 0, 0, 0)
      lastWeek.setDate(lastWeek.getDate() - 6)

      const stepsData = await fetchStepsFromAllProviders(lastWeek, today)

      if (!stepsData || stepsData.length === 0) {
        showStatus(
          `📱 Google Fit verbunden ${hasToken ? '✅' : '❌'} – aber keine Schrittdaten.\n\n` +
          '👉 Auf Android-Handy: Google Fit App öffnen → Schritte prüfen → TaskRPG öffnen → Syncen',
          'error'
        )
        setSyncing(false)
        return
      }

      const todayStr = today.toISOString().split('T')[0]
      const todayEntry = stepsData.find(d => d.date === todayStr)
      const todaySteps = todayEntry?.steps || 0
      const alreadySynced = character.daily_steps || 0
      const newSteps = Math.max(0, todaySteps - alreadySynced)

      if (newSteps > 0) {
        await syncSteps(newSteps)
        showStatus(`✅ ${newSteps.toLocaleString()} neue Schritte!`, 'success')
      } else if (todaySteps > 0) {
        showStatus(`✅ ${todaySteps.toLocaleString()} Schritte heute – aktuell!`, 'success')
      } else {
        showStatus('Heute noch keine Schritte – lauf ein bisschen! 🚶', 'error')
      }
    } catch (e) {
      showStatus(`❌ ${e.message}`, 'error')
    }
    setSyncing(false)
  }

  // ---- Manuelle Eingabe ----
  const handleManualSubmit = () => {
    const steps = parseInt(manualInput)
    if (isNaN(steps) || steps < 0) { showStatus('Bitte eine gültige Schrittzahl eingeben.', 'error'); return }
    ManualProvider.setTodaySteps(steps)
    setShowManualInput(false)
    setManualInput('')
    setTimeout(() => handleSync(), 300)
  }

  // ---- Belohnung abholen ----
  const handleClaimReward = async () => {
    setClaiming(true)
    try {
      const art = await claimStepReward()
      if (art) showStatus(`🎁 ${art.icon} ${art.name} erhalten!`, 'success')
      else showStatus('Noch nicht genug Schritte für eine Belohnung.', 'error')
    } catch (e) { showStatus(`❌ ${e.message}`, 'error') }
    setClaiming(false)
  }

  // ---- OAuth-Callback ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      import('../utils/fitnessProviders').then(({ handleOAuthCallback }) => {
        handleOAuthCallback(params)
          .then(provider => {
            setConnectedProviders(getConnectedProviders())
            showStatus(`✅ Mit ${provider.name} verbunden!`, 'success')
            window.history.replaceState({}, '', window.location.pathname)
          })
          .catch(e => {
            showStatus(`❌ ${e.message}`, 'error')
            window.history.replaceState({}, '', window.location.pathname)
          })
      })
    }
  }, [])

  // ---- Berechnungen ----
  const currentRange = TIME_RANGES.find(r => r.id === timeRange)
  const currentSteps = character?.[currentRange.key] || 0
  const currentGoal = currentRange.goal
  const currentPercent = Math.min(100, (currentSteps / currentGoal) * 100)

  const weeklySteps = character?.weekly_steps || 0
  const rewardClaimed = character?.steps_reward_claimed
  const currentTier = WEEKLY_TIERS.find(t => weeklySteps >= t.min)
  const rewardAvailable = !!currentTier && !rewardClaimed

  // ---- Mobile: kompakter Header ----
  const stepsLabel = currentSteps.toLocaleString()
  const goalLabel = currentGoal.toLocaleString()

  return (
    <div className="card border-blue-500/30 bg-blue-500/5">
      {/* === HEADER === */}
      <div className="flex items-center justify-between" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 cursor-pointer">
          <Footprints className="w-5 h-5 text-blue-400" />
          <h3 className="font-title text-sm text-gray-200">Fitness & Schritte</h3>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleSync() }}
          disabled={syncing}
          className="btn-secondary text-[10px] py-1 px-3 flex items-center gap-1"
        >
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Sync
        </button>
      </div>

      {/* === TOGGLE: Daily / Weekly / Monthly === */}
      <div className="flex gap-1 mt-3 mb-2">
        {TIME_RANGES.map(tr => (
          <button
            key={tr.id}
            onClick={() => setTimeRange(tr.id)}
            className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
              timeRange === tr.id
                ? 'border-blue-500 bg-blue-500/15 text-blue-300 font-bold'
                : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            <tr.icon className="w-3 h-3" /> {tr.label}
          </button>
        ))}
      </div>

      {/* === PROGRESS BAR === */}
      <div>
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-title text-blue-400 font-bold">{stepsLabel}</span>
          <span className="text-xs text-gray-500">/ {goalLabel}</span>
        </div>

        <div className="stat-bar h-2 mb-2">
          <div
            className={`stat-bar-fill transition-all duration-700 ${
              currentPercent >= 100 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-blue-500'
            }`}
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        {/* === REWARD TIERS (nur bei Weekly sichtbar) === */}
        {timeRange === 'weekly' && (
          <div className="mb-3">
            <div className="flex gap-1">
              {[...WEEKLY_TIERS].reverse().map((t, i) => {
                const reached = weeklySteps >= t.min
                return (
                  <div
                    key={t.min}
                    className={`flex-1 text-center py-1 rounded-md border text-[9px] transition-all ${
                      reached
                        ? currentTier?.min === t.min
                          ? 'border-gold-500 bg-gold-500/15 text-gold-300'
                          : 'border-gray-600 bg-gray-700/20 text-gray-400 line-through'
                        : 'border-gray-800 bg-dark-400/30 text-gray-600'
                    }`}
                    title={`${t.label}: ${t.min.toLocaleString()} Schritte`}
                  >
                    {t.icon}
                  </div>
                )
              })}
            </div>

            {/* Reward button */}
            <div className="mt-2">
              {rewardAvailable ? (
                <button
                  onClick={handleClaimReward}
                  disabled={claiming}
                  className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2 animate-pulse-gold"
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Gift className="w-4 h-4" />
                  )}
                  🎁 {currentTier.icon} {currentTier.label}es Artefakt abholen!
                </button>
              ) : rewardClaimed ? (
                <div className="text-center text-[10px] text-green-500 flex items-center justify-center gap-1 py-1">
                  <CheckCircle2 className="w-3 h-3" /> Belohnung diese Woche abgeholt
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 text-center">
                  {weeklySteps < 25000
                    ? `Noch ${(25000 - weeklySteps).toLocaleString()} Schritte bis zur ersten Belohnung`
                    : currentTier
                      ? `${currentTier.label} erreicht! Noch bis Montag Zeit zum Abholen.`
                      : 'Weiter so!'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* === EXPANDED: Provider-Liste === */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-3 animate-slide-up">
          {statusMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg border whitespace-pre-line ${
              statusType === 'success'
                ? 'bg-green-900/30 border-green-800 text-green-300'
                : 'bg-red-900/30 border-red-800 text-red-300'
            }`}>
              {statusMsg}
            </div>
          )}

          {/* Verbundene Provider */}
          {connectedProviders.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-dark-400/60 rounded-lg p-2 border border-gray-700">
              <span className="text-xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-semibold">{p.name}</p>
                <p className="text-[10px] text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verbunden
                </p>
              </div>
              <button onClick={() => handleDisconnect(p.id)} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                <Link2Off className="w-3 h-3" /> Trennen
              </button>
            </div>
          ))}

          {connectedProviders.length === 0 && (
            <div className="text-center py-3">
              <p className="text-sm text-gray-300 font-semibold mb-2">📱 Fitness-Tracker verbinden</p>
              <p className="text-xs text-gray-500 mb-3">Wähle einen Anbieter oder trag deine Schritte manuell ein:</p>
            </div>
          )}

          {/* Verfügbare Provider */}
          {availableProviders
            .filter(p => !connectedProviders.find(c => c.id === p.id))
            .map(p => {
              const needsSetup = !p.isAvailable()
              return (
                <div key={p.id} className={`flex items-center gap-3 rounded-lg p-2 border ${needsSetup ? 'bg-dark-400/20 border-gray-700/30' : 'bg-dark-400/40 border-gray-700/50'}`}>
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">{p.name}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{needsSetup ? '🔧 API-Key in .env nötig' : p.description}</p>
                  </div>
                  <button
                    onClick={() => handleConnect(p.id)}
                    disabled={connecting === p.id || needsSetup}
                    className={`text-[10px] px-2 py-1 rounded-lg border flex items-center gap-1 ${
                      needsSetup
                        ? 'bg-gray-700/30 text-gray-500 border-gray-700 cursor-not-allowed'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                    }`}
                  >
                    {connecting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                    {needsSetup ? 'Setup nötig' : 'Verbinden'}
                  </button>
                </div>
              )
            })}

          {/* Manuelle Eingabe */}
          <div className="border-t border-gray-700/50 pt-2">
            {showManualInput ? (
              <div className="flex gap-2">
                <input type="number" value={manualInput} onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Schritte heute..." className="input-field flex-1 text-sm" autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()} />
                <button onClick={handleManualSubmit} className="btn-primary text-xs py-2 px-3">Speichern</button>
                <button onClick={() => setShowManualInput(false)} className="text-gray-500 text-xs">Abbrechen</button>
              </div>
            ) : (
              <button onClick={() => setShowManualInput(true)}
                className="w-full text-[10px] text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 py-1">
                <Pencil className="w-3 h-3" /> Schritte manuell eintragen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
