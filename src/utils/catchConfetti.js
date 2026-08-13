// Fang-Konfetti – eigener Farb-/Form-Stil für Monster-Fänge (gold/weiß)
import confetti from 'canvas-confetti'

export function fireCatchConfetti() {
  const colors = ['#FFD040', '#D4A017', '#FFFFFF']
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.5 },
    colors,
    shapes: ['circle'],
    scalar: 0.8,
  })
  // Zweiter, verzögerter Burst für "Pop"-Gefühl
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 100,
      startVelocity: 25,
      origin: { y: 0.45 },
      colors,
      scalar: 1.1,
    })
  }, 150)
}
