import { useAuth } from '../context/AuthContext'
import { useCharacter } from '../hooks/useCharacter'
import { useTasks } from '../hooks/useTasks'
import TaskItem from '../components/TaskItem'
import XPBar from '../components/XPBar'
import { getStreakMultiplier } from '../utils/xp'
import { 
  Flame, Zap, Target, TrendingUp, CheckCircle2, 
  Clock, Star, ScrollText, Sparkles, Skull, ChevronRight 
} from 'lucide-react'
import { useAdventure } from '../context/AdventureContext'
import { formatTimeLeft } from '../utils/quests'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

export default function DashboardPage() {
  const { profile, character } = useAuth()
  const { levelInfo, streak, todayXp, weekXp, hasDoneTaskToday } = useCharacter()
  const { availableTasks, completedToday, completions } = useTasks()
  const { activeQuests, now } = useAdventure()
  const streakBonus = Math.round((getStreakMultiplier(streak)-1)*100)
  const totalTasksToday = availableTasks.length + completedToday.length
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="font-title text-2xl text-gold-400">Willkommen zurück, {profile?.username||'Held'}!</h1>
          <p className="text-gray-400 text-sm mt-1">{hasDoneTaskToday?'🔥 Du bist heute schon aktiv!':'⚡ Heute ist ein guter Tag!'}</p></div>
        <span className="text-4xl">{profile?.avatar_url||'🧙‍♂️'}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card flex flex-col items-center py-4"><Star className="w-5 h-5 text-gold-400 mb-1"/><span className="text-2xl font-title text-gold-300 font-bold">{levelInfo.level}</span><span className="text-xs text-gray-500">Level</span></div>
        <div className="card flex flex-col items-center py-4"><Zap className="w-5 h-5 text-yellow-400 mb-1"/><span className="text-2xl font-title text-yellow-300 font-bold">{todayXp}</span><span className="text-xs text-gray-500">XP Heute</span></div>
        <div className="card flex flex-col items-center py-4"><Flame className={`w-5 h-5 mb-1 ${streak>0?'text-orange-400':'text-gray-600'}`}/><span className={`text-2xl font-title font-bold ${streak>0?'text-orange-300':'text-gray-600'}`}>{streak}</span><span className="text-xs text-gray-500">Streak{streakBonus>0?` (+${streakBonus}%)`:''}</span></div>
        <div className="card flex flex-col items-center py-4"><Target className="w-5 h-5 text-green-400 mb-1"/><span className="text-2xl font-title text-green-300 font-bold">{completedToday.length}/{totalTasksToday}</span><span className="text-xs text-gray-500">Tasks</span></div>
      </div>
      <div className="card"><XPBar/></div>
      
      {/* Dungeon Crawler Progress */}
      <div 
        className="card relative overflow-hidden group bg-cover bg-center border-red-900/20"
        style={{ backgroundImage: `linear-gradient(to right, rgba(26,28,36,0.9), rgba(26,28,36,0.7)), url(${character?.dungeon_floor <= 10 ? '/assets/dungeon_bg_1.jpg' : '/assets/dungeon_bg_2.jpg'})` }}
      >
        <Link to="/rpg" className="flex items-center justify-between group-hover:opacity-90 transition-opacity">
          <div className="flex-1 relative z-10">
             <h3 className="font-title text-sm text-red-400 flex items-center gap-1.5"><Skull className="w-4 h-4"/> Dungeon-Expedition</h3>
             <p className="text-[10px] text-gray-400 uppercase tracking-tighter mb-1.5">Ebene {character?.dungeon_floor || 1}</p>
             <div className="flex gap-1 h-2">
               {Array.from({ length: 10 }).map((_, i) => (
                 <div key={i} className={`flex-1 rounded-sm border ${i < (character?.dungeon_room || 0) ? 'bg-red-600 border-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-black/40 border-gray-800'}`} />
               ))}
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 ml-4 relative z-10" />
        </Link>
      </div>

      {activeQuests.length>0&&(
        <Link to="/adventure/quests" className="card block border-green-700/30 bg-green-900/10 hover:border-green-600/40">
          <div className="flex items-center gap-3">
            <ScrollText className="w-6 h-6 text-green-400"/>
            <div className="flex-1">
              <p className="font-semibold text-green-300 flex items-center gap-1"><Sparkles className="w-4 h-4"/>{activeQuests.length} Sonderquest{activeQuests.length>1?'s':''} verfügbar!</p>
              <p className="text-xs text-gray-400">{activeQuests[0].quests.icon} {activeQuests[0].quests.title} · +{activeQuests[0].quests.xp} XP · noch {formatTimeLeft(activeQuests[0].expiresAt, now)}</p>
            </div>
            <span className="text-green-400">→</span>
          </div>
        </Link>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-title text-lg text-gray-200 flex items-center gap-2"><Clock className="w-5 h-5 text-gold-500"/>Offene Aufgaben ({availableTasks.length})</h2>
          <Link to="/tasks" className="text-sm text-gold-500">Alle →</Link>
        </div>
        {availableTasks.length===0?(
          <EmptyState emoji="🎉" title="Alles erledigt!" subtitle="Du hast heute alle Aufgaben gemeistert. Der Held darf rasten." />
        ):(
          <div className="space-y-2">
            {availableTasks.slice(0,5).map(task=><TaskItem key={task.id} task={task} completions={completions}/>)}
            {availableTasks.length>5&&<Link to="/tasks" className="block text-center text-sm text-gold-500 py-2">+{availableTasks.length-5} weitere</Link>}
          </div>
        )}
      </div>
      {completedToday.length>0&&(
        <div>
          <h2 className="font-title text-lg text-gray-200 flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-green-500"/>Heute erledigt ({completedToday.length})</h2>
          <div className="space-y-2 opacity-70">{completedToday.map(task=><TaskItem key={task.id} task={task} completions={completions}/>)}</div>
        </div>
      )}
      <div className="card"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-gold-500"/><h3 className="font-title text-gray-200">Wochenfortschritt</h3></div><p className="text-3xl font-title text-gold-300 font-bold">{weekXp} XP</p></div>
    </div>
  )
}