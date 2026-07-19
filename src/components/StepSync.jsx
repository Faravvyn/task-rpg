// =====================================================================
// StepSync – Fitness-Provider-Verwaltung & Schritte-Synchronisation
// =====================================================================
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAdventure } from '../context/AdventureContext'
import {
  getAvailableProviders, getConnectedProviders, getProvider,
  fetchStepsFromAllProviders, ManualProvider,
} from '../utils/fitnessProviders'
import {
  Footprints, Link2, Link2Off, RefreshCw, CheckCircle2,
  AlertCircle, Loader2, ChevronDown, ChevronUp, Pencil, Plus,
} from 'lucide-react'

export default function StepSync() {
  const { character } = useAuth()
  const { syncSteps, claimStepReward } = useAdventure()
  const [expanded, setExpanded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState('') // 'success' | 'error'
  const [connecting, setConnecting] = useState(null) // providerId
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const [connectedProviders, setConnectedProviders] = useState([])
  const [availableProviders, setAvailableProviders] = useState([])

  useEffect(() => {
    setConnectedProviders(getConnectedProviders())
    setAvailableProviders(getAvailableProviders().filter(p => p.id !== 'manual'))
  }, [])

  const showStatus = (msg, type) => {
    setStatusMsg(msg)
    setStatusType(type)
    setTimeout(() => setStatusMsg(''), 5000)
  }

  // ---- Verbinden ----
  const handleConnect = async (providerId) => {
    const provider = getProvider(providerId)
    if (!provider) return

    if (providerId === 'manual') {
      setShowManualInput(true)
      return
    }

    setConnecting(providerId)
    try {
      await provider.connect()
      setConnectedProviders(getConnectedProviders())
      showStatus(`✅ Mit ${provider.name} verbunden!`, 'success')
    } catch (e) {
      showStatus(`❌ ${e.message}`, 'error')
    }
    setConnecting(null)
  }

  // ---- Trennen ----
  const handleDisconnect = (providerId) => {
    const provider = getProvider(providerId)
    if (!provider) return
    provider.disconnect()
    setConnectedProviders(getConnectedProviders())
    showStatus(`${provider.name} getrennt.`, 'success')
  }

  // ---- Synchronisieren ----
  const handleSync = async () => {
    if (!character) return
    setSyncing(true)
    setStatusMsg('')

    try {
      const today = new Date()
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      const stepsData = await fetchStepsFromAllProviders(lastWeek, today)

      if (stepsData.length === 0) {
        showStatus('Keine Schrittdaten gefunden. Warst du heute schon aktiv?', 'error')
        setSyncing(false)
        return
      }

      // Nur heutige Schritte zum Sync
      const todayStr = today.toISOString().split('T')[0]
      const todayEntry = stepsData.find(d => d.date === todayStr)
      const todaySteps = todayEntry?.steps || 0

      // Neue Schritte = heutige Schritte - bereits synchronisierte
      const alreadySynced = character.daily_steps || 0
      const newSteps = Math.max(0, todaySteps - alreadySynced)

      if (newSteps > 0) {
        await syncSteps(newSteps)
        showStatus(`✅ ${newSteps.toLocaleString()} neue Schritte synchronisiert!`, 'success')
      } else if (todaySteps > 0) {
        showStatus('✅ Keine neuen Schritte – alles aktuell!', 'success')
      } else {
        showStatus('Heute noch keine Schritte aufgezeichnet.', 'error')
      }
    } catch (e) {
      showStatus(`❌ Sync-Fehler: ${e.message}`, 'error')
    }
    setSyncing(false)
  }

  // ---- Manuelle Eingabe ----
  const handleManualSubmit = () => {
    const steps = parseInt(manualInput)
    if (isNaN(steps) || steps < 0) {
      showStatus('Bitte eine gültige Schrittzahl eingeben.', 'error')
      return
    }
    ManualProvider.setTodaySteps(steps)
    setShowManualInput(false)
    setManualInput('')
    showStatus(`✅ ${steps.toLocaleString()} Schritte manuell gespeichert!`, 'success')
  }

  // ---- OAuth-Callback beim Laden prüfen ----
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

  const weeklySteps = character?.weekly_steps || 0
  const weeklyGoal = 80000
  const weeklyPercent = Math.min(100, (weeklySteps / weeklyGoal) * 100)
  const rewardAvailable = weeklySteps >= 50000 && !character?.steps_reward_claimed
  const rewardClaimed = character?.steps_reward_claimed

  return (
    <div className="card border-blue-500/30 bg-blue-500/5">
      {/* Header */}
      <div className="flex items-center justify-between" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 cursor-pointer">
          <Footprints className="w-5 h-5 text-blue-400" />
          <h3 className="font-title text-sm text-gray-200">Fitness & Schritte</h3>
          <span className="text-[10px] text-gray-500">
            ({connectedProviders.length} verbunden)
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>

        {/* Quick-Sync Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleSync() }}
          disabled={syncing}
          className="btn-secondary text-[10px] py-1 px-3 flex items-center gap-1"
        >
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {syncing ? 'Sync...' : 'Jetzt syncen'}
        </button>
      </div>

      {/* Weekly Progress (always visible) */}
      <div className="mt-3">
        <div className="flex items-end justify-between mb-1">
          <span className="text-2xl font-title text-blue-400 font-bold">
            {weeklySteps.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">/ {weeklyGoal.toLocaleString()}</span>
        </div>

        <div className="stat-bar h-1.5 mb-2">
          <div
            className={`stat-bar-fill ${weeklyPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${weeklyPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          {rewardAvailable ? (
            <button onClick={claimStepReward} className="btn-primary text-[10px] py-1 px-3 flex items-center gap-1">
              🎁 Belohnung abholen
            </button>
          ) : rewardClaimed ? (
            <span className="text-[10px] text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Abgeholt
            </span>
          ) : (
            <p className="text-[10px] text-gray-500">
              {weeklySteps < 50000
                ? `Noch ${(50000 - weeklySteps).toLocaleString()} Schritte bis zur ersten Belohnung`
                : 'Weiter so!'}
            </p>
          )}
        </div>
      </div>

      {/* Expanded: Provider-Liste */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3 animate-slide-up">
          {/* Status-Nachricht */}
          {statusMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg border ${
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
              <button
                onClick={() => handleDisconnect(p.id)}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Link2Off className="w-3 h-3" /> Trennen
              </button>
            </div>
          ))}

          {/* Keine verbundenen Provider */}
          {connectedProviders.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">
              Noch kein Fitness-Tracker verbunden. Wähle einen Anbieter:
            </p>
          )}

          {/* Verfügbare Provider (nicht verbunden) */}
          {availableProviders
            .filter(p => !connectedProviders.find(c => c.id === p.id))
            .map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-dark-400/40 rounded-lg p-2 border border-gray-700/50">
                <span className="text-xl">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">{p.name}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{p.description}</p>
                </div>
                <button
                  onClick={() => handleConnect(p.id)}
                  disabled={connecting === p.id}
                  className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 flex items-center gap-1"
                >
                  {connecting === p.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Link2 className="w-3 h-3" />
                  )}
                  Verbinden
                </button>
              </div>
            ))}

          {/* Manuelle Eingabe */}
          <div className="border-t border-gray-700/50 pt-2">
            {showManualInput ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Schritte heute..."
                  className="input-field flex-1 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                />
                <button onClick={handleManualSubmit} className="btn-primary text-xs py-2 px-3">
                  Speichern
                </button>
                <button onClick={() => setShowManualInput(false)} className="text-gray-500 text-xs">
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full text-[10px] text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 py-1"
              >
                <Pencil className="w-3 h-3" /> Schritte manuell eintragen
              </button>
            )}
          </div>

          {/* Täglicher Sync-Hinweis */}
          <p className="text-[10px] text-gray-600 text-center">
            Automatischer Sync 1× pro Tag • Daten bleiben lokal bis zum Sync
          </p>
        </div>
      )}
    </div>
  )
}
