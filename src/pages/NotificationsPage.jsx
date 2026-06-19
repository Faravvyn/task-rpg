// Datei: src/pages/NotificationsPage.jsx
// Vollständige Benachrichtigungsliste + Push-Schnelleinstellung.
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { Bell, Check, Settings, BellRing } from 'lucide-react'
import EmptyState from '../components/EmptyState'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `vor ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `vor ${h} h`
  return `vor ${Math.floor(h / 24)} d`
}

export default function NotificationsPage() {
  const { notifications, unreadCount, readIds, markAsRead, markAllAsRead, settings, enablePush, pushSupported, permission } = useNotifications()
  const navigate = useNavigate()

  const handleClick = (n) => { markAsRead(n.id); if (n.link) navigate(n.link) }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Bell className="w-6 h-6" />Nachrichten</h1>
        {unreadCount > 0 && <button onClick={markAllAsRead} className="btn-secondary text-xs flex items-center gap-1"><Check className="w-3 h-3" />Alle gelesen</button>}
      </div>

      {/* Push-Hinweis */}
      {pushSupported && !(settings.pushEnabled && permission === 'granted') && (
        <div className="card border-gold-500/30 bg-gold-500/5 flex items-center gap-3">
          <BellRing className="w-6 h-6 text-gold-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-200 font-semibold">Push-Benachrichtigungen aktivieren</p>
            <p className="text-xs text-gray-400">Erhalte sofort Bescheid bei Freundschaftsanfragen & Freundes-Quests.</p>
          </div>
          {permission === 'denied'
            ? <span className="text-xs text-red-400">Im Browser blockiert</span>
            : <button onClick={enablePush} className="btn-primary text-xs py-1.5 px-3">Aktivieren</button>}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={() => navigate('/settings')} className="text-xs text-gray-500 hover:text-gold-400 flex items-center gap-1"><Settings className="w-3 h-3" />Einstellungen</button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState emoji="📭" title="Alles ruhig" subtitle="Keine Benachrichtigungen. Wir sagen Bescheid, wenn etwas passiert!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const unread = !readIds.has(n.id)
            return (
              <button key={n.id} onClick={() => handleClick(n)}
                className={`card w-full text-left flex gap-3 items-start hover:border-gold-700/30 ${unread ? 'border-gold-500/30 bg-gold-500/5' : ''}`}>
                <span className="text-2xl flex-shrink-0">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`${unread ? 'text-gray-100 font-semibold' : 'text-gray-300'}`}>{n.title}</p>
                  <p className="text-sm text-gray-500">{n.body}</p>
                  <p className="text-xs text-gray-600 mt-1">{timeAgo(n.at)}</p>
                </div>
                {unread && <span className="w-2.5 h-2.5 rounded-full bg-gold-500 flex-shrink-0 mt-1.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}