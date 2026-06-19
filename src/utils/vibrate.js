// Utility für haptisches Feedback auf Android-Geräten
export function vibrate(pattern = 50) {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern)
  }
}

export const VIBRATION_PATTERNS = {
  SUCCESS: 40,
  CRIT: [40, 30, 60],
  LEVEL_UP: [100, 50, 100, 50, 200],
  ITEM_DROP: [50, 50, 50]
}
