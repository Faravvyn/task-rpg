// =====================================================================
// Mini-Sound-Engine via WebAudio (keine Asset-Dateien nötig).
// Ton ist optional und standardmäßig AUS; Einstellung in localStorage.
// =====================================================================
const SOUND_KEY = 'taskrpg_sound_enabled'

export function isSoundEnabled() {
  try { return localStorage.getItem(SOUND_KEY) === '1' } catch { return false }
}
export function setSoundEnabled(on) {
  try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch { /* ignore */ }
}

let ctx = null
function getCtx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone(freq, start, dur, type = 'sine', gain = 0.12) {
  const ac = getCtx(); if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  g.gain.setValueAtTime(0, ac.currentTime + start)
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  osc.connect(g); g.connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + dur + 0.05)
}

// Triumphierende Aufstiegs-Fanfare
export function playLevelUp() {
  if (!isSoundEnabled()) return
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.14))
  tone(1318.5, 0.5, 0.5, 'sine', 0.1) // glitzernder Abschluss
}

// Helles "Ding" für Errungenschaften
export function playAchievement() {
  if (!isSoundEnabled()) return
  tone(880, 0, 0.18, 'square', 0.08)
  tone(1174.7, 0.12, 0.3, 'triangle', 0.1)
}

// Kleiner Bestätigungs-Klick (z.B. Task erledigt) – aktuell ungenutzt, bereit.
export function playBlip() {
  if (!isSoundEnabled()) return
  tone(660, 0, 0.1, 'sine', 0.07)
}