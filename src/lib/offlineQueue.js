// Offline Mutation Queue – speichert ausstehende Änderungen in localStorage
// und spielt sie bei Wiederverbindung automatisch ab.

const QUEUE_KEY = 'taskrpg_pending_mutations'

export function enqueueMutation(mutation) {
  const queue = getQueue()
  queue.push({ ...mutation, timestamp: Date.now(), retries: 0 })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

export function clearMutation(id) {
  const queue = getQueue().filter(m => m.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function queueSize() {
  return getQueue().length
}

// Nach erfolgreichem task_create: alle edit/delete auf tempId → echte ID umbiegen
export function remapQueueId(oldId, newId) {
  const queue = getQueue()
  let changed = false
  const updated = queue.map(m => {
    if (m.payload?.id === oldId) {
      changed = true
      return { ...m, payload: { ...m.payload, id: newId } }
    }
    if (m.payload?.taskId === oldId) {
      changed = true
      return { ...m, payload: { ...m.payload, taskId: newId } }
    }
    return m
  })
  if (changed) localStorage.setItem(QUEUE_KEY, JSON.stringify(updated))
}

// Garantiert chronologische Reihenfolge (timestamp), damit create vor edit/delete läuft
export async function flushQueue(executors) {
  const queue = getQueue().sort((a, b) => a.timestamp - b.timestamp)
  if (queue.length === 0) return

  for (const mutation of queue) {
    const executor = executors[mutation.type]
    if (!executor) continue

    try {
      const ok = await executor(mutation.payload)
      if (ok) {
        clearMutation(mutation.id)
      } else {
        mutation.retries = (mutation.retries || 0) + 1
        if (mutation.retries > 5) clearMutation(mutation.id)
      }
    } catch {
      mutation.retries = (mutation.retries || 0) + 1
      if (mutation.retries > 5) clearMutation(mutation.id)
    }
  }
}
