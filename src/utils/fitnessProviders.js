// =====================================================================
// TaskRPG – Fitness-Provider-System
// Unterstützt: Google Fit, Strava, Health Connect (Android), manuelle Eingabe.
//
// Architektur:
//   Jeder Provider implementiert: { id, name, icon, connect(), disconnect(),
//   isConnected(), getSteps(startDate, endDate), getProfile() }
//
// Der FitnessManager orchestriert mehrere Provider und merged deren Daten.
// =====================================================================

// ---------------------------------------------------------------------
// OAuth-Helfer
// ---------------------------------------------------------------------
const OAUTH_STATE_KEY = 'taskrpg_oauth_state'

function generateState() {
  const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
  return state
}

function validateState(state) {
  const expected = sessionStorage.getItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  return state === expected
}

// ---------------------------------------------------------------------
// Token-Storage (provider-spezifisch)
// ---------------------------------------------------------------------
function tokenKey(providerId) { return `taskrpg_fitness_${providerId}` }

function loadTokens(providerId) {
  try {
    return JSON.parse(localStorage.getItem(tokenKey(providerId)) || 'null')
  } catch { return null }
}

function saveTokens(providerId, tokens) {
  localStorage.setItem(tokenKey(providerId), JSON.stringify(tokens))
}

function clearTokens(providerId) {
  localStorage.removeItem(tokenKey(providerId))
}

// ---------------------------------------------------------------------
// GOOGLE FIT PROVIDER
// ---------------------------------------------------------------------
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.location.read',
]

class GoogleFitProvider {
  id = 'google_fit'
  name = 'Google Fit'
  icon = '🏃'
  description = 'Synchronisiert mit deinem Google-Konto. Wird von Google bis 2026 supported, danach Umstieg auf Health Connect.'
  color = 'bg-blue-500'
  textColor = 'text-blue-400'

  // Hilfsfunktion: bereinigt Env-Werte von versehentlichem Markdown-Format
  _cleanEnv(val) {
    if (!val) return ''
    // Entferne [text](url)-Markdown – der eigentliche Wert steht in den ECKIGEN Klammern
    const m = val.match(/^\[(.+?)\]\(.*\)$/)
    if (m) return m[1].trim()
    return val.trim()
  }

  get clientId() {
    return this._cleanEnv(import.meta.env.VITE_GOOGLE_CLIENT_ID || '')
  }

  get clientSecret() {
    return this._cleanEnv(import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '')
  }

  get redirectUri() {
    // Auto: nutzt window.location.origin – funktioniert lokal UND auf Netlify
    // Überschreibbar via VITE_GOOGLE_REDIRECT_URI für Sonderfälle
    const configured = this._cleanEnv(import.meta.env.VITE_GOOGLE_REDIRECT_URI || '')
    return configured || window.location.origin
  }

  isAvailable() {
    // IMMER als verfügbar anzeigen – connect() gibt dann hilfreiche Fehlermeldung
    return true
  }

  isConnected() {
    const tokens = loadTokens(this.id)
    return !!(tokens?.access_token)
  }

  // OAuth-Flow – sicherer Redirect via Netlify Function (client_secret nie im Frontend!)
  // Lokal: VITE_GOOGLE_CLIENT_SECRET in .env, Produktion: Netlify-Function
  async connect() {
    if (!(import.meta.env.VITE_GOOGLE_CLIENT_ID || '')) {
      throw new Error(
        '🔧 Google Fit API-Key fehlt.\n\n' +
        'Trage in deine .env-Datei ein:\n' +
        'VITE_GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com\n' +
        'VITE_GOOGLE_CLIENT_SECRET=GOCSPX-dein-secret\n\n' +
        'Danach: npm run dev NEU STARTEN!'
      )
    }

    // Dynamischer Import – kein Circular-Dependency-Risiko
    const { startGoogleFitLogin } = await import('../lib/googleFit')
    startGoogleFitLogin()
    // Wird nie resolven – User wird zu Google weitergeleitet
    // Nach dem Callback kommt er auf /auth/google/callback zurück
    return new Promise(() => {})
  }

  // OAuth Callback verarbeiten (vom Redirect zurück)
  async handleCallback(code, state) {
    if (!validateState(state)) throw new Error('Ungültiger OAuth-State.')
    await this._exchangeCode(code)
  }

  async _exchangeCode(code) {
    // Nutzt den sicheren Exchange (lokal direkt, auf Netlify via Function)
    const { exchangeCodeForTokens, saveTokensToSupabase } = await import('../lib/googleFit')
    const tokens = await exchangeCodeForTokens(code)
    tokens.obtained_at = Date.now()
    // In Supabase speichern für Cross-Device + localStorage-Fallback
    await saveTokensToSupabase(tokens.access_token, tokens.refresh_token, tokens.expires_in || 3600)
    // Auch lokal für isConnected()-Check
    saveTokens(this.id, tokens)
    return tokens
  }

  async _refreshToken() {
    const tokens = loadTokens(this.id)
    if (!tokens?.refresh_token) throw new Error('Kein Refresh Token. Bitte erneut verbinden.')

    const { refreshAccessToken } = await import('../lib/googleFit')
    const newTokens = await refreshAccessToken(tokens.refresh_token)
    newTokens.refresh_token = tokens.refresh_token
    newTokens.obtained_at = Date.now()
    saveTokens(this.id, newTokens)
    return newTokens
  }

  async _getAccessToken() {
    const tokens = loadTokens(this.id)
    if (!tokens) throw new Error('Nicht verbunden.')

    // Access Token läuft nach 3600s ab, wir refreshen nach 3500s
    if (Date.now() - tokens.obtained_at > 3500 * 1000) {
      return (await this._refreshToken()).access_token
    }
    return tokens.access_token
  }

  disconnect() {
    // Google Fit hat keinen Revoke-Endpunkt für Fitness-Scopes,
    // aber wir können das Token löschen. Der Nutzer kann in seinem
    // Google-Konto unter "Drittanbieter-Apps" die Berechtigung entziehen.
    clearTokens(this.id)
  }

  // Schritt-Daten für einen Zeitraum abrufen
  async getSteps(startDate, endDate) {
    const token = await this._getAccessToken()

    // Google Fit dataset:aggregate erwartet MILLISEKUNDEN (nicht Nanos!)
    const body = {
      aggregateBy: [
        { dataTypeName: 'com.google.step_count.delta' },
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startDate.getTime(),
      endTimeMillis: endDate.getTime(),
    }

    const res = await fetch(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      console.error('[GoogleFit] API-Fehler:', res.status, errText)
      if (res.status === 401) {
        clearTokens(this.id)
        throw new Error('Google Fit-Session abgelaufen. Bitte neu verbinden.')
      }
      if (res.status === 403) {
        throw new Error('Keine Berechtigung für Fitness-Daten. Bitte in den Google-Einstellungen prüfen: myaccount.google.com/permissions')
      }
      throw new Error(`Google Fit API-Fehler ${res.status}: ${errText.slice(0, 100)}`)
    }

    const data = await res.json()
    console.log('[GoogleFit] Rohdaten:', JSON.stringify(data).slice(0, 500))
    return this._parseSteps(data)
  }

  _parseSteps(data) {
    const dailySteps = []

    for (const bucket of data.bucket || []) {
      // startTimeMillis kommt bereits in korrekten Millisekunden
      const date = new Date(parseInt(bucket.startTimeMillis))
      let steps = 0

      for (const ds of bucket.dataset || []) {
        for (const point of ds.point || []) {
          // Google Fit kann steps als intVal ODER fpVal speichern
          for (const val of point.value || []) {
            steps += val.intVal || Math.round(val.fpVal) || 0
          }
        }
      }

      dailySteps.push({
        date: date.toISOString().split('T')[0],
        steps,
        provider: 'google_fit',
      })
    }

    return dailySteps
  }

  async getProfile() {
    const token = await this._getAccessToken()
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Profil nicht abrufbar.')
    return res.json()
  }
}

// ---------------------------------------------------------------------
// STRAVA PROVIDER
// ---------------------------------------------------------------------

class StravaProvider {
  id = 'strava'
  name = 'Strava'
  icon = '🚴'
  description = 'Synchronisiere mit Strava für Lauf- und Fahrrad-Daten.'
  color = 'bg-orange-500'
  textColor = 'text-orange-400'

  get clientId() {
    return import.meta.env.VITE_STRAVA_CLIENT_ID || ''
  }

  get redirectUri() {
    return import.meta.env.VITE_STRAVA_REDIRECT_URI || window.location.origin + '/fitness/callback'
  }

  isAvailable() {
    return !!this.clientId
  }

  isConnected() {
    return !!loadTokens(this.id)?.access_token
  }

  async connect() {
    if (!this.clientId) {
      throw new Error(
        'Strava benötigt eine VITE_STRAVA_CLIENT_ID.\n\n' +
        'Erstelle eine App unter: https://www.strava.com/settings/api\n' +
        'Rückruf-URI: ' + this.redirectUri
      )
    }

    const state = generateState()
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      approval_prompt: 'force',
      scope: 'activity:read_all',
      state,
    })

    const authUrl = `https://www.strava.com/oauth/authorize?${params}`
    window.location.href = authUrl
  }

  async handleCallback(code, state) {
    if (!validateState(state)) throw new Error('Ungültiger OAuth-State.')

    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!res.ok) throw new Error('Strava Token-Austausch fehlgeschlagen.')
    const tokens = await res.json()
    tokens.obtained_at = Date.now()
    saveTokens(this.id, tokens)
    return tokens
  }

  async _refreshToken() {
    const tokens = loadTokens(this.id)
    if (!tokens?.refresh_token) throw new Error('Kein Refresh Token.')

    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET || '',
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) {
      clearTokens(this.id)
      throw new Error('Strava-Session abgelaufen.')
    }

    const newTokens = await res.json()
    newTokens.obtained_at = Date.now()
    saveTokens(this.id, newTokens)
    return newTokens
  }

  async getSteps(startDate, endDate) {
    const tokens = loadTokens(this.id)
    if (!tokens) throw new Error('Nicht verbunden.')

    if (Date.now() - tokens.obtained_at > tokens.expires_in * 1000) {
      await this._refreshToken()
    }

    const refreshed = loadTokens(this.id)
    const after = Math.floor(startDate.getTime() / 1000)

    // Strava gibt keine reinen Schritte – wir holen Activities und schätzen
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
      { headers: { Authorization: `Bearer ${refreshed.access_token}` } }
    )

    if (!res.ok) {
      if (res.status === 401) { clearTokens(this.id); throw new Error('Strava-Session abgelaufen.') }
      throw new Error('Strava API-Fehler.')
    }

    const activities = await res.json()
    const dailySteps = {}

    for (const activity of activities) {
      // Nur Lauf- und Wander-Aktivitäten
      if (['Run', 'Walk', 'Hike'].includes(activity.type)) {
        const date = activity.start_date.split('T')[0]
        // ~1.300 Schritte pro km (Durchschnitt)
        const estimatedSteps = Math.round((activity.distance || 0) / 1000 * 1300)
        dailySteps[date] = (dailySteps[date] || 0) + estimatedSteps
      }
    }

    return Object.entries(dailySteps).map(([date, steps]) => ({
      date, steps, provider: 'strava',
    }))
  }

  disconnect() {
    clearTokens(this.id)
  }

  async getProfile() {
    const tokens = loadTokens(this.id)
    const res = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (!res.ok) throw new Error('Profil nicht abrufbar.')
    return res.json()
  }
}

// ---------------------------------------------------------------------
// GOOGLE HEALTH API PROVIDER – Zukunftssicher (ersetzt Fit REST API)
// ---------------------------------------------------------------------
// Die Google Health API (developers.google.com/health) ist der offizielle
// Nachfolger der Google Fit REST API. Gleiche OAuth-Konsole, gleicher
// Flow, aber zukunftssicher – Google Fit wird Ende 2026 eingestellt.
//
// Setup: Gleiche Google Cloud Console wie Fit → APIs & Dienste →
// „Google Health API" aktivieren → OAuth-Client wiederverwenden.

class GoogleHealthProvider {
  id = 'google_health'
  name = 'Google Health'
  icon = '❤️‍🔥'
  description = 'Google Health API – offizieller Fit-Nachfolger. Zukunftssicher ab 2026.'
  color = 'bg-green-500'
  textColor = 'text-green-400'

  _cleanEnv(val) {
    if (!val) return ''
    const m = String(val).match(/^\[(.+?)\]\(.*\)$/)
    return m ? m[1].trim() : String(val).trim()
  }

  get clientId() {
    return this._cleanEnv(import.meta.env.VITE_GOOGLE_HEALTH_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '')
  }

  get clientSecret() {
    return this._cleanEnv(import.meta.env.VITE_GOOGLE_HEALTH_CLIENT_SECRET || import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '')
  }

  get redirectUri() {
    const configured = this._cleanEnv(import.meta.env.VITE_GOOGLE_HEALTH_REDIRECT_URI || import.meta.env.VITE_GOOGLE_REDIRECT_URI || '')
    return configured || window.location.origin
  }

  isAvailable() {
    return true // Immer anzeigen, connect() gibt ggf. Setup-Hinweise
  }

  isConnected() {
    const tokens = loadTokens(this.id)
    return !!(tokens?.access_token)
  }

  async connect() {
    if (!this.clientId) {
      throw new Error(
        '🔧 Google Health API-Key fehlt.\n\n' +
        '1. https://console.cloud.google.com\n' +
        '2. APIs & Dienste → „Google Health API" aktivieren\n' +
        '3. OAuth-Client-ID erstellen (Webanwendung)\n' +
        '4. In .env: VITE_GOOGLE_HEALTH_CLIENT_ID=...\n\n' +
        'Du kannst auch deine vorhandene Fit-Client-ID nutzen!'
      )
    }

    const state = generateState()
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/health.activity.read',
        'https://www.googleapis.com/auth/health.body.read',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

    return new Promise((resolve, reject) => {
      const popup = window.open(authUrl, 'google_health_auth', 'width=500,height=700')
      if (popup) {
        const interval = setInterval(() => {
          try {
            if (popup.closed) { clearInterval(interval); reject(new Error('Anmeldung abgebrochen.')); return }
            try {
              if (popup.location.href.startsWith(this.redirectUri)) {
                const url = new URL(popup.location.href)
                const code = url.searchParams.get('code')
                const err = url.searchParams.get('error')
                popup.close(); clearInterval(interval)
                if (err) { reject(new Error(`Google-Fehler: ${err}`)); return }
                if (!code || !validateState(url.searchParams.get('state'))) { reject(new Error('OAuth-Fehler')); return }
                this._exchangeCode(code).then(resolve).catch(reject)
              }
            } catch (e) { /* cross-origin */ }
          } catch (e) { clearInterval(interval); reject(e) }
        }, 500)
        setTimeout(() => { clearInterval(interval); if (!popup.closed) popup.close(); reject(new Error('Timeout (3 Min)')) }, 180000)
      } else {
        sessionStorage.setItem('taskrpg_fitness_pending', 'google_health')
        window.location.href = authUrl
      }
    })
  }

  async handleCallback(code, state) {
    if (!validateState(state)) throw new Error('Ungültiger OAuth-State.')
    await this._exchangeCode(code)
  }

  async _exchangeCode(code) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: this.clientId, client_secret: this.clientSecret, redirect_uri: this.redirectUri, grant_type: 'authorization_code' }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error_description || 'Token-Fehler') }
    const tokens = await res.json()
    tokens.obtained_at = Date.now()
    saveTokens(this.id, tokens)
    return tokens
  }

  async _refreshToken() {
    const tokens = loadTokens(this.id)
    if (!tokens?.refresh_token) throw new Error('Bitte erneut verbinden.')
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, refresh_token: tokens.refresh_token, grant_type: 'refresh_token' }),
    })
    if (!res.ok) { clearTokens(this.id); throw new Error('Session abgelaufen. Bitte neu verbinden.') }
    const newTokens = await res.json()
    newTokens.refresh_token = tokens.refresh_token
    newTokens.obtained_at = Date.now()
    saveTokens(this.id, newTokens)
    return newTokens
  }

  async _getAccessToken() {
    const tokens = loadTokens(this.id)
    if (!tokens) throw new Error('Nicht verbunden.')
    if (Date.now() - tokens.obtained_at > 3500 * 1000) return (await this._refreshToken()).access_token
    return tokens.access_token
  }

  disconnect() { clearTokens(this.id) }

  async getSteps(startDate, endDate) {
    const token = await this._getAccessToken()
    // Google Health API: Steps-Datentyp (Millisekunden!)
    const body = {
      aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startDate.getTime(),
      endTimeMillis: endDate.getTime(),
    }

    // Versuche zuerst neue Health API, fallback zu Fit API
    let res = await fetch('https://health.googleapis.com/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    // Fallback: klassische Fitness API (gleicher Token funktioniert)
    if (!res.ok) {
      console.warn('[GoogleHealth] Neue API nicht erreichbar, versuche Fit-API-Fallback')
      res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    if (!res.ok) {
      const errText = await res.text()
      if (res.status === 401) { clearTokens(this.id); throw new Error('Session abgelaufen.') }
      throw new Error(`API-Fehler ${res.status}: ${errText.slice(0, 150)}`)
    }

    const data = await res.json()
    const dailySteps = []
    for (const bucket of data.bucket || []) {
      const date = new Date(parseInt(bucket.startTimeMillis))
      let steps = 0
      for (const ds of bucket.dataset || []) {
        for (const point of ds.point || []) {
          for (const val of point.value || []) {
            steps += val.intVal || Math.round(val.fpVal) || 0
          }
        }
      }
      dailySteps.push({ date: date.toISOString().split('T')[0], steps, provider: 'google_health' })
    }
    return dailySteps
  }
}

// ---------------------------------------------------------------------
// HEALTH CONNECT (Android, offline – nur Info)
// ---------------------------------------------------------------------
class HealthConnectProvider {
  id = 'health_connect'
  name = 'Health Connect'
  icon = '❤️'
  description = 'Android Health Connect. Nur lokal auf dem Gerät – keine Web-API.'
  color = 'bg-green-500'
  textColor = 'text-green-400'
  isAvailable() { return false }
  isConnected() { return false }
  connect() { throw new Error('Health Connect ist nur für native Android-Apps.') }
  disconnect() {}
  async getSteps() { return [] }
}

// ---------------------------------------------------------------------
// MANUAL PROVIDER (immer verfügbar)
// ---------------------------------------------------------------------

class ManualProvider {
  id = 'manual'
  name = 'Manuelle Eingabe'
  icon = '✍️'
  description = 'Trage deine Schritte selbst ein – z.B. von deinem Schrittzähler oder Smartphone.'
  color = 'bg-gray-500'
  textColor = 'text-gray-400'

  isAvailable() { return true }
  isConnected() { return true }
  connect() { return Promise.resolve() }
  disconnect() {} // Manuelle Eingabe kann nicht deaktiviert werden

  async getSteps(startDate, endDate) {
    // Manuell eingegebene Schritte aus localStorage lesen
    try {
      const manual = JSON.parse(localStorage.getItem('taskrpg_manual_steps') || '{}')
      const result = []
      const d = new Date(startDate)
      while (d <= endDate) {
        const key = d.toISOString().split('T')[0]
        if (manual[key]) {
          result.push({ date: key, steps: manual[key], provider: 'manual' })
        }
        d.setDate(d.getDate() + 1)
      }
      return result
    } catch { return [] }
  }

  // Manuelle Schritte für heute speichern
  static setTodaySteps(steps) {
    const today = new Date().toISOString().split('T')[0]
    const manual = JSON.parse(localStorage.getItem('taskrpg_manual_steps') || '{}')
    manual[today] = steps
    localStorage.setItem('taskrpg_manual_steps', JSON.stringify(manual))
  }

  static getTodaySteps() {
    try {
      const manual = JSON.parse(localStorage.getItem('taskrpg_manual_steps') || '{}')
      const today = new Date().toISOString().split('T')[0]
      return manual[today] || 0
    } catch { return 0 }
  }
}

// ---------------------------------------------------------------------
// APPLE HEALTH PROVIDER (Hinweis)
// ---------------------------------------------------------------------

class AppleHealthProvider {
  id = 'apple_health'
  name = 'Apple Health'
  icon = '🍎'
  description = 'Apple HealthKit ist nur in nativen iOS-Apps verfügbar. In der PWA nicht nutzbar.'
  color = 'bg-red-500'
  textColor = 'text-red-400'

  isAvailable() { return false }
  isConnected() { return false }
  connect() {
    throw new Error('Apple Health kann nur in einer nativen iOS-App genutzt werden, nicht im Browser.')
  }
  disconnect() {}
  async getSteps() { return [] }
}

// ---------------------------------------------------------------------
// FITBIT PROVIDER (Hinweis – Zukunft)
// ---------------------------------------------------------------------

class FitbitProvider {
  id = 'fitbit'
  name = 'Fitbit'
  icon = '⌚'
  description = 'Verbinde dein Fitbit-Konto. Erfordert eine Fitbit-Developer-App.'
  color = 'bg-cyan-500'
  textColor = 'text-cyan-400'

  get clientId() { return import.meta.env.VITE_FITBIT_CLIENT_ID || '' }

  isAvailable() { return !!this.clientId }
  isConnected() { return !!loadTokens(this.id)?.access_token }

  async connect() {
    if (!this.clientId) {
      throw new Error('Fitbit benötigt VITE_FITBIT_CLIENT_ID. Registriere eine App unter https://dev.fitbit.com')
    }

    const state = generateState()
    const redirectUri = import.meta.env.VITE_FITBIT_REDIRECT_URI || window.location.origin + '/fitness/callback'
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'activity',
      state,
    })

    window.location.href = `https://www.fitbit.com/oauth2/authorize?${params}`
  }

  async handleCallback(code, state) {
    if (!validateState(state)) throw new Error('Ungültiger OAuth-State.')

    const redirectUri = import.meta.env.VITE_FITBIT_REDIRECT_URI || window.location.origin + '/fitness/callback'
    const basicAuth = btoa(`${this.clientId}:${import.meta.env.VITE_FITBIT_CLIENT_SECRET || ''}`)

    const res = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    })

    if (!res.ok) throw new Error('Fitbit Token-Austausch fehlgeschlagen.')
    const tokens = await res.json()
    tokens.obtained_at = Date.now()
    saveTokens(this.id, tokens)
    return tokens
  }

  async getSteps(startDate, endDate) {
    const tokens = loadTokens(this.id)
    if (!tokens) throw new Error('Nicht verbunden.')
    if (Date.now() - tokens.obtained_at > tokens.expires_in * 1000) {
      // Fitbit Refresh (vereinfacht – in Produktion korrekt implementieren)
      clearTokens(this.id)
      throw new Error('Fitbit-Token abgelaufen. Bitte neu verbinden.')
    }

    const res = await fetch(
      `https://api.fitbit.com/1/user/-/activities/steps/date/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}.json`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )

    if (!res.ok) throw new Error('Fitbit API-Fehler.')
    const data = await res.json()

    return (data['activities-steps'] || []).map(d => ({
      date: d.dateTime,
      steps: parseInt(d.value) || 0,
      provider: 'fitbit',
    }))
  }

  disconnect() { clearTokens(this.id) }
}

// ---------------------------------------------------------------------
// FITNESS MANAGER – orchestriert alle Provider
// ---------------------------------------------------------------------

const ALL_PROVIDERS = [
  new GoogleFitProvider(),
  new GoogleHealthProvider(),
  new StravaProvider(),
  new HealthConnectProvider(),
  new FitbitProvider(),
  new AppleHealthProvider(),
  new ManualProvider(),
]

const providerMap = Object.fromEntries(ALL_PROVIDERS.map(p => [p.id, p]))

export function getProvider(id) {
  return providerMap[id] || null
}

export function getAvailableProviders() {
  return ALL_PROVIDERS.filter(p => p.isAvailable())
}

export function getConnectedProviders() {
  return ALL_PROVIDERS.filter(p => p.isAvailable() && p.isConnected())
}

export { ManualProvider, ALL_PROVIDERS }

// OAuth-Callback-Handler (wird nach Redirect aufgerufen)
export async function handleOAuthCallback(searchParams) {
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    throw new Error(`OAuth-Fehler: ${error}`)
  }

  if (!code) {
    throw new Error('Kein Auth-Code in der Antwort.')
  }

  // Herausfinden, welcher Provider die Anfrage gestartet hat
  const pending = sessionStorage.getItem('taskrpg_fitness_pending')
  sessionStorage.removeItem('taskrpg_fitness_pending')

  // Fallback: Typ anhand des State-Prefixes erkennen
  let providerId = pending

  if (!providerId) {
    // Google und Strava haben unterschiedliche State-Formate
    // Wir probieren beide (nur einer wird funktionieren)
    throw new Error(
      'Kein aktiver Verbindungsversuch gefunden. Bitte starte die Verbindung erneut.'
    )
  }

  const provider = getProvider(providerId)
  if (!provider || !provider.handleCallback) {
    throw new Error(`Provider "${providerId}" unterstützt keinen OAuth-Callback.`)
  }

  await provider.handleCallback(code, state)
  return provider
}

// Schritte von allen verbundenen Providern für einen Zeitraum holen
export async function fetchStepsFromAllProviders(startDate, endDate) {
  const connected = getConnectedProviders()
    .filter(p => p.id !== 'manual') // Manuelle separat

  if (connected.length === 0) {
    // Nur manuelle Daten
    const manual = new ManualProvider()
    return await manual.getSteps(startDate, endDate)
  }

  const results = await Promise.allSettled(
    connected.map(p => p.getSteps(startDate, endDate).catch(e => {
      console.warn(`[Fitness] ${p.name}:`, e.message)
      return []
    }))
  )

  // Alle Ergebnisse mergen (pro Tag den Maximalwert nehmen – vermeidet Doppelzählung)
  const dailyMax = {}
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const entry of result.value) {
        dailyMax[entry.date] = Math.max(dailyMax[entry.date] || 0, entry.steps)
      }
    }
  }

  return Object.entries(dailyMax).map(([date, steps]) => ({ date, steps }))
}

export default {
  getProvider,
  getAvailableProviders,
  getConnectedProviders,
  handleOAuthCallback,
  fetchStepsFromAllProviders,
  ALL_PROVIDERS,
}
