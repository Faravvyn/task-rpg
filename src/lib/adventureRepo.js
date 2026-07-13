// =====================================================================
// adventureRepo – Datenzugriffs-Schicht für den Adventure-Mode.
// Kapselt Supabase-Zugriffe (wenn konfiguriert). Bei fehlender Supabase-
// Konfiguration liefern die Funktionen leere/neutrale Werte, sodass der
// Context auf localStorage zurückfällt.
// =====================================================================
import { supabase, isSupabaseConfigured } from './supabase'

export const useRemote = () => isSupabaseConfigured()

// ---- Mapping DB-Row <-> State-Item -----------------------------------
export function rowToInvItem(row) {
  return {
    uid: row.id, artifactId: row.artifact_id,
    equipped: !!row.is_equipped, protected: !!row.is_protected,
    obtainedAt: row.obtained_at, source: row.source || 'quest',
    expiresAt: row.expires_at || null,
  }
}

// ---------------------------------------------------------------------
// INVENTAR
// ---------------------------------------------------------------------
export async function fetchInventory(userId) {
  const { data, error } = await supabase
    .from('character_artifacts').select('*').eq('user_id', userId)
  if (error) { console.warn('Inventar:', error.message); return [] }
  return (data || []).map(rowToInvItem)
}

export async function insertArtifact(userId, artifactId, source = 'quest', expiresAt = null) {
  const { data, error } = await supabase.from('character_artifacts')
    .insert({ user_id: userId, artifact_id: artifactId, source, expires_at: expiresAt }).select().single()
  if (error) { console.warn('Artefakt insert:', error.message); return null }
  return rowToInvItem(data)
}

export async function insertArtifacts(userId, artifactIds, source = 'quest') {
  if (!artifactIds.length) return []
  const rows = artifactIds.map((artifact_id) => ({ user_id: userId, artifact_id, source }))
  const { data, error } = await supabase.from('character_artifacts').insert(rows).select()
  if (error) { console.warn('Artefakte insert:', error.message); return [] }
  return (data || []).map(rowToInvItem)
}

export async function updateArtifact(uid, patch) {
  const dbPatch = {}
  if ('equipped' in patch) dbPatch.is_equipped = patch.equipped
  if ('protected' in patch) dbPatch.is_protected = patch.protected
  const { error } = await supabase.from('character_artifacts').update(dbPatch).eq('id', uid)
  if (error) console.warn('Artefakt update:', error.message)
}

export async function deleteArtifacts(uids) {
  if (!uids.length) return
  const { error } = await supabase.from('character_artifacts').delete().in('id', uids)
  if (error) console.warn('Artefakt delete:', error.message)
}

// ---------------------------------------------------------------------
// BOSS
// ---------------------------------------------------------------------
export async function fetchBoss(userId, weekStart) {
  const [{ data: bossRow }, { data: dmgRow }] = await Promise.all([
    supabase.from('weekly_boss').select('*').eq('week_start', weekStart).maybeSingle(),
    supabase.from('boss_damage').select('*').eq('user_id', userId).eq('week_start', weekStart).maybeSingle(),
  ])
  return { bossRow: bossRow || null, dmgRow: dmgRow || null }
}

// Schaden via RPC (atomar, legt Boss an wenn nötig)
export async function attackBoss({ weekStart, name, icon, maxHp, damage }) {
  const { data, error } = await supabase.rpc('attack_boss', {
    p_week: weekStart, p_name: name, p_icon: icon, p_max_hp: maxHp, p_damage: damage,
  })
  if (error) { console.warn('attack_boss:', error.message); return null }
  return Array.isArray(data) ? data[0] : data
}

export async function markBossLooted(userId, weekStart) {
  const { error } = await supabase.from('boss_damage')
    .update({ looted: true }).eq('user_id', userId).eq('week_start', weekStart)
  if (error) console.warn('Boss looted:', error.message)
}

// ---------------------------------------------------------------------
// ARENA
// ---------------------------------------------------------------------
export async function fetchArena(userId, weekStart) {
  const { data, error } = await supabase.from('arena_results')
    .select('*').eq('user_id', userId).eq('week_start', weekStart)
    .order('created_at', { ascending: false })
  if (error) { console.warn('Arena:', error.message); return [] }
  return data || []
}

export async function insertArenaResult(userId, { opponentId, opponentName, won, stakeArtifactId, weekStart }) {
  const { data, error } = await supabase.from('arena_results').insert({
    user_id: userId, opponent_id: opponentId || null, opponent_name: opponentName,
    won, stake_artifact_id: stakeArtifactId || null, week_start: weekStart,
  }).select().single()
  if (error) { console.warn('Arena insert:', error.message); return null }
  return data
}

// ---------------------------------------------------------------------
// SONDERQUESTS
// ---------------------------------------------------------------------
export async function fetchQuestCompletions(userId) {
  const { data, error } = await supabase.from('quest_completions').select('*').eq('user_id', userId)
  if (error) { console.warn('Quest-Completions:', error.message); return [] }
  return (data || []).map((r) => ({
    instanceId: r.instance_id, quest_id: r.quest_id,
    completedAt: r.completed_at, xpGained: r.xp_gained, artifactId: r.artifact_id,
  }))
}

export async function insertQuestCompletion(userId, { instanceId, questId, xpGained, artifactId }) {
  const { error } = await supabase.from('quest_completions').insert({
    user_id: userId, instance_id: instanceId, quest_id: questId,
    xp_gained: xpGained, artifact_id: artifactId || null,
  })
  if (error) console.warn('Quest-Completion insert:', error.message)
}

// ---------------------------------------------------------------------
// FREUNDES-QUESTS
// ---------------------------------------------------------------------
export async function fetchFriendTasks(userId) {
  const { data, error } = await supabase.from('friend_tasks').select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) { console.warn('Friend-Tasks:', error.message); return [] }
  return data || []
}

export async function insertFriendTask(task) {
  const isCustom = task.quest_id === '__custom__'
  // Basis-Payload (immer vorhanden)
  const base = {
    sender_id: task.sender_id, receiver_id: task.receiver_id,
    sender_name: task.sender_name, receiver_name: task.receiver_name || null,
    quest_id: task.quest_id,
    mode: task.mode, message: task.message || null,
    stake_xp: task.stake_xp || 0, status: 'pending',
  }
  // Custom-Felder nur senden, wenn es wirklich eine eigene Quest ist
  const withCustom = isCustom
    ? { ...base, custom_title: task.custom_title || null, custom_description: task.custom_description || null }
    : base

  let { data, error } = await supabase.from('friend_tasks').insert(withCustom).select().single()
  // Fallback: ältere DB ohne custom_*-Spalten (PGRST204 = column not found)
  if (error && isCustom && /custom_/.test(error.message || '')) {
    const merged = task.custom_description
      ? `${task.custom_title}\n${task.custom_description}`
      : (task.custom_title || 'Eigene Quest')
    const legacy = { ...base, message: task.message ? `${task.message} — ${merged}` : merged }
    ;({ data, error } = await supabase.from('friend_tasks').insert(legacy).select().single())
  }
  if (error) return { error }
  return { data }
}

export async function updateFriendTaskStatus(id, status) {
  const { error } = await supabase.from('friend_tasks').update({ status }).eq('id', id)
  if (error) console.warn('Friend-Task update:', error.message)
}

// Empfänger schließt ab -> beide bekommen XP (RPC, SECURITY DEFINER)
export async function completeFriendTaskRpc(taskId) {
  const { data, error } = await supabase.rpc('complete_friend_task', { p_task_id: taskId })
  if (error) { console.warn('complete_friend_task:', error.message); return { error } }
  const row = Array.isArray(data) ? data[0] : data
  return { reward: row?.reward ?? 0 }
}

// Realtime-Abo für eingehende/ausgehende Freundes-Quests
export function subscribeFriendTasks(userId, onChange) {
  const channel = supabase.channel(`friend_tasks_${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_tasks', filter: `receiver_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_tasks', filter: `sender_id=eq.${userId}` }, onChange)
    .subscribe()
  return () => { try { supabase.removeChannel(channel) } catch { /* ignore */ } }
}

// ---------------------------------------------------------------------
// MONSTER SYSTEM
// ---------------------------------------------------------------------
export async function fetchUserMonsters(userId) {
  const { data, error } = await supabase.from('user_monsters').select('*').eq('user_id', userId).order('caught_at', { ascending: false })
  if (error) { console.warn('User Monsters:', error.message); return [] }
  return data || []
}

export async function insertUserMonster(userId, monsterId, stats, moves, nickname = null) {
  const { data, error } = await supabase.from('user_monsters').insert({
    user_id: userId, monster_id: monsterId, stats, moves, nickname
  }).select().single()
  if (error) { console.warn('Monster catch error:', error.message); return null }
  return data
}

export async function fetchUserTeam(userId) {
  const { data, error } = await supabase.from('user_teams').select('*').eq('user_id', userId).maybeSingle()
  if (error) { console.warn('User Team fetch:', error.message); return null }
  return data
}

export async function upsertUserTeam(userId, slots) {
  const { error } = await supabase.from('user_teams').upsert({
    user_id: userId, ...slots, updated_at: new Date().toISOString()
  })
  if (error) console.warn('User Team upsert:', error.message)
}

// ---------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------
export async function fetchUserAchievements(userId) {
  if (!userId) return []
  const { data, error } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId)
  if (error) { 
    if (error.code === 'PGRST301' || error.status === 401) return [] // Session invalid/expired
    console.warn('Achievements:', error.message); 
    return [] 
  }
  return (data || []).map(r => r.achievement_id)
}

export async function insertUserAchievement(userId, achievementId) {
  const { error } = await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: achievementId })
  if (error && error.code !== '23505') console.warn('Achievement insert:', error.message)
}

// ---------------------------------------------------------------------
// LOADOUT
// ---------------------------------------------------------------------
export async function fetchLoadout(userId, weekStart) {
  const { data, error } = await supabase.from('user_loadout').select('slots').eq('user_id', userId).eq('week_start', weekStart).maybeSingle()
  if (error) { console.warn('Loadout:', error.message); return null }
  return data?.slots || null
}

export async function upsertLoadout(userId, weekStart, slots) {
  const { error } = await supabase.from('user_loadout').upsert({ user_id: userId, week_start: weekStart, slots, updated_at: new Date().toISOString() })
  if (error) console.warn('Loadout upsert:', error.message)
}

export async function updateMonster(monsterUid, updates) {
  const { error } = await supabase.from('user_monsters').update(updates).eq('id', monsterUid)
  if (error) console.warn('Monster update:', error.message)
}

export async function releaseMonster(monsterUid) {
  const { error } = await supabase.from('user_monsters').delete().eq('id', monsterUid)
  if (error) console.warn('Monster release:', error.message)
}

// Wöchentliche Arena-Siege je Spieler (für Leaderboard-Wertung)
// Gibt eine Map { user_id: winCount } zurück.
export async function fetchArenaWinCounts(weekStart) {
  const { data, error } = await supabase.from('arena_results')
    .select('user_id, won').eq('week_start', weekStart).eq('won', true)
  if (error) { console.warn('Arena-Wins:', error.message); return {} }
  const counts = {}
  for (const row of data || []) counts[row.user_id] = (counts[row.user_id] || 0) + 1
  return counts
}