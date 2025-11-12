// Enkel PKCE flow til Spotify Accounts (uden client secret)
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string
const SCOPES = (import.meta.env.VITE_SPOTIFY_SCOPES as string) || 'streaming user-read-playback-state user-modify-playback-state'

const LS_TOKEN_KEY = 'sp_token'
const LS_EXP_KEY = 'sp_token_exp'
const LS_VERIFIER = 'sp_code_verifier'

function buf2base64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/[+]/g, '-').replace(/[\/]/g, '_').replace(/=+$/, '')
}

async function sha256(plain: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return buf2base64Url(digest)
}

export function getStoredToken(): string | null {
  const token = localStorage.getItem(LS_TOKEN_KEY)
  const exp = Number(localStorage.getItem(LS_EXP_KEY) || 0)
  if (!token || Date.now() > exp) return null
  return token
}

export async function startLogin() {
  const random = crypto.getRandomValues(new Uint8Array(32))
  const verifier = buf2base64Url(random.buffer)
  localStorage.setItem(LS_VERIFIER, verifier)

  const challenge = await sha256(verifier)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES
  })
  window.location.assign('https://accounts.spotify.com/authorize?' + params.toString())
}

export async function handleRedirectAndGetToken(): Promise<string | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  if (!code) return getStoredToken()

  const verifier = localStorage.getItem(LS_VERIFIER) || ''

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  if (!res.ok) throw new Error('Token exchange failed')
  const data = await res.json() as { access_token: string; expires_in: number }
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000 // 60s margin

  localStorage.setItem(LS_TOKEN_KEY, data.access_token)
  localStorage.setItem(LS_EXP_KEY, String(expiresAt))

  // Fjern code fra URL'en
  try {
    const clean = REDIRECT_URI.replace('/callback','/')
    if (clean) window.history.replaceState({}, '', clean)
  } catch {}
  return data.access_token
}
