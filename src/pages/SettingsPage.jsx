// Datei: src/pages/SettingsPage.jsx
// Einstellungen: Profil, Passwort, Benachrichtigungen, Account löschen
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCharacter } from '../hooks/useCharacter'
import { avatars } from '../utils/xp'
import { Settings, User, Lock, Bell, BellRing, Download, Trash2, Save, Check, Swords } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { isSoundEnabled, setSoundEnabled, playLevelUp } from '../utils/sound'
import { isVibrationEnabled, setVibrationEnabled, vibrate } from '../utils/vibrate'

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${on ? 'bg-gold-500' : 'bg-dark-400'}`}>
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </div>
  )
}
function ToggleRow({ icon, label, on, onClick }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-300 flex items-center gap-2">{icon}{label}</span>
      <Toggle on={on} onClick={onClick} />
    </label>
  )
}

export default function SettingsPage() {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth()
  const { character } = useCharacter()
  const { settings: notifSettings, updateSettings: updateNotif, enablePush, disablePush, pushSupported, permission } = useNotifications()
  const [soundOn, setSoundOn] = useState(isSoundEnabled())
  const [vibrateOn, setVibrationOn] = useState(isVibrationEnabled())
  const [username, setUsername] = useState(profile?.username || '')
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar_url || '🧙‍♂️')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdateProfile = async () => {
    setLoading(true)
    const { error } = await updateProfile({
      username: username.trim(),
      avatar_url: selectedAvatar
    })
    setMessage(error ? 'Fehler beim Speichern' : 'Profil aktualisiert! ✅')
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setMessage('Passwort muss mindestens 6 Zeichen haben')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein')
      return
    }
    setLoading(true)
    const { error } = await updatePassword(newPassword)
    setMessage(error ? error.message : 'Passwort geändert! ✅')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleExportData = () => {
    const data = {
      profile,
      character,
      exported_at: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskrpg-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Bist du sicher? Alle Daten werden unwiderruflich gelöscht!')) {
      if (window.confirm('Letzte Warnung: Wirklich alles löschen?')) {
        // In einer echten App: Supabase RPC zum Löschen aller Nutzerdaten aufrufen
        await signOut()
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Einstellungen
      </h1>

      {/* Nachricht */}
      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          message.includes('✅')
            ? 'bg-green-900/30 text-green-300 border border-green-800/50'
            : 'bg-red-900/30 text-red-300 border border-red-800/50'
        }`}>
          {message}
        </div>
      )}

      {/* Profil */}
      <div className="card">
        <h2 className="font-title text-lg text-gray-200 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-gold-500" />
          Profil
        </h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Avatar</label>
            <div className="flex gap-2 flex-wrap">
              {avatars.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl transition-all
                    ${selectedAvatar === avatar
                      ? 'border-gold-500 bg-gold-500/10'
                      : 'border-gray-700 hover:border-gray-500'
                    }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Benutzername */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              maxLength={30}
            />
          </div>

          {/* E-Mail (nur lesbar) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">E-Mail</label>
            <input
              type="email"
              value={user?.email || ''}
              className="input-field opacity-60"
              readOnly
            />
          </div>

          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Profil speichern
          </button>
        </div>
      </div>

      {/* Passwort */}
      <div className="card">
        <h2 className="font-title text-lg text-gray-200 flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gold-500" />
          Passwort ändern
        </h2>
        <div className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Neues Passwort"
            className="input-field"
            minLength={6}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Passwort bestätigen"
            className="input-field"
            minLength={6}
          />
          <button
            onClick={handlePasswordChange}
            disabled={loading || !newPassword}
            className="btn-primary flex items-center gap-2"
          >
            <Lock className="w-4 h-4" /> Passwort ändern
          </button>
        </div>
      </div>

      {/* Benachrichtigungen */}
      <div className="card">
        <h2 className="font-title text-lg text-gray-200 flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gold-500" />
          Benachrichtigungen
        </h2>

        {/* Push-Master */}
        <div className="rounded-lg border border-gray-700 p-3 mb-4 bg-dark-400/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gray-200 font-semibold">Push-Benachrichtigungen</span>
            </div>
            {!pushSupported ? (
              <span className="text-xs text-gray-500">Nicht unterstützt</span>
            ) : permission === 'denied' ? (
              <span className="text-xs text-red-400">Im Browser blockiert</span>
            ) : (
              <Toggle on={notifSettings.pushEnabled && permission === 'granted'} onClick={async () => {
                if (notifSettings.pushEnabled) disablePush()
                else await enablePush()
              }} />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Erhalte Browser-Hinweise, auch wenn der Tab im Hintergrund ist.</p>
          {permission === 'denied' && <p className="text-xs text-gray-500 mt-1">Erlaube Benachrichtigungen in den Browser-Einstellungen für diese Seite.</p>}
        </div>

        {/* Auslöser */}
        <div className="space-y-3">
          <ToggleRow icon={<User className="w-4 h-4 text-blue-400" />} label="Freundschaftsanfragen"
            on={notifSettings.friendRequests} onClick={() => updateNotif({ friendRequests: !notifSettings.friendRequests })} />
          <ToggleRow icon={<Swords className="w-4 h-4 text-gold-400" />} label="Freundes-Quests"
            on={notifSettings.friendQuests} onClick={() => updateNotif({ friendQuests: !notifSettings.friendQuests })} />
          <ToggleRow label="Tägliche Erinnerung (09:00)"
            on={notifSettings.dailyReminder} onClick={() => updateNotif({ dailyReminder: !notifSettings.dailyReminder })} />
          <ToggleRow label="Streak-Warnung (20:00)"
            on={notifSettings.streakWarning} onClick={() => updateNotif({ streakWarning: !notifSettings.streakWarning })} />
          <ToggleRow label="🔊 Sound-Effekte"
            on={soundOn} onClick={() => { const v = !soundOn; setSoundOn(v); setSoundEnabled(v); if (v) playLevelUp() }} />
          <ToggleRow label="📳 Vibration (Android)"
            on={vibrateOn} onClick={() => { const v = !vibrateOn; setVibrationOn(v); setVibrationEnabled(v); if (v) vibrate(50) }} />
        </div>
      </div>

      {/* Daten-Export */}
      <div className="card">
        <h2 className="font-title text-lg text-gray-200 flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-gold-500" />
          Daten exportieren
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Lade deine Daten als JSON-Datei herunter.
        </p>
        <button onClick={handleExportData} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportieren (JSON)
        </button>
      </div>

      {/* Account löschen */}
      <div className="card border-red-800/30">
        <h2 className="font-title text-lg text-red-400 flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5" />
          Gefahrenzone
        </h2>
        <p className="text-sm text-gray-400 mb-3">
          Account unwiderruflich löschen. Alle Daten gehen verloren!
        </p>
        <button onClick={handleDeleteAccount} className="btn-danger flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Account löschen
        </button>
      </div>
    </div>
  )
}
