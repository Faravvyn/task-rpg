import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, ArrowLeft } from 'lucide-react'
export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode==='login') {
        const { error: err } = await signIn(email, password)
        if (err) setError(err.message==='Invalid login credentials'?'Ungültige Anmeldedaten':err.message)
      } else if (mode==='register') {
        if (password.length < 6) { setError('Passwort mind. 6 Zeichen'); setLoading(false); return }
        const { error: err } = await signUp(email, password, username)
        if (err) setError(err.message); else setSuccess('Registrierung erfolgreich! Bitte bestätige deine E-Mail.')
      } else if (mode==='reset') {
        const { error: err } = await resetPassword(email)
        if (err) setError(err.message); else setSuccess('E-Mail zum Zurücksetzen gesendet!')
      }
    } catch (err) { setError('Fehler: ' + (err.message||'Unbekannt')) }
    setLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-dark-500">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><div className="text-6xl mb-4">⚔️</div><h1 className="font-title text-4xl text-gold-400 mb-2">TaskRPG</h1><p className="text-gray-400">Queste dein Leben</p></div>
        <div className="glass-card p-6">
          <div className="flex gap-2 mb-6">
            <button onClick={()=>{setMode('login');setError('');setSuccess('')}} className={`tab-btn flex-1 ${mode==='login'?'active':''}`}>Anmelden</button>
            <button onClick={()=>{setMode('register');setError('');setSuccess('')}} className={`tab-btn flex-1 ${mode==='register'?'active':''}`}>Registrieren</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode==='register'&&<div><label className="block text-sm text-gray-400 mb-1">Benutzername</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/><input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Dein Heldenname" className="input-field pl-10" required/></div></div>}
            <div><label className="block text-sm text-gray-400 mb-1">E-Mail</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="input-field pl-10" required/></div></div>
            {mode!=='reset'&&<div><label className="block text-sm text-gray-400 mb-1">Passwort</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field pl-10" required minLength={6}/></div></div>}
            {error&&<div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-2 text-red-300 text-sm">{error}</div>}
            {success&&<div className="bg-green-900/30 border border-green-800/50 rounded-lg px-4 py-2 text-green-300 text-sm">{success}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg font-title">{loading?'⏳ Bitte warten...':(mode==='login'?'⚔️ Einloggen':mode==='register'?'🧙 Registrieren':'📧 Passwort zurücksetzen')}</button>
          </form>
          {mode==='login'&&<button onClick={()=>{setMode('reset');setError('');setSuccess('')}} className="w-full text-center text-sm text-gray-500 hover:text-gray-300 mt-4 py-2">Passwort vergessen?</button>}
          {mode==='reset'&&<button onClick={()=>{setMode('login');setError('');setSuccess('')}} className="w-full text-center text-sm text-gray-500 mt-4 py-2 flex items-center justify-center gap-1"><ArrowLeft className="w-3 h-3"/>Zurück</button>}
        </div>
      </div>
    </div>
  )
}