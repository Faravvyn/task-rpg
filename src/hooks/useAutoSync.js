// Auto-Sync-Hook: führt syncFn aus bei App-Start, Tab-Fokus und in Intervallen.
// Mit Debounce (min. 60s zwischen Syncs) und optionalem silent-Modus.
import { useEffect, useRef, useCallback } from 'react'

export function useAutoSync(syncFn, { intervalMs = 15 * 60 * 1000, enabled = true } = {}) {
  const lastRunRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const run = useCallback(() => {
    if (!enabled) return
    const now = Date.now()
    if (now - lastRunRef.current < 60 * 1000) return // min. 1 Min Debounce
    lastRunRef.current = now
    syncFn()
  }, [syncFn, enabled])

  useEffect(() => {
    if (!enabled) return

    // Beim Mount (App-Start) einmal laufen
    run()

    // Bei Tab-Fokus (visibilitychange) nachsyncen
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Intervall solange die App offen ist
    const interval = setInterval(run, intervalMs)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(interval)
    }
  }, [run, intervalMs, enabled])
}
