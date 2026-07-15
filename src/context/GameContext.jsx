import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { calculateLevel, getXpReward, getGoldReward, categoryStatMap } from '../utils/xp'
import { calculateStreak } from '../utils/streak'
import { useAdventure } from './AdventureContext'
import { getSetXpBonusPercent, getWeekStartStr, ARENA_WIN_POINTS, applyXp } from '../utils/adventure'
import { getTodayEvent } from '../utils/achievements'
import { formatDate } from '../utils/streak'
import { fetchArenaWinCounts } from '../lib/adventureRepo'
import { vibrate, VIBRATION_PATTERNS } from '../utils/vibrate'

const GameContext = createContext({})
const initialState = {
  tasks:[], completions:[], leaderboard:[], friends:[], friendRequests:[], challenges:[],
  loading:false, xpPopup:null, levelUpModal:false, monsterHint: null
}
function gameReducer(state, action) {
  switch(action.type) {
    case 'SET_LOADING': return{...state,loading:action.payload}
    case 'SET_TASKS': return{...state,tasks:action.payload}
    case 'ADD_TASK': return{...state,tasks:[...state.tasks,action.payload]}
    case 'UPDATE_TASK': return{...state,tasks:state.tasks.map(t=>t.id===action.payload.id?action.payload:t)}
    case 'DELETE_TASK': return{...state,tasks:state.tasks.filter(t=>t.id!==action.payload)}
    case 'SET_COMPLETIONS': return{...state,completions:action.payload}
    case 'ADD_COMPLETION': return{...state,completions:[action.payload,...state.completions]}
    case 'SET_LEADERBOARD': return{...state,leaderboard:action.payload}
    case 'SET_FRIENDS': return{...state,friends:action.payload}
    case 'SET_FRIEND_REQUESTS': return{...state,friendRequests:action.payload}
    case 'SET_CHALLENGES': return{...state,challenges:action.payload}
    case 'SHOW_XP_POPUP': return{...state,xpPopup:action.payload}
    case 'HIDE_XP_POPUP': return{...state,xpPopup:null}
    case 'SHOW_LEVEL_UP': return{...state,levelUpModal:true}
    case 'HIDE_LEVEL_UP': return{...state,levelUpModal:false}
    case 'SET_MONSTER_HINT': return{...state,monsterHint:action.payload}
    case 'CLEAR_MONSTER_HINT': return{...state,monsterHint:null}
    default: return state
  }
}
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { user, character, updateCharacter } = useAuth()
  const { 
    dealBossDamage, equippedArtifactIds, equippedArtifactIdsUnique, 
    doubledArtifactIds, grantRandomArtifact, userTeam, userMonsters 
  } = useAdventure()
  const todayEvent = getTodayEvent(formatDate(new Date()))
  const eventXpMult = todayEvent?.effect?.type === 'xp_mult' ? todayEvent.effect.value : 1

  const fetchTasks = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (!error && data) dispatch({ type: 'SET_TASKS', payload: data })
    } catch (e) { console.warn('Tasks:', e.message) }
  }, [user])

  const fetchCompletions = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return
    try {
      const { data, error } = await supabase.from('task_completions').select('*').eq('user_id', user.id).order('completed_at', { ascending: false })
      if (!error && data) dispatch({ type: 'SET_COMPLETIONS', payload: data })
    } catch (e) { console.warn('Completions:', e.message) }
  }, [user])

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    try {
      const { data, error } = await supabase.from('leaderboard_weekly').select('user_id,xp_this_week,rank,week_start').order('xp_this_week', { ascending: false }).limit(50)
      if (error || !data) return
      const userIds = data.map(e => e.user_id)
      const [{ data: profiles }, arenaWins] = await Promise.all([
        supabase.from('profiles').select('id,username,avatar_url').in('id', userIds),
        fetchArenaWinCounts(getWeekStartStr()),
      ])
      const leaderboard = data.map(entry => {
        const prof = profiles?.find(p => p.id === entry.user_id)
        const wins = arenaWins[entry.user_id] || 0
        const arenaPoints = wins * ARENA_WIN_POINTS
        return {
          ...entry,
          username: prof?.username || 'Unbekannt',
          avatar_url: prof?.avatar_url || '🧙‍♂️',
          arena_wins: wins,
          arena_points: arenaPoints,
          score: (entry.xp_this_week || 0) + arenaPoints,
        }
      })
      leaderboard.sort((a, b) => b.score - a.score)
      dispatch({ type: 'SET_LEADERBOARD', payload: leaderboard })
    } catch (e) { console.warn('Leaderboard:', e.message) }
  }, [])

  const fetchFriends = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return
    try {
      const { data: accepted } = await supabase.from('friendships').select('id,requester_id,receiver_id,status').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`).eq('status', 'accepted')
      if (accepted && accepted.length > 0) {
        const friendIds = accepted.map(f => f.requester_id === user.id ? f.receiver_id : f.requester_id)
        const { data: friendProfiles } = await supabase.from('profiles').select('id,username,avatar_url').in('id', friendIds)
        dispatch({ type: 'SET_FRIENDS', payload: (friendProfiles || []).map(p => ({
          ...p, friendship_id: accepted.find(f => f.requester_id === p.id || f.receiver_id === p.id)?.id
        })) })
      } else { dispatch({ type: 'SET_FRIENDS', payload: [] }) }
      const { data: pending } = await supabase.from('friendships').select('id,requester_id,receiver_id,status,created_at').eq('receiver_id', user.id).eq('status', 'pending')
      if (pending && pending.length > 0) {
        const { data: requesterProfiles } = await supabase.from('profiles').select('id,username,avatar_url').in('id', pending.map(r => r.requester_id))
        dispatch({ type: 'SET_FRIEND_REQUESTS', payload: pending.map(r => ({
          ...r, requester: requesterProfiles?.find(p => p.id === r.requester_id) || { username: 'Unbekannt', avatar_url: '🧙‍♂️' }
        })) })
      } else { dispatch({ type: 'SET_FRIEND_REQUESTS', payload: [] }) }
    } catch (e) { console.warn('Freunde:', e.message) }
  }, [user])

  const fetchChallenges = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return
    try {
      const { data, error } = await supabase.from('challenges').select('*').or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`).order('created_at', { ascending: false })
      if (error || !data) return
      
      // Auto-Resolve expired challenges
      const now = new Date()
      for (const ch of data) {
        if (ch.status === 'active' && new Date(ch.end_date) < now) {
           // Hier müsste normalerweise eine Auswertung (RPC) stattfinden
           await supabase.from('challenges').update({ status: 'completed' }).eq('id', ch.id)
        }
      }

      const uniqueIds = [...new Set(data.map(c => c.challenger_id === user.id ? c.opponent_id : c.challenger_id))]
      const { data: profiles } = await supabase.from('profiles').select('id,username,avatar_url').in('id', uniqueIds)
      dispatch({ type: 'SET_CHALLENGES', payload: data.map(c => ({
        ...c,
        challenger: c.challenger_id === user.id ? { id: user.id } : profiles?.find(p => p.id === c.challenger_id) || {},
        opponent: c.opponent_id === user.id ? { id: user.id } : profiles?.find(p => p.id === c.opponent_id) || {}
      })) })
    } catch (e) { console.warn('Challenges:', e.message) }
  }, [user])

  useEffect(() => {
    if (user && character) { 
      fetchTasks(); fetchCompletions(); fetchLeaderboard(); fetchFriends(); fetchChallenges() 
      
      const tasksChannel = supabase.channel('tasks_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` }, () => fetchTasks())
        .subscribe()
        
      const compsChannel = supabase.channel('completions_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions', filter: `user_id=eq.${user.id}` }, () => fetchCompletions())
        .subscribe()

      return () => {
        supabase.removeChannel(tasksChannel)
        supabase.removeChannel(compsChannel)
      }
    }
  }, [user, character, fetchTasks, fetchCompletions, fetchLeaderboard, fetchFriends, fetchChallenges])

  const createTask = async (taskData) => {
    if (!user) return { error: { message: 'Nicht eingeloggt' } }
    try {
      const { data, error } = await supabase.from('tasks').insert({
        user_id: user.id, title: taskData.title, category: taskData.category,
        difficulty: taskData.difficulty, repeat_type: taskData.repeat_type,
        xp_reward: getXpReward(taskData.difficulty), is_active: true,
        verification_type: taskData.verification_type || 'none',
        verification_target: taskData.verification_target || null,
        verification_value: taskData.verification_value || null
      }).select().single()
      if (!error && data) dispatch({ type: 'ADD_TASK', payload: data })
      return { data, error }
    } catch (err) { return { error: { message: err.message } } }
  }
  const editTask = async (id, updates) => {
    try {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
      if (!error && data) dispatch({ type: 'UPDATE_TASK', payload: data })
      return { data, error }
    } catch (err) { return { error: { message: err.message } } }
  }
  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) dispatch({ type: 'DELETE_TASK', payload: id })
    return { error }
  }
  
  const completeTask = async (task, event) => {
    if (!user || !character) return
    const now = new Date()
    const streak = calculateStreak(state.completions)
    const baseXp = task.xp_reward || getXpReward(task.difficulty)
    const baseGold = getGoldReward(task.difficulty)

    const lastComps = state.completions.slice(0, 2)
    let frenzyActive = false
    if (lastComps.length === 2) {
      const timeDiff = (now - new Date(lastComps[0].completed_at)) / 60000
      if (timeDiff < 15) frenzyActive = true
    }

    const stats = character.stats || {}
    let finalXp = applyXp(baseXp, streak, {
      equippedArtifactIds: equippedArtifactIds || [],
      ownedArtifactIds: equippedArtifactIdsUnique || [],
      doubledArtifactIds: doubledArtifactIds || [],
      stats,
    })
    if (eventXpMult !== 1) finalXp = Math.round(finalXp * eventXpMult)

    let finalGold = baseGold
    if (frenzyActive) {
       finalGold = Math.round(finalGold * 1.2)
       finalXp = Math.round(finalXp * 1.2)
    }
    
    if (character.skills?.treasure_hunter) finalGold = Math.round(finalGold * 1.15)

    const { data: completion, error: compError } = await supabase.from('task_completions').insert({ user_id: user.id, task_id: task.id, xp_gained: finalXp }).select().single()
    if (compError) return { error: compError }
    dispatch({ type: 'ADD_COMPLETION', payload: completion })

    // --- Monster Encounter Logik ---
    const luck = character.stats?.glueck || 0
    const hintChance = 0.1 + (luck * 0.01)
    if (Math.random() < hintChance) {
      const bossTriggers = [
        "Mache 20 Liegestütze um einen Erden-Typ Mini-Boss zu locken!",
        "Erledige eine schwere Aufgabe um einen Feuer-Typ Mini-Boss zu rufen!",
        "Gehe 5km spazieren um einen Wind-Typ Mini-Boss zu finden!",
        "Trinke 2L Wasser um einen Wasser-Typ Mini-Boss zu spawnen!"
      ]
      const hint = bossTriggers[Math.floor(Math.random() * bossTriggers.length)]
      dispatch({ type: 'SET_MONSTER_HINT', payload: hint })
    }

    let newRoom = (character.dungeon_room || 0) + 1
    let newFloor = character.dungeon_floor || 1
    let foundChest = false
    if (newRoom >= 10) {
      newRoom = 0
      newFloor += 1
      foundChest = true
    }

    const oldLevel = Pr(character.xp || 0).level
    const nextXp = (character.xp || 0) + finalXp
    const newLevelInfo = Pr(nextXp)
    
    try { dealBossDamage?.(task.difficulty) } catch (e) { }

    const statKey = categoryStatMap[task.category]
    const currentStats = character.stats ? { ...character.stats } : { staerke:0, ausdauer:0, intelligenz:0, willenskraft:0, glueck:0 }
    if (statKey) currentStats[statKey] = (currentStats[statKey] || 0) + 1

    const updates = {
      xp: nextXp,
      gold: (character.gold || 0) + finalGold,
      level: newLevelInfo.level,
      dungeon_room: newRoom,
      dungeon_floor: newFloor,
      stats: currentStats,
      bonus_points: character.bonus_points || 0,
      skill_points: character.skill_points || 0
    }

    if (newLevelInfo.level > oldLevel) {
      updates.bonus_points += 2
      updates.skill_points += 1
      vibrate(VIBRATION_PATTERNS.LEVEL_UP)
      dispatch({ type: 'SHOW_LEVEL_UP' })
    }

    await updateCharacter(updates)
    
    // Dungeon Chest & Monster Level Up
    if (foundChest) {
       vibrate(VIBRATION_PATTERNS.ITEM_DROP)
       await grantRandomArtifact('common')
       
       // Monster XP Gain
       const teamIds = [userTeam.slot_1, userTeam.slot_2, userTeam.slot_3].filter(Boolean)
       for (const mId of teamIds) {
         const monster = userMonsters.find(m => m.id === mId)
         if (monster) {
           const xpGain = 25 * newFloor
           let nextMXp = (monster.xp || 0) + xpGain
           let nextMLevel = monster.level || 1
           let addedPoints = 0
           while (nextMXp >= (nextMLevel * 50)) {
             nextMXp -= (nextMLevel * 50)
             nextMLevel++
             addedPoints += 3
           }
           await supabase.from('user_monsters').update({
             xp: nextMXp, level: nextMLevel, stat_points: (monster.stat_points || 0) + addedPoints
           }).eq('id', mId)
         }
       }
    }

    if (event) {
      const rect = event.target.getBoundingClientRect()
      const isCrit = finalXp > baseXp * 1.5
      if (isCrit) vibrate(VIBRATION_PATTERNS.CRIT)
      else vibrate(VIBRATION_PATTERNS.SUCCESS)

      dispatch({ type: 'SHOW_XP_POPUP', payload: { 
        xp: finalXp, 
        gold: finalGold, 
        isCrit,
        isFrenzy: frenzyActive,
        x: rect.left + rect.width / 2, 
        y: rect.top 
      } })
      setTimeout(() => dispatch({ type: 'HIDE_XP_POPUP' }), 2000)
    }

    return { data: completion, xpGained: finalXp, goldGained: finalGold }
  }

  const addFriend = async (username) => {
    if (!user) return { error: { message: 'Nicht eingeloggt' } }
    try {
      const { data: profiles, error: searchError } = await supabase.from('profiles').select('id,username,avatar_url').ilike('username', username.trim())
      if (searchError) return { error: { message: 'Fehler bei der Suche: ' + searchError.message } }
      if (!profiles || profiles.length === 0) return { error: { message: `Benutzer "${username.trim()}" nicht gefunden.` } }
      const friendProfile = profiles[0]
      if (friendProfile.id === user.id) return { error: { message: 'Du kannst dich nicht selbst hinzufügen.' } }
      const { data: existingRel } = await supabase.from('friendships').select('id,status').or(`and(requester_id.eq.${user.id},receiver_id.eq.${friendProfile.id}),and(requester_id.eq.${friendProfile.id},receiver_id.eq.${user.id})`)
      if (existingRel && existingRel.length > 0) {
        if (existingRel[0].status === 'accepted') return { error: { message: 'Ihr seid bereits Freunde!' } }
        if (existingRel[0].status === 'pending') return { error: { message: 'Es gibt bereits eine offene Anfrage.' } }
      }
      const { data, error } = await supabase.from('friendships').insert({ requester_id: user.id, receiver_id: friendProfile.id, status: 'pending' }).select().single()
      if (error) return { error: { message: error.message } }
      fetchFriends(); return { data, error: null }
    } catch (err) { return { error: { message: err.message || 'Unbekannter Fehler' } } }
  }
  const acceptFriend = async (friendshipId) => {
    try { const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId); if (!error) fetchFriends(); return { error } }
    catch (err) { return { error: { message: err.message } } }
  }
  const removeFriend = async (friendshipId) => {
    try { const { error } = await supabase.from('friendships').delete().eq('id', friendshipId); if (!error) fetchFriends(); return { error } }
    catch (err) { return { error: { message: err.message } } }
  }
  const nudgeFriend = async (friendId) => {
    if (!user) return { error: { message: 'Nicht eingeloggt' } }
    try { const { data, error } = await supabase.from('nudges').insert({ sender_id: user.id, receiver_id: friendId }).select().single(); return { data, error } }
    catch (err) { return { error: { message: err.message } } }
  }
  const createChallenge = async (challengeData) => {
    if (!user) return
    try {
      const { data, error } = await supabase.from('challenges').insert({
        challenger_id: user.id, opponent_id: challengeData.opponent_id, type: challengeData.type,
        target: challengeData.target || '', start_date: challengeData.start_date,
        end_date: challengeData.end_date, status: 'pending', stake_xp: challengeData.stake_xp || 0
      }).select().single()
      if (!error) fetchChallenges(); return { data, error }
    } catch (err) { return { error: { message: err.message } } }
  }
  const acceptChallenge = async (challengeId) => {
    const { error } = await supabase.from('challenges').update({ status: 'active' }).eq('id', challengeId)
    if (!error) fetchChallenges(); return { error }
  }
  const declineChallenge = async (challengeId) => {
    const { error } = await supabase.from('challenges').update({ status: 'declined' }).eq('id', challengeId)
    if (!error) fetchChallenges(); return { error }
  }
  return (
    <GameContext.Provider value={{ ...state, fetchTasks, fetchCompletions, fetchLeaderboard, fetchFriends, fetchChallenges, createTask, editTask, deleteTask, completeTask, addFriend, acceptFriend, removeFriend, nudgeFriend, createChallenge, acceptChallenge, declineChallenge, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}
const Pr = calculateLevel
export default GameContext
