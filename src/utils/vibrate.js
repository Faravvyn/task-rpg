// Utility für haptisches Feedback auf Android-Geräten
export function vibrate(pattern = 50) {
  try {
    const enabled = localStorage.getItem('taskrpg_vibration_enabled') !== '0'
    if (enabled && typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern)
    }
  } catch (e) {}
}

export function setVibrationEnabled(on) {
  localStorage.setItem('taskrpg_vibration_enabled', on ? '1' : '0')
}

export function isVibrationEnabled() {
  return localStorage.getItem('taskrpg_vibration_enabled') !== '0'
}

export const VIBRATION_PATTERNS = {
  SUCCESS: 40,
  CRIT: [40, 30, 60],
  LEVEL_UP: [100, 50, 100, 50, 200],
  ITEM_DROP: [50, 50, 50]
}
