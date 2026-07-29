import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getProvider } from '../utils/fitnessProviders'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function GoogleFitCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('connecting')
  const [errorMsg, setErrorMsg] = useState('')
  const exchangedRef = useRef(false)

  useEffect(() => {
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      setStatus('error')
      setErrorMsg(`Google hat die Autorisierung verweigert: ${error}`)
      return
    }

    if (!code) {
      setStatus('error')
      setErrorMsg('Kein Auth-Code von Google erhalten.')
      return
    }

    if (exchangedRef.current) return
    exchangedRef.current = true

    // Nutzt den Provider-internen Exchange – speichert sowohl in
    // Supabase (cross-device) als auch in localStorage (taskrpg_fitness_google_fit)
    // → isConnected() in StepSync/FitnessProvider erkennt die Verbindung sofort
    const provider = getProvider('google_fit')
    if (!provider || !provider._exchangeCode) {
      setStatus('error')
      setErrorMsg('Provider nicht gefunden.')
      return
    }

    provider._exchangeCode(code)
      .then(() => {
        setStatus('success')
        setTimeout(() => navigate('/dashboard'), 1500)
      })
      .catch(e => {
        console.error('Google Fit Callback Error:', e)
        setStatus('error')
        setErrorMsg(e.message)
      })
  }, [params, navigate])

  return (
    <div className="min-h-screen bg-dark-500 flex items-center justify-center p-6">
      <div className="card max-w-md text-center space-y-4">
        {status === 'connecting' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin" />
            <h2 className="font-title text-xl text-gray-200">Verbinde mit Google Fit…</h2>
            <p className="text-sm text-gray-400">Token-Austausch läuft – einen Moment bitte.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h2 className="font-title text-xl text-green-300">Erfolgreich verbunden!</h2>
            <p className="text-sm text-gray-400">Deine Schritte werden jetzt synchronisiert. Weiterleitung…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="font-title text-xl text-red-300">Verbindung fehlgeschlagen</h2>
            <p className="text-sm text-gray-400">{errorMsg}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Zurück zum Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
