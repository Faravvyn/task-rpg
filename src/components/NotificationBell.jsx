// Benachrichtigungs-Glocke mit Dropdown & Ungelesen-Badge.
import { useState, useRef, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `vor ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `vor ${h} h`
  return `vor ${Math.floor(h / 24)} d`
}

export default function NotificationBell() {
  const { notifications, unreadCount, readIds, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleClick = (n) => { markAsRead(n.id); setOpen(false); if (n.link) navigate(n.link) }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-2 text-gray-400 hover:text-gold-400 relative" aria-label="Benachrichtigungen">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-dark-600 text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-dark-300 border border-gray-700 rounded-xl shadow-2xl z-50 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="font-title text-gold-400 text-sm">Benachrichtigungen</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-gray-400 hover:text-gold-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Alle gelesen
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">Keine Benachrichtigungen</div>
            ) : (
              notifications.slice(0, 15).map((n) => {
                const unread = !readIds.has(n.id)
                return (
                  <button key={n.id} onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-800 hover:bg-dark-200 transition-colors flex gap-3 ${unread ? 'bg-gold-500/5' : ''}`}>
                    <span className="text-xl flex-shrink-0">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${unread ? 'text-gray-100 font-semibold' : 'text-gray-300'}`}>{n.title}</p>
                      <p className="text-xs text-gray-500 truncate">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(n.at)}</p>
                    </div>
                    {unread && <span className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-1.5" />}
                  </button>
                )
              })
            )}
          </div>
          <button onClick={() => { setOpen(false); navigate('/notifications') }} className="w-full text-center text-xs text-gold-500 py-2.5 hover:bg-dark-200 border-t border-gray-700">
            Alle anzeigen
          </button>
        </div>
      )}
    </div>
  )
}
