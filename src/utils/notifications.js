// =====================================================================
// Browser-Benachrichtigungen (Web Notifications API) + Einstellungen.
// Reine Helfer ohne React.
// =====================================================================

export const NOTIF_SETTINGS_KEY = 'taskrpg_notif_settings'

export const defaultNotifSettings = {
  pushEnabled: false,     // Master-Schalter (Browser-Benachrichtigungen)
  friendRequests: true,   // bei neuer Freundschaftsanfrage
  friendQuests: true,     // bei neuer/erledigter Freundes-Quest
  dailyReminder: true,    // tägliche Erinnerung (in-app)
  streakWarning: true,    // Streak-Warnung (in-app)
}

export function loadNotifSettings() {
  try {
    const raw = localStorage.getItem(NOTIF_SETTINGS_KEY)
    if (raw) return { ...defaultNotifSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...defaultNotifSettings }
}

export function saveNotifSettings(settings) {
  try { localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings)) } catch { /* ignore */ }
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getPermission() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// Fragt die Berechtigung an; gibt true zurück, wenn erlaubt.
export async function requestPushPermission() {
  if (!isPushSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch { return false }
}

// Zeigt eine Browser-Benachrichtigung (falls erlaubt & aktiviert).
export function showPushNotification(title, options = {}) {
  if (!isPushSupported() || Notification.permission !== 'granted') return null
  try {
    const n = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    })
    if (options.onClick) n.onclick = options.onClick
    return n
  } catch { return null }
}