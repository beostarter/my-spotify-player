import { useEffect, useMemo, useState } from "react"
import { getStoredToken, handleRedirectAndGetToken, startLogin } from "./auth"
import { createPlayer, startContext, transferPlayback } from "./spotify"

const PREMIUM_NOTICE = "Spotify Premium er p\u00E5kr\u00E6vet for at bruge denne afspiller."

function formatErrorMessage(err: unknown) {
  if (!err) return "Ukendt fejl"
  if (typeof err === "string") return err
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return "Ukendt fejl"
  }
}

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [playlistUri, setPlaylistUri] = useState("spotify:playlist:37i9dQZF1DX4WgZiuR77Ef")
  const [status, setStatus] = useState("Ikke logget ind")
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    (async () => {
      const t = await handleRedirectAndGetToken().catch(() => null)
      const stored = t || getStoredToken()
      setToken(stored)
    })()
  }, [])

  useEffect(() => {
    if (!token) {
      setStatus("Ikke logget ind")
      setConnected(false)
      setPlayer(null)
      setDeviceId(null)
      return
    }
    setStatus("Logget ind - forbinder ikke endnu")
  }, [token])

  useEffect(() => {
    if (connected) {
      setStatus("Browseren er registreret som Spotify-enhed")
    }
  }, [connected])

  const canControl = useMemo(() => Boolean(token && player && deviceId), [token, player, deviceId])

  function handlePlayerError(message: string) {
    const msg = message.toLowerCase().includes("premium") ? PREMIUM_NOTICE : message
    setError(msg)
  }

  async function handleConnect() {
    if (!token) return
    setError(null)
    setIsConnecting(true)
    setStatus("Opretter Spotify-afspiller i browseren...")
    try {
      const { player, deviceId } = await createPlayer(token, handlePlayerError)
      setPlayer(player)
      setDeviceId(deviceId)
      setConnected(true)
    } catch (err) {
      const message = formatErrorMessage(err)
      handlePlayerError(message)
      setStatus("Kunne ikke forbinde afspilleren")
    } finally {
      setIsConnecting(false)
    }
  }

  async function handleStart() {
    if (!token || !deviceId) return
    setError(null)
    setIsStarting(true)
    setStatus("Sender afspilning til denne enhed...")
    try {
      await transferPlayback(token, deviceId, true)
      await startContext(token, deviceId, playlistUri)
      setStatus("Afspilning startet")
    } catch (err) {
      const message = formatErrorMessage(err)
      handlePlayerError(message)
      setStatus("Kunne ikke starte afspilning")
    } finally {
      setIsStarting(false)
    }
  }

  function handleLogout() {
    localStorage.clear()
    location.reload()
  }

  return (
    <div className="app">
      <div className="card">
        <h1>Skjult Spotify-afspiller</h1>
        <p className="small">
          Afspiller Spotify i browseren uden at vise metadata. Kr\u00E6ver Premium og et klik for at starte lyd.
        </p>

        {status && <p className="small">{status}</p>}
        {error && (
          <p className="small" role="alert" style={{ color: "#ff8383" }}>
            {error}
          </p>
        )}

        {!token && (
          <div className="row">
            <button className="primary" onClick={startLogin}>Log ind med Spotify</button>
          </div>
        )}

        {token && !connected && (
          <div className="row">
            <button className="primary" onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? "Forbinder..." : "Forbind afspiller"}
            </button>
            <button onClick={handleLogout}>Log ud</button>
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
              <button className="primary" onClick={handleStart} disabled={isStarting}>
                {isStarting ? "Starter..." : "Start"}
              </button>
            </div>

            <div className="row" style={{ marginTop: 8 }}>
              <button onClick={() => player?.togglePlay?.()} disabled={!canControl}>Play/Pause</button>
              <button onClick={() => player?.previousTrack?.()} disabled={!canControl}>Previous</button>
              <button onClick={() => player?.nextTrack?.()} disabled={!canControl}>Next</button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                defaultValue={0.8}
                onChange={(e) => player?.setVolume?.(Number(e.target.value))}
                aria-label="Volume"
                disabled={!canControl}
              />
            </div>
          </>
        )}

        <hr />
        <footer>
          <span className="badge" title="Powered by Spotify">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M12 1.5A10.5 10.5 0 1 0 22.5 12 10.512 10.512 0 0 0 12 1.5Zm4.8 14.947a.783.783 0 0 1-1.074.26c-2.938-1.793-6.64-2.2-10.989-1.21a.784.784 0 0 1-.343-1.529c4.733-1.063 8.796-.596 12.073 1.349a.783.783 0 0 1 .333 1.13Zm1.486-3.302a.98.98 0 0 1-1.344.326c-3.36-2.06-8.478-2.66-12.456-1.463a.98.98 0 0 1-.565-1.873c4.5-1.36 10.12-.69 13.9 1.6a.98.98 0 0 1 .465 1.41Zm.137-3.42a1.146 1.146 0 0 1-1.572.39c-3.84-2.36-10.27-2.575-13.971-1.43a1.146 1.146 0 0 1-.665-2.195c4.28-1.298 11.384-1.044 15.8 1.68a1.146 1.146 0 0 1 .408 1.555Z"
              />
            </svg>
            <span>Powered by Spotify</span>
          </span>
        </footer>
      </div>
    </div>
  )
}
