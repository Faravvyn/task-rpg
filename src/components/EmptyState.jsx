// Illustrierter Leerzustand – freundlich statt leer.
export default function EmptyState({ emoji = '🗡️', title = 'Nichts hier', subtitle = '', action = null, className = '' }) {
  return (
    <div className={`card text-center py-12 px-6 relative overflow-hidden ${className}`}>
      {/* dekorative Funken */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.07] flex items-center justify-center">
        <span className="text-[140px] leading-none">{emoji}</span>
      </div>
      <div className="relative z-10">
        <div className="text-6xl mb-4 animate-float inline-block">{emoji}</div>
        <h3 className="font-title text-lg text-gray-200 mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 max-w-xs mx-auto">{subtitle}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  )
}