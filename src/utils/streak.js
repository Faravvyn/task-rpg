export function formatDate(date) {
  const d=new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
export function isSameDay(d1,d2){return formatDate(d1)===formatDate(d2)}
export function isConsecutiveDay(d1,d2){
  const a=new Date(formatDate(d1)),b=new Date(formatDate(d2))
  const diff=(b-a)/(1000*60*60*24); return diff===1||diff===-1
}
export function hasCompletedToday(completions){
  const today=formatDate(new Date())
  return completions.some(c=>formatDate(c.completed_at)===today)
}
export function calculateTodayXp(completions){
  const today=formatDate(new Date())
  return completions.filter(c=>formatDate(c.completed_at)===today).reduce((sum,c)=>sum+(c.xp_gained||0),0)
}
export function calculateWeekXp(completions){
  const now=new Date(),dayOfWeek=(now.getDay()+6)%7
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-dayOfWeek);weekStart.setHours(0,0,0,0)
  return completions.filter(c=>new Date(c.completed_at)>=weekStart).reduce((sum,c)=>sum+(c.xp_gained||0),0)
}
export function isTaskCompletedToday(taskId,completions){
  const today=formatDate(new Date())
  return completions.some(c=>c.task_id===taskId&&formatDate(c.completed_at)===today)
}
export function isTaskCompletedThisWeek(taskId,completions){
  const now=new Date(),dayOfWeek=(now.getDay()+6)%7
  const weekStart=new Date(now);weekStart.setDate(now.getDate()-dayOfWeek);weekStart.setHours(0,0,0,0)
  return completions.some(c=>c.task_id===taskId&&new Date(c.completed_at)>=weekStart)
}
export function isTaskAvailable(task,completions){
  if(!task.is_active) return false
  if(task.repeat_type==='taeglich') return !isTaskCompletedToday(task.id,completions)
  if(task.repeat_type==='woechentlich') return !isTaskCompletedThisWeek(task.id,completions)
  if(task.repeat_type==='einmalig') return !completions.some(c=>c.task_id===task.id)
  return true
}
export function calculateStreak(completions){
  if(!completions||completions.length===0) return 0
  const days=[...new Set(completions.map(c=>formatDate(c.completed_at)))].sort().reverse()
  const today=formatDate(new Date()),yesterday=formatDate(new Date(Date.now()-86400000))
  if(days[0]!==today&&days[0]!==yesterday) return 0
  let streak=1
  for(let i=1;i<days.length;i++){
    const prev=new Date(days[i-1]),curr=new Date(days[i])
    if((prev-curr)/(1000*60*60*24)===1) streak++; else break
  }
  return streak
}
export function getStreakCalendarData(completions,days=35){
  const result=[]
  for(let i=days-1;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i)
    const dateStr=formatDate(d)
    result.push({date:dateStr,completed:completions.some(c=>formatDate(c.completed_at)===dateStr)})
  }
  return result
}
export function calculateStreakWithShield(completions,equippedArtifacts=[]){
  let streak=calculateStreak(completions)
  if(streak===0&&equippedArtifacts.length>0){
    const shield=equippedArtifacts.find(ca=>ca.artifacts?.effect_type==='streak_shield')
    if(shield) return{streak:1,shieldUsed:true,shieldArtifactId:shield.id}
  }
  return{streak,shieldUsed:false,shieldArtifactId:null}
}
