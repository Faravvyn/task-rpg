// Gemeinsame Cache-Utility – persistiert Daten in localStorage
// für Offline-Start und Cache-First-Hydration.

const PREFIX = 'taskrpg_cache_'

export function saveCache(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, savedAt: Date.now() }))
  } catch { /* ignore */ }
}

export function loadCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.data ?? null
  } catch { return null }
}
