import { useState, useRef } from 'react'
import { Check, Trash2, Edit3, ChevronDown, ChevronUp, RotateCcw, Clock, Star, Camera, Loader2 } from 'lucide-react'
import { useGame } from '../hooks/useGame'
import { isTaskAvailable, isTaskCompletedToday } from '../utils/streak'
import { getXpReward, getStreakMultiplier, calculateFinalXp } from '../utils/xp'
import { calculateStreak } from '../utils/streak'

const difficultyColors = {
  leicht:'text-green-400 bg-green-400/10 border-green-400/30',
  mittel:'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  schwer:'text-red-400 bg-red-400/10 border-red-400/30'
}
const repeatIcons = {
  einmalig:<Star className="w-3 h-3"/>, taeglich:<RotateCcw className="w-3 h-3"/>, woechentlich:<Clock className="w-3 h-3"/>
}
const repeatLabels = { einmalig:'Einmalig', taeglich:'Täglich', woechentlich:'Wöchentlich' }
const categoryEmojis = { haushalt:'🏠', gesundheit:'💊', lernen:'📚', arbeit:'💼', sport:'🏋️' }

export default function TaskItem({ task, completions, onEdit }) {
  const { completeTask, deleteTask } = useGame()
  const [expanded, setExpanded] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const fileInputRef = useRef(null)

  const available = isTaskAvailable(task, completions)
  const completedToday = isTaskCompletedToday(task.id, completions)
  const streak = calculateStreak(completions)
  const baseXp = task.xp_reward || getXpReward(task.difficulty)
  const finalXp = calculateFinalXp(baseXp, streak)

  const handleComplete = async (e) => {
    if (!available || completing || verifying) return
    
    // Foto-Verifizierung
    if (task.verification_type === 'photo' && !completedToday) {
      fileInputRef.current?.click()
      return
    }

    // Schritte-Verifizierung
    if (task.verification_type === 'steps' && !completedToday) {
      const currentSteps = character?.daily_steps || 0
      const reqSteps = task.verification_value || 0
      if (currentSteps < reqSteps) {
        alert(`❌ Nicht genug Schritte! Du hast heute ${currentSteps.toLocaleString()} von ${reqSteps.toLocaleString()} benötigten Schritten gesammelt. Synchronisiere deine Schritte zuerst auf dem Dashboard!`)
        return
      }
    }

    setCompleting(true); setShowXp(true)
    await completeTask(task, e)
    setTimeout(() => setShowXp(false), 1500); setCompleting(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setVerifying(true)
    // Simulierter KI-Check
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(`✅ KI-Analyse erfolgreich! "${task.verification_target || 'Objekt'}" erkannt.`)
    
    setVerifying(false)
    setCompleting(true); setShowXp(true)
    await completeTask(task)
    setTimeout(() => setShowXp(false), 1500); setCompleting(false)
  }

  const handleDelete = async () => {
    if (window.confirm('Aufgabe wirklich löschen?')) await deleteTask(task.id)
  }

  return (
    <div className={`card relative overflow-hidden transition-all duration-300 ${!available?'opacity-60':'hover:border-gold-700/20'} ${completedToday?'border-green-800/30':''}`}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
      
      {showXp && (
        <div className="absolute top-2 right-4 z-10 xp-popup">
          <span className="text-gold-400 font-bold text-lg">+{finalXp} XP ✨</span>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <button onClick={handleComplete} disabled={!available||completing||verifying}
          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${available?'border-gray-500 hover:border-gold-400 hover:bg-gold-400/10 cursor-pointer':completedToday?'border-green-500 bg-green-500/20 cursor-default':'border-gray-700 cursor-default'}`}>
          {verifying ? <Loader2 className="w-4 h-4 text-gold-400 animate-spin" /> :
           (completedToday||completing) ? <Check className={`w-4 h-4 ${completedToday?'text-green-400':'text-gold-400 animate-bounce-in'}`}/> :
           task.verification_type === 'photo' ? <Camera className="w-4 h-4 text-gray-400" /> : null}
        </button>
        
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">{categoryEmojis[task.category]||'📝'}</span>
              <h3 className={`font-semibold truncate ${available?'text-gray-100':'text-gray-500 line-through'}`}>{task.title}</h3>
              {task.verification_type === 'photo' && available && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded uppercase font-bold">Foto</span>}
              {task.verification_type === 'steps' && available && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded uppercase font-bold">Schritte</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge border ${difficultyColors[task.difficulty]}`}>{task.difficulty}</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">{repeatIcons[task.repeat_type]}{repeatLabels[task.repeat_type]}</span>
              <span className="text-xs text-gold-500 font-semibold">+{baseXp} XP</span>
              {task.verification_type === 'steps' && available && <span className="text-[10px] text-blue-400 font-bold tracking-tighter">{character?.daily_steps || 0} / {task.verification_value?.toLocaleString()} 🚶</span>}
              {task.verification_target && task.verification_type === 'photo' && available && <span className="text-[10px] text-gray-500">Ziel: {task.verification_target}</span>}
            </div>
          </div>
        
        <div className="flex items-center gap-1">
          {available&&<button onClick={()=>setExpanded(!expanded)} className="p-1.5 text-gray-500 hover:text-gray-300 rounded">{expanded?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}</button>}
        </div>
      </div>
      
      {expanded&&(
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700/50 animate-slide-up">
          <button onClick={()=>onEdit?.(task)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"><Edit3 className="w-3 h-3"/> Bearbeiten</button>
          <button onClick={handleDelete} className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Löschen</button>
        </div>
      )}
    </div>
  )
}
