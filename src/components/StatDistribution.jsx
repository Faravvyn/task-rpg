import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { statNames, statColors } from '../utils/xp'
import { Plus, Minus } from 'lucide-react'
export default function StatDistribution({ onClose }) {
  const { character, updateCharacter } = useAuth()
  const [points, setPoints] = useState({})
  const [saving, setSaving] = useState(false)
  const bonusPoints = character?.bonus_points || 0
  const currentStats = character?.stats || {}
  const allocated = Object.values(points).reduce((sum,v)=>sum+v,0)
  const remaining = bonusPoints - allocated
  const handleAllocate = (statKey, delta) => {
    const current = points[statKey] || 0
    const newVal = current + delta
    if (newVal < 0 || (delta > 0 && remaining <= 0)) return
    setPoints({ ...points, [statKey]: newVal })
  }
  const handleSave = async () => {
    if (allocated === 0 || remaining < 0) return
    setSaving(true)
    const newStats = { ...currentStats }
    Object.entries(points).forEach(([key, val]) => { newStats[key] = (newStats[key] || 0) + val })
    
    // WICHTIG: bonus_points müssen in der DB abgezogen werden!
    await updateCharacter({ stats: newStats, bonus_points: remaining })
    
    setPoints({})
    setSaving(false); onClose?.()
  }
  if (bonusPoints <= 0 && allocated === 0) return null
  return (
    <div className="card border-gold-500/30 bg-dark-300/90">
      <h3 className="font-title text-gold-400 text-lg mb-4">✨ Statuspunkte verteilen ({remaining} übrig)</h3>
      <div className="space-y-3">
        {Object.entries(statNames).map(([key, name]) => {
          const allocatedToStat = points[key] || 0
          const total = (currentStats[key] || 0) + allocatedToStat
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-gray-300 w-24">{name}</span>
              <div className="flex-1 stat-bar"><div className={`stat-bar-fill ${statColors[key]}`} style={{width:`${Math.min(total*5,100)}%`}}/></div>
              <span className="text-sm font-mono text-gray-200 w-8 text-center">{total}</span>
              <div className="flex items-center gap-1">
                <button onClick={()=>handleAllocate(key,-1)} disabled={allocatedToStat<=0} className="w-6 h-6 rounded bg-dark-400 border border-gray-600 flex items-center justify-center hover:border-red-500 hover:text-red-400 disabled:opacity-30"><Minus className="w-3 h-3"/></button>
                <span className="text-gold-400 font-bold w-5 text-center">{allocatedToStat>0?`+${allocatedToStat}`:'-'}</span>
                <button onClick={()=>handleAllocate(key,1)} disabled={remaining<=0} className="w-6 h-6 rounded bg-dark-400 border border-gray-600 flex items-center justify-center hover:border-gold-500 hover:text-gold-400 disabled:opacity-30"><Plus className="w-3 h-3"/></button>
              </div>
            </div>
          )
        })}
      </div>
      {allocated>0&&<button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-4">{saving?'Speichern...':`${allocated} Punkte bestätigen`}</button>}
    </div>
  )
}
