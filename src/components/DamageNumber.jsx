// Schwebe-Schadenszahl – erscheint bei Treffern und verschwindet nach der Animation
export default function DamageNumber({ value, isCrit = false, isHeal = false, x, y, onDone }) {
  return (
    <div
      className="fixed z-[150] pointer-events-none font-title font-bold animate-dmg-float"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      onAnimationEnd={onDone}
    >
      <span className={
        isHeal ? 'text-green-400 text-2xl drop-shadow-lg'
        : isCrit ? 'text-yellow-300 text-4xl drop-shadow-[0_0_8px_rgba(255,208,64,0.8)]'
        : 'text-red-400 text-2xl drop-shadow-lg'
      }>
        {isHeal ? '+' : '-'}{value}{isCrit ? '!' : ''}
      </span>
    </div>
  )
}
