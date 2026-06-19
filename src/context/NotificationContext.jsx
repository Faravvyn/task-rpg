// =====================================================================
// NotificationContext – aggregiert In-App-Benachrichtigungen und löst
// optional Browser-Push-Benachrichtigungen aus, wenn:
//   • eine neue Freundschaftsanfrage eingeht
//   • eine neue Freundes-Quest eingeht
//   • eine von dir gesendete Freundes-Quest erfüllt wurde
//
// Quellen: GameContext (friendRequests) + AdventureContext (friendTasks).
// =====================================================================
import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useGame } from '../hooks/useGame'
import { useAdventure } from './AdventureContext'
import { getQuestTemplate } from '../utils/quests'
import {
  loadNotifSettings, saveNotifSettings, requestPushPermission,
  showPushNotification, getPermission, isPushSupported,
} from '../utils/notifications'

const NotificationContext = createContext({})
const readKey = (uid) => `taskrpg_notif_read_${uid}`

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const { friendRequests } = useGame()
  const { friendTasks } = useAdventure()

  const [settings, setSettings] = useState(() => loadNotifSettings())
  const [permission, setPermission] = useState(() => getPermission())
  const [readIds, setReadIds] = useState(() => new Set())
  const seenRef = useRef(new Set())     // bereits per Push gemeldete IDs
  const initializedRef = useRef(false)

  // Gelesene IDs pro Nutzer laden
  useEffect(() => {
    if (!user) { setReadIds(new Set()); seenRef.current = new Set(); initializedRef.current = false; return }
    try {
      const raw = localStorage.getItem(readKey(user.id))
      setReadIds(new Set(raw ? JSON.parse(raw) : []))
    } catch { setReadIds(new Set()) }
  }, [user])

  const persistRead = useCallback((set) => {
    if (!user) return
    try { localStorage.setItem(readKey(user.id), JSON.stringify([...set])) } catch { /* ignore */ }
  }, [user])

  // ---- Benachrichtigungen aus den Quellen ableiten ----
  const notifications = useMemo(() => {
    if (!user) return []
    const list = []

    // 1) Eingehende Freundschaftsanfragen
    for (const req of friendRequests || []) {
      list.push({
        id: `freq_${req.id}`,
        type: 'friend_request',
        title: 'Neue Freundschaftsanfrage',
        body: `${req.requester?.username || 'Jemand'} möchte dein Freund sein`,
        icon: req.requester?.avatar_url || '🧝',
        at: req.created_at || new Date().toISOString(),
        link: '/friends',
      })
    }

    // 2) Eingehende Freundes-Quests (an mich, offen)
    for (const t of friendTasks || []) {
      const quest = getQuestTemplate(t.quest_id)
      if (t.receiver_id === user.id && t.status === 'pending') {
        list.push({
          id: `fq_in_${t.id}`,
          type: 'friend_quest',
          title: 'Neue Freundes-Quest',
          body: `${t.sender_name || 'Ein Freund'} schickt dir: ${quest?.icon || ''} ${quest?.title || 'Quest'}`,
          icon: '📜', at: t.created_at || new Date().toISOString(), link: '/friends',
        })
      }
      // 3) Von mir gesendete Quest wurde erfüllt
      if (t.sender_id === user.id && t.status === 'completed') {
        list.push({
          id: `fq_done_${t.id}`,
          type: 'friend_quest_done',
          title: 'Freundes-Quest erfüllt!',
          body: `${t.receiver_name || 'Dein Freund'} hat „${quest?.title || 'die Quest'}" erledigt – ihr habt beide XP erhalten!`,
          icon: '🎉', at: t.completed_at || new Date().toISOString(), link: '/friends',
        })
      }
    }

    return list.sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [user, friendRequests, friendTasks])

  const unreadCount = useMemo(() => notifications.filter((n) => !readIds.has(n.id)).length, [notifications, readIds])

  // ---- Push-Benachrichtigungen für NEUE Items ----
  useEffect(() => {
    if (!user) return
    // Beim ersten Durchlauf alle bestehenden als "gesehen" markieren (kein Spam beim Login)
    if (!initializedRef.current) {
      notifications.forEach((n) => seenRef.current.add(n.id))
      initializedRef.current = true
      return
    }
    if (!settings.pushEnabled || permission !== 'granted') {
      notifications.forEach((n) => seenRef.current.add(n.id))
      return
    }
    for (const n of notifications) {
      if (seenRef.current.has(n.id)) continue
      seenRef.current.add(n.id)
      const allowType =
        (n.type === 'friend_request' && settings.friendRequests) ||
        (n.type === 'friend_quest' && settings.friendQuests) ||
        (n.type === 'friend_quest_done' && settings.friendQuests)
      if (!allowType) continue
      showPushNotification(`${n.icon} ${n.title}`, {
        body: n.body, tag: n.id,
        onClick: () => { window.focus(); if (n.link) window.location.assign(n.link) },
      })
    }
  }, [notifications, settings, permission, user])

  // ---- Aktionen ----
  const markAsRead = useCallback((id) => {
    setReadIds((prev) => { const next = new Set(prev); next.add(id); persistRead(next); return next })
  }, [persistRead])

  const markAllAsRead = useCallback(() => {
    setReadIds(() => { const next = new Set(notifications.map((n) => n.id)); persistRead(next); return next })
  }, [notifications, persistRead])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => { const next = { ...prev, ...patch }; saveNotifSettings(next); return next })
  }, [])

  // Push aktivieren (fragt Berechtigung an)
  const enablePush = useCallback(async () => {
    const granted = await requestPushPermission()
    setPermission(getPermission())
    updateSettings({ pushEnabled: granted })
    if (granted) showPushNotification('🔔 Benachrichtigungen aktiv', { body: 'Du wirst über Freundschaftsanfragen & Quests informiert.' })
    return granted
  }, [updateSettings])

  const disablePush = useCallback(() => updateSettings({ pushEnabled: false }), [updateSettings])

  const value = {
    notifications, unreadCount, readIds,
    markAsRead, markAllAsRead,
    settings, updateSettings, enablePush, disablePush,
    pushSupported: isPushSupported(), permission,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications muss innerhalb eines NotificationProvider verwendet werden')
  return ctx
}

export default NotificationContext