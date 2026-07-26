import { createClient } from '@supabase/supabase-js'

// Bereinigt [text](url)-Markdown-Format aus Env-Werten
function clean(val) {
  if (!val) return ''
  const m = String(val).match(/^\[(.+?)\]\(.*\)$/)
  return m ? m[1].trim() : String(val).trim()
}

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY)

if (!supabaseUrl || !supabaseAnonKey) console.warn('Supabase-Umgebungsvariablen fehlen!')

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
)

export const isSupabaseConfigured = () =>
  !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co'
