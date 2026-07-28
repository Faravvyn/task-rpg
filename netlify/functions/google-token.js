// Netlify Serverless Function – sicherer Token-Exchange für Google OAuth
// client_secret NIE im Frontend, nur hier serverseitig verfügbar.
export async function handler(event) {
  const origin = event.headers.origin || event.headers.referer || ''
  const allowedOrigins = [
    process.env.URL || '',
    'http://localhost:5173',
    'http://localhost:8888',
  ]

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.some(o => o && origin.startsWith(o)) ? origin : '*',
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
    const { code, grant_type, refresh_token } = JSON.parse(event.body)

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.VITE_GOOGLE_REDIRECT_URI || process.env.URL || ''

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Server-Konfiguration unvollstaendig' }),
      }
    }

    const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret })

    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'refresh_token fehlt' }) }
      }
      params.append('refresh_token', refresh_token)
      params.append('grant_type', 'refresh_token')
    } else {
      if (!code) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'code fehlt' }) }
      }
      params.append('code', code)
      params.append('redirect_uri', redirectUri)
      params.append('grant_type', 'authorization_code')
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[google-token] Google error:', data.error)
      return { statusCode: res.status, headers: corsHeaders, body: JSON.stringify(data) }
    }

    return { statusCode: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
  } catch (e) {
    console.error('[google-token] Internal error:', e.message)
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: e.message }) }
  }
}
