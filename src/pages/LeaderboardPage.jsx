import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGame } from '../context/GameContext'
import { Trophy, Medal, Globe, Users, Clock, Swords } from 'lucide-react'
export default function LeaderboardPage() {
  const { user, profile } = useAuth()
  const { leaderboard, friends } = useGame()
  const [tab, setTab] = useState('global')

  const getTimeUntilMonday = () => {
    const now=new Date(),monday=new Date(now)
    monday.setDate(now.getDate()+(1+7-now.getDay())%7);monday.setHours(0,0,0,0)
    if(monday<=now) monday.setDate(monday.getDate()+7)
    const diff=monday-now
    return `${Math.floor(diff/(1000*60*60*24))}d ${Math.floor((diff%(1000*60*60*24))/(1000*60*60))}h`
  }
  const medalColors=['text-yellow-400','text-gray-300','text-amber-600']

  // Score = wöchentliche XP + Arena-Punkte (bereits serverseitig zusammengeführt & sortiert)
  const score = (e) => (e.score != null ? e.score : (e.xp_this_week || 0))

  // Freunde-Filter
  const friendIds = useMemo(() => new Set([...(friends||[]).map(f=>f.id), user?.id]), [friends, user])
  const list = useMemo(() => {
    const base = tab === 'friends' ? leaderboard.filter(e => friendIds.has(e.user_id)) : leaderboard
    return [...base].sort((a,b)=>score(b)-score(a))
  }, [tab, leaderboard, friendIds]) // eslint-disable-line

  const myIndex = list.findIndex(e => e.user_id === user?.id)
  const myEntry = myIndex >= 0 ? list[myIndex] : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between"><h1 className="font-title text-2xl text-gold-400 flex items-center gap-2"><Trophy className="w-6 h-6"/>Rangliste</h1><div className="flex items-center gap-2 text-xs text-gray-500"><Clock className="w-3 h-3"/>Reset: {getTimeUntilMonday()}</div></div>

      <div className="card bg-dark-300/60 text-xs text-gray-400 flex items-center gap-2">
        <Swords className="w-4 h-4 text-gold-500"/>
        <span>Wertung = wöchentliche <b className="text-gray-200">XP</b> + <b className="text-gray-200">Arena-Siege</b> (je +50 Punkte).</span>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setTab('global')} className={`tab-btn flex items-center gap-1 ${tab==='global'?'active':''}`}><Globe className="w-4 h-4"/>Global</button>
        <button onClick={()=>setTab('friends')} className={`tab-btn flex items-center gap-1 ${tab==='friends'?'active':''}`}><Users className="w-4 h-4"/>Freunde</button>
      </div>

      {myEntry&&(
        <div className="card border-gold-500/30 bg-gold-500/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{profile?.avatar_url||'🧙‍♂️'}</span>
            <div className="flex-1"><p className="font-semibold text-gold-300">{profile?.username||'Du'}</p>
              <p className="text-xs text-gray-500">{myEntry.xp_this_week||0} XP{myEntry.arena_wins>0?` · ⚔️ ${myEntry.arena_wins} Siege`:''}</p>
            </div>
            <div className="text-right"><p className="text-lg font-title text-gold-400">#{myIndex+1}</p><p className="text-xs text-gold-500">{score(myEntry)} Pkt</p></div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {list.length===0?<div className="card text-center py-12"><Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3"/><p className="text-gray-400">{tab==='friends'?'Noch keine Freunde in der Wertung.':'Noch keine Einträge.'}</p></div>
          :list.map((entry,i)=>{
            const isMe=entry.user_id===user?.id,rank=i+1
            return(
              <div key={entry.user_id} className={`card flex items-center gap-3 ${isMe?'border-gold-500/30 bg-gold-500/5':rank<=3?'border-gold-700/20':''}`}>
                <div className="w-8 text-center">{rank<=3?<Medal className={`w-6 h-6 ${medalColors[rank-1]} mx-auto`}/>:<span className="text-sm text-gray-500 font-mono">#{rank}</span>}</div>
                <span className="text-2xl">{entry.avatar_url||'🧙‍♂️'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isMe?'text-gold-300':'text-gray-200'}`}>{entry.username||'Unbekannt'}{isMe&&<span className="text-xs text-gold-500 ml-1">(Du)</span>}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{entry.xp_this_week||0} XP</span>
                    {entry.arena_wins>0&&<span className="text-gold-500/80 flex items-center gap-0.5"><Swords className="w-3 h-3"/>{entry.arena_wins}</span>}
                  </div>
                </div>
                <div className="text-right"><p className="font-title text-gold-400 font-bold">{score(entry)}</p><p className="text-xs text-gray-500">Pkt</p></div>
              </div>
            )
          })}
      </div>
    </div>
  )
}