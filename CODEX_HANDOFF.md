# Codex Handoff: Hidden-UI Spotify Web Player (Vite + React + TypeScript)

This document gives Visual Studio Code's AI (e.g., GitHub Copilot Chat/Codex-like assistants) all the information it needs to take over this project and finish a minimal web app that **plays Spotify audio in the browser without displaying the track title/artist**.

> Language/locale: **Danish** (UI/notes can be in Danish).  
> Primary user: **Kenneth Damholt (@kda)**, Smallworld Nordic.  
> Date: 2025-11-12 (Europe/Copenhagen).

---

## 🎯 Mål (non-negotiables)

1. **Afspil Spotify direkte i browseren** via **Spotify Web Playback SDK** (Spotify Connect-enhed i browseren).
2. **Ingen sangmetadata i UI** (ingen titel, kunstner, cover, tidslinje). Kun kontrolknapper (Play/Pause/Next/Prev), volumen og en diskret **"Powered by Spotify"** badge.
3. **Spotify Premium påkrævet** for brugeren.
4. **Lovlig/korrekt brug**: OAuth PKCE, officielle SDK/Web API endpoints. Ingen caching/optagelse af lyd.
5. **Brugerinteraktion for lydstart** (overholder autoplay-politikker).

---

## 🧱 Stack & projektstruktur

- **Vite** + **React** + **TypeScript**
- Enkel **PKCE**-login mod Spotify Accounts (uden client secret)
- **Web Playback SDK** (`https://sdk.scdn.co/spotify-player.js`)
- **Spotify Web API** endpoints, scopes:  
  - `streaming`  
  - `user-read-playback-state`  
  - `user-modify-playback-state`

**Filer vi forventer i repoet (træ):**
```
my-spotify-player/
├─ .env.local                         # VITE_SPOTIFY_CLIENT_ID, VITE_SPOTIFY_REDIRECT_URI, VITE_SPOTIFY_SCOPES
├─ index.html
├─ vite.config.ts
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ styles.css
│  ├─ auth.ts                         # PKCE: startLogin(), handleRedirectAndGetToken(), getStoredToken()
│  └─ spotify.ts                      # load SDK, createPlayer(), transferPlayback(), startContext()/startTrackUris()
└─ package.json
```

---

## 🔐 Miljøvariabler

Opret **.env.local** i roden:
```
VITE_SPOTIFY_CLIENT_ID=DIN_CLIENT_ID_HER
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
VITE_SPOTIFY_SCOPES=streaming user-read-playback-state user-modify-playback-state
```

**Spotify Dashboard indstillinger:**
- App med **Client ID**.
- Redirect URI’er (mindst):
  - `http://localhost:5173/callback`
  - (valgfri) `http://localhost:5173/`

---

## 🚀 Init & scripts

```bash
# Opret projekt
npm create vite@latest my-spotify-player -- --template react-ts
cd my-spotify-player
npm install

# Start dev
npm run dev
```

---

## 🧭 Implementationsoverblik

### 1) OAuth PKCE (uden client secret)
- `startLogin()` genererer **code_verifier**, udleder **code_challenge** (S256) og sender brugeren til Spotify Accounts `/authorize` med scopes.
- Efter redirect til `/callback`, `handleRedirectAndGetToken()` POST’er til `/api/token` for at hente `access_token`. Token gemmes i `localStorage` med udløb.

### 2) Indlæsning af Web Playback SDK og oprettelse af player
- Indsæt `<script src="https://sdk.scdn.co/spotify-player.js">` dynamisk.
- Når `onSpotifyWebPlaybackSDKReady` fires, oprettes `new Spotify.Player({ name, getOAuthToken, volume })`.
- Lyt til events: `ready`, `initialization_error`, `authentication_error`, `account_error`.
- `player.connect()` registrerer browseren som en Spotify Connect-enhed; gem `device_id`.

### 3) Overførsel af afspilning og start af kontekst
- PUT `v1/me/player` med `device_ids: [device_id]` og `play: true` for at gøre browseren aktiv.
- PUT `v1/me/player/play?device_id=...` med **enten** `{ context_uri }` (fx playlist/album/artist-radio) **eller** `{ uris: [...] }` (enkelttracks).

### 4) Minimal UI uden metadata
- Knapper: **Login**, **Forbind afspiller**, **Start**, **Play/Pause**, **Next**, **Previous**, **Volume slider**.
- **Ingen** DOM-rendering af titel/kunstner/cover.
- Diskret **"Powered by Spotify"** badge i footer.

---

## ✅ Acceptkriterier (for AI-assistenten)

1. App kan logge ind via Spotify OAuth (PKCE) og få `access_token`.
2. Efter login: **Forbind afspiller** opretter en Web Playback SDK-enhed og viser ingen metadata.
3. **Start** knappen kan starte afspilning af en kontekst-URI (standardværdi givet i state), uden at vise metadata.
4. **Play/Pause**, **Next**, **Previous**, **Volume** virker.
5. Ingen fejl ved **non-Premium** udover tydelig besked.
6. Brandkrav: Badge med teksten “Powered by Spotify” vises altid et diskret sted.
7. Ingen persistering af lyd eller visning af trackdetails i UI.
8. Projektet kører via `npm run dev` og loader på `http://localhost:5173/`.

---

## 🧩 Code stubs (kopiér/tilpas)

### `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### `index.html`
```html
<!doctype html>
<html lang="da">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skjult Spotify-afspiller</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `src/main.tsx`
```ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### `src/styles.css`
```css
:root {
  --bg: #0b0c10;
  --panel: #15171c;
  --text: #e6e6e6;
  --accent: #1db954;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji;
  background: linear-gradient(180deg, #0b0c10 0%, #0f1117 100%);
  color: var(--text);
}
.app { min-height: 100svh; display: grid; place-items: center; padding: 24px; }
.card {
  width: 100%; max-width: 560px; background: var(--panel); border-radius: 16px; padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.06);
}
h1 { margin: 0 0 12px; font-size: 22px; }
p { margin: 8px 0 16px; opacity: .85; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.row > * { flex: 1 1 auto; }
button {
  background: #20232b; color: var(--text); border: 1px solid rgba(255,255,255,.12);
  padding: 10px 14px; border-radius: 12px; font-weight: 600; cursor: pointer;
}
button:hover { border-color: rgba(255,255,255,.25); }
button.primary { background: var(--accent); color: #0b0c10; border: none; }
input {
  background: #0f1218; color: var(--text); border: 1px solid rgba(255,255,255,.12);
  padding: 10px 12px; border-radius: 10px;
}
footer { margin-top: 16px; display: flex; align-items: center; gap: 8px; opacity: .85; font-size: 12px; }
.badge { display: inline-flex; align-items: center; gap: 8px; opacity: .9; }
.badge svg { width: 20px; height: 20px; }
.small { font-size: 12px; opacity: .8; }
hr { border: none; height: 1px; background: rgba(255,255,255,.08); margin: 16px 0; }
```

### `src/auth.ts` (PKCE)
```ts
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
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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
  const verifier = buf2base64Url(crypto.getRandomValues(new Uint8Array(32)))
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
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000

  localStorage.setItem(LS_TOKEN_KEY, data.access_token)
  localStorage.setItem(LS_EXP_KEY, String(expiresAt))

  window.history.replaceState({}, '', REDIRECT_URI.replace('/callback','/'))
  return data.access_token
}
```

### `src/spotify.ts` (SDK + helpers)
```ts
let sdkLoaded: Promise<void> | null = null

function loadSpotifySDK(): Promise<void> {
  if (sdkLoaded) return sdkLoaded
  sdkLoaded = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
    ;(window as any).onSpotifyWebPlaybackSDKReady = () => resolve()
  })
  return sdkLoaded
}

export async function createPlayer(accessToken: string) {
  await loadSpotifySDK()
  const { Player } = (window as any).Spotify
  const player = new Player({
    name: 'Skjult Web Player',
    getOAuthToken: (cb: (t: string) => void) => cb(accessToken),
    volume: 0.8
  })

  return new Promise<{ player: any; deviceId: string }>((resolve, reject) => {
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      resolve({ player, deviceId: device_id })
    })
    player.addListener('initialization_error', ({ message }: any) => reject(new Error(message)))
    player.addListener('authentication_error', ({ message }: any) => reject(new Error(message)))
    player.addListener('account_error', ({ message }: any) => reject(new Error(message)))
    player.connect()
  })
}

export async function transferPlayback(accessToken: string, deviceId: string, play = true) {
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId], play })
  })
}

export async function startContext(accessToken: string, deviceId: string, contextUri: string) {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ context_uri: contextUri })
  })
}

export async function startTrackUris(accessToken: string, deviceId: string, uris: string[]) {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris })
  })
}
```

### `src/App.tsx` (UI uden metadata)
```tsx
import { useEffect, useMemo, useState } from 'react'
import { getStoredToken, handleRedirectAndGetToken, startLogin } from './auth'
import { createPlayer, startContext, transferPlayback } from './spotify'

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [playlistUri, setPlaylistUri] = useState('spotify:playlist:37i9dQZF1DX4WgZiuR77Ef')

  useEffect(() => {
    (async () => {
      const t = await handleRedirectAndGetToken().catch(() => null)
      setToken(t || getStoredToken())
    })()
  }, [])

  const canControl = useMemo(() => token && player && deviceId, [token, player, deviceId])

  async function handleConnect() {
    if (!token) return
    const { player, deviceId } = await createPlayer(token)
    setPlayer(player)
    setDeviceId(deviceId)
    setConnected(true)
  }

  async function handleStart() {
    if (!token || !deviceId) return
    await transferPlayback(token, deviceId, true)
    await startContext(token, deviceId, playlistUri)
  }

  return (
    <div className="app">
      <div className="card">
        <h1>Skjult Spotify-afspiller</h1>
        <p className="small">
          Afspiller Spotify i browseren uden at vise sangtitel. Kræver Spotify Premium og et klik for at starte lyd.
        </p>

        {!token && (
          <div className="row">
            <button className="primary" onClick={startLogin}>Log ind med Spotify</button>
          </div>
        )}

        {token && !connected && (
          <div className="row">
            <button className="primary" onClick={handleConnect}>Forbind afspiller</button>
            <button onClick={() => { localStorage.clear(); location.reload() }}>Log ud</button>
          </div>
        )}

        {token && connected && (
          <>
            <div className="row">
              <input
                value={playlistUri}
                onChange={(e) => setPlaylistUri(e.target.value)}
                placeholder="spotify:playlist:..."
                aria-label="Spotify context URI"
              />
              <button className="primary" onClick={handleStart}>Start</button>
            </div>

            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={() => player?.togglePlay?.()}>Play/Pause</button>
              <button onClick={() => player?.previousTrack?.()}>Previous</button>
              <button onClick={() => player?.nextTrack?.()}>Next</button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.8}
                onChange={(e) => player?.setVolume?.(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
          </>
        )}

        <hr />
        <footer>
          <span className="badge" title="Powered by Spotify">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.512 10.512 0 0 0 12 1.5Zm4.8 14.947a.783.783 0 0 1-1.074.26c-2.938-1.793-6.64-2.2-10.989-1.21a.784.784 0 1 1-.343-1.529c4.733-1.063 8.796-.596 12.073 1.349a.783.783 0 0 1 .333 1.13Zm1.486-3.302a.98.98 0 0 1-1.344.326c-3.36-2.06-8.478-2.66-12.456-1.463a.98.98 0 0 1-.565-1.873c4.5-1.36 10.12-.69 13.9 1.6a.98.98 0 0 1 .465 1.41Zm.137-3.42a1.146 1.146 0 0 1-1.572.39c-3.84-2.36-10.27-2.575-13.971-1.43a1.146 1.146 0 0 1-.665-2.195c4.28-1.298 11.384-1.044 15.8 1.68a1.146 1.146 0 0 1 .408 1.555Z"/></svg>
            <span>Powered by Spotify</span>
          </span>
        </footer>
      </div>
    </div>
  )
}
```

---

## 🧪 Testguide

1. `npm run dev` → åbne i browser (typisk `http://localhost:5173/`).
2. **Log ind med Spotify** (scopes godkendes).
3. **Forbind afspiller** (kræver brugerklik for lyd).
4. Indsæt **context URI** (fx `spotify:playlist:...`) → **Start**.
5. Prøv **Play/Pause/Next/Prev/Volume**.
6. Bekræft at **ingen sangtitel/kunstner/cover** vises nogen steder.

---

## 🛠️ Fejlretning

- **Ingen lyd:** tjek Premium-konto og at enhed er aktiv (efter “Forbind afspiller”).  
- **Autoplay blokeret:** første lydstart kræver klik (vi har knapper).  
- **Token/redirect fejl:** redirect-URI i Dashboard skal matche `.env.local`.  
- **403/404 på playliste:** regionbegrænsning – test en anden URI.

---

## 💬 Prompt til VS Code Chat (kopiér/indsæt)

> *Rul projektet ud som ovenfor. Brug filstubberne og acceptkriterierne i denne README. Implementér Web Playback SDK, PKCE, og minimal UI uden metadata (ingen titel/kunstner/cover). Sørg for at "Powered by Spotify" badge er synlig. Efter implementering: kør dev-serveren, gennemfør login, forbind afspiller, start afspilning af en given `context_uri`. Løs eventuelle TypeScript-fejl og lav robuste fejlhåndteringer for ikke-Premium og manglende brugerinteraktion.*

---

## 📎 Noter om compliance

- Vis **ikke** sangmetadata i UI.  
- Brug **kun** officielle Spotify SDK/Web API.  
- Vis **"Powered by Spotify"**.  
- **Ingen** optagelse/caching af lydstrømmen.
