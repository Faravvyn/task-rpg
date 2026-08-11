// Generic OAuth Token-Exchange – sicher via Netlify Function
// client_secret NIE im Frontend – nur hier serverseitig für Strava, Fitbit, Google Health.

const PROVIDER_CONFIG = {
  strava: {
    tokenUrl: 'https://www.strava.com/oauth/token',
    clientIdEnv: 'VITE_STRAVA_CLIENT_ID',
    secretEnv: 'STRAVA_CLIENT_SECRET',
  },
  fitbit: {
    tokenUrl: 'https://api.fitbit.com/oauth2/token',
    clientIdEnv: 'VITE_FITBIT_CLIENT_ID',
    secretEnv: 'FITBIT_CLIENT_SECRET',
    useBasicAuth: true,
  },
  google_health: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientIdEnv: 'VITE_GOOGLE_HEALTH_CLIENT_ID',
    secretEnv: 'GOOGLE_HEALTH_CLIENT_SECRET',
  },
}

export async function handler(event) {
  const origin = event.headers.origin || ''
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { provider, code, grant_type, refresh_token, redirect_uri } = JSON.parse(event.body)
    const cfg = PROVIDER_CONFIG[provider]

    if (!cfg) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Unbekannter Provider: ' + provider }) }
    }

    const clientId = process.env[cfg.clientIdEnv]
    const clientSecret = process.env[cfg.secretEnv]

    if (!clientId || !clientSecret) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Server-Konfiguration unvollständig für ' + provider }) }
    }

    const fetchHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' }
    let body

    if (cfg.useBasicAuth) {
      // Fitbit nutzt Basic Auth statt POST-Parameter
      fetchHeaders['Authorization'] = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      body = new URLSearchParams()
    } else {
      body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret })
    }

    if (grant_type === 'refresh_token') {
      body.append('refresh_token', refresh_token)
      body.append('grant_type', 'refresh_token')
    } else {
      body.append('code', code)
      body.append('redirect_uri', redirect_uri)
      body.append('grant_type', 'authorization_code')
    }

    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: fetchHeaders,
      body,
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`[oauth-token] ${provider} error:`, data)
      return { statusCode: res.status, headers: corsHeaders, body: JSON.stringify(data) }
    }

    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
  } catch (e) {
    console.error('[oauth-token] Internal error:', e.message)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: e.message }) }
  }
}
