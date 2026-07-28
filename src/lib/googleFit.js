// Google Fit – Frontend-Helfer (sicher via Netlify Function)
// client_secret wird NIE an den Client gesendet.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Auto-Detect: lokal → localhost, Netlify → konfigurierte URI
const isNetlify = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com'))

const REDIRECT_URI = (() => {
  if (isNetlify()) {
    return (import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin) + '/auth/google/callback'
  }
  // Lokal: immer localhost + Callback-Pfad
  return window.location.origin + '/auth/google/callback'
})()

const SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read'
const NETLIFY_FN = '/.netlify/functions/google-token'

// 1. OAuth-Login starten
export function startGoogleFitLogin() {
  if (!CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID fehlt in .env')
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// 2. Code gegen Tokens tauschen
export async function exchangeCodeForTokens(code) {
  if (isNetlify()) {
    // Produktion: via Netlify Function (sicher, client_secret nie exponiert)
    const res = await fetch(NETLIFY_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, grant_type: 'authorization_code' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error_description || err.error || 'Token-Exchange fehlgeschlagen')
    }
    return res.json()
  }

  // Lokale Entwicklung: direkt (braucht VITE_GOOGLE_CLIENT_SECRET in .env)
  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ''
  if (!clientSecret) {
    throw new Error(
      'Lokal benötigst du VITE_GOOGLE_CLIENT_SECRET in .env.\n' +
      'Auf Netlify läuft der Exchange sicher über die Serverless Function.'
    )
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.error || 'Token-Exchange fehlgeschlagen')
  }
  return res.json()
}

// 3. Access Token per Refresh Token erneuern
export async function refreshAccessToken(refreshToken) {
  if (isNetlify()) {
    const res = await fetch(NETLIFY_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    })
    if (!res.ok) throw new Error('Token-Refresh fehlgeschlagen')
    return res.json()
  }

  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ''
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token-Refresh fehlgeschlagen')
  return res.json()
}

// 4. Schritte der letzten Tage abrufen
export async function getSteps(accessToken, daysBack = 7) {
  const endMs = Date.now()
  const startMs = endMs - daysBack * 24 * 60 * 60 * 1000

  const res = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: startMs,
        endTimeMillis: endMs,
      }),
    }
  )

  if (res.status === 401) throw new Error('TOKEN_EXPIRED')

  const data = await res.json()
  const dailySteps = []

  for (const bucket of data.bucket || []) {
    const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0]
    let steps = 0
    for (const ds of bucket.dataset || []) {
      for (const point of ds.point || []) {
        for (const val of point.value || []) {
          steps += val.intVal || Math.round(val.fpVal) || 0
        }
      }
    }
    dailySteps.push({ date, steps, provider: 'google_fit' })
  }

  return dailySteps
}

// 5. Token-Store via Supabase (cross-device persistence)
import { supabase } from './supabase'

export async function saveTokensToSupabase(accessToken, refreshToken, expiresIn) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('google_fit_tokens').upsert({
    user_id: user.id,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
  }, { onConflict: 'user_id' })

  // Zusätzlich lokal cachen für Offline-Zugriff
  localStorage.setItem('taskrpg_fit_local', JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Date.now() + expiresIn * 1000,
  }))
}

export async function loadTokensFromSupabase() {
  // Erst lokalen Cache prüfen
  try {
    const cached = JSON.parse(localStorage.getItem('taskrpg_fit_local') || 'null')
    if (cached && cached.expires_at > Date.now() + 5 * 60000) return cached
  } catch {}

  // Von Supabase laden
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase.from('google_fit_tokens')
    .select('*').eq('user_id', user.id).single()

  if (error || !data) return null

  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  }

  localStorage.setItem('taskrpg_fit_local', JSON.stringify(tokens))
  return tokens
}

export async function clearTokens() {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('google_fit_tokens').delete().eq('user_id', user.id)
  }
  localStorage.removeItem('taskrpg_fit_local')
}
