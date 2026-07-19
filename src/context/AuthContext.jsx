import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
const AuthContext = createContext({})
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [character, setCharacter] = useState(null)
  const dataLoadedRef = useRef(false)

  const loadCharacter = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId)
      if (!error && data && data.length > 0) {
        localStorage.setItem('taskrpg_char_' + userId, JSON.stringify(data[0]))
        return data[0]
      }
    } catch (e) { console.warn('Charakter DB:', e.message) }
    try {
      const cached = localStorage.getItem('taskrpg_char_' + userId)
      if (cached) return JSON.parse(cached)
    } catch (e) {}
    return null
  }, [])

  const loadProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (!error && data) return data
    } catch (e) { console.warn('Profil:', e.message) }
    return null
  }, [])

  const loadAllData = useCallback(async (userId) => {
    const [prof, char] = await Promise.all([loadProfile(userId), loadCharacter(userId)])
    setProfile(prof); setCharacter(char); dataLoadedRef.current = true
  }, [loadProfile, loadCharacter])

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return }
    let cancelled = false
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return
        if (session?.user) { setUser(session.user); await loadAllData(session.user.id) }
      } catch (e) { console.warn('Session Init:', e.message) }
      if (!cancelled) setLoading(false)
    }
    initAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        if (!dataLoadedRef.current) { setLoading(true); await loadAllData(session.user.id); setLoading(false) }
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setProfile(null); setCharacter(null); dataLoadedRef.current = false
      }
    })
    return () => { cancelled = true; subscription.unsubscribe() }
  }, [loadAllData])

  const signUp = async (email, password, username) => {
    if (!isSupabaseConfigured()) return { error: { message: 'Supabase nicht konfiguriert.' } }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
    if (!error && data.user) {
      try { await supabase.from('profiles').upsert({ id: data.user.id, username, avatar_url: '🧙‍♂️' }) } catch (e) {}
    }
    return { data, error }
  }
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured()) return { error: { message: 'Supabase nicht konfiguriert.' } }
    return await supabase.auth.signInWithPassword({ email, password })
  }
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) return { error: { message: 'Supabase nicht konfiguriert.' } }
    return await supabase.auth.resetPasswordForEmail(email)
  }
  const signOut = async () => { await supabase.auth.signOut() }
  const updateProfile = async (updates) => {
    if (!user) return { data: null, error: { message: 'Nicht eingeloggt' } }
    try {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
      if (!error && data) setProfile(data)
      return { data, error }
    } catch (e) { return { data: null, error: { message: e.message } } }
  }
  const updatePassword = async (newPassword) => await supabase.auth.updateUser({ password: newPassword })
  const createCharacter = async (characterData) => {
    if (!user) return { data: null, error: { message: 'Nicht eingeloggt.' } }
    try {
      const { data, error } = await supabase.from('characters').insert({
        user_id: user.id, name: characterData.name, class: characterData.charClass,
        stats: characterData.stats, level: 1, xp: 0
      }).select().single()
      if (error) return { data: null, error }
      setCharacter(data)
      localStorage.setItem('taskrpg_char_' + user.id, JSON.stringify(data))
      return { data, error: null }
    } catch (err) { return { data: null, error: { message: err.message } } }
  }
  const updateCharacter = async (updates) => {
    if (!user) return { data: null, error: { message: 'Nicht eingeloggt' } }
    try {
      const { data, error } = await supabase.from('characters').update(updates).eq('user_id', user.id).select().single()
      if (!error && data) { setCharacter(data); localStorage.setItem('taskrpg_char_' + user.id, JSON.stringify(data)) }
      return { data, error }
    } catch (e) { return { data: null, error: { message: e.message } } }
  }
  const setCharacterManual = useCallback((char) => {
    setCharacter(char)
    if (user && char) localStorage.setItem('taskrpg_char_' + user.id, JSON.stringify(char))
  }, [user])

  const reloadCharacter = useCallback(async () => {
    if (!user) return null
    const char = await loadCharacter(user.id)
    if (char) setCharacter(char)
    return char
  }, [user, loadCharacter])

  return (
    <AuthContext.Provider value={{ user, profile, character, loading, signUp, signIn, signOut, resetPassword, updateProfile, updatePassword, createCharacter, updateCharacter, setCharacterManual, reloadCharacter }}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden')
  return context
}
export default AuthContext
