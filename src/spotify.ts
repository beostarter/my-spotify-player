let sdkLoaded: Promise<void> | null = null

type PlayerErrorHandler = (message: string) => void

function loadSpotifySDK(): Promise<void> {
  if (sdkLoaded) return sdkLoaded
  sdkLoaded = new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)
    ;(window as any).onSpotifyWebPlaybackSDKReady = () => resolve()
  })
  return sdkLoaded
}

function resolveSpotifyErrorMessage(error: any, fallback: string) {
  if (!error) return fallback
  if (typeof error === "string") return error
  if (typeof error === "object") {
    if (error?.error?.message) return error.error.message
    if (error.message) return error.message
  }
  return fallback
}

async function spotifyFetch(accessToken: string, url: string, init: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const data = await res.json()
      message = resolveSpotifyErrorMessage(data, message)
    } catch {
      // JSON parse fejl ignoreres her
    }
    throw new Error(message || "Spotify API-fejl")
  }

  return res
}

export async function createPlayer(accessToken: string, onError?: PlayerErrorHandler) {
  await loadSpotifySDK()
  const { Player } = (window as any).Spotify
  const player = new Player({
    name: "Skjult Web Player",
    getOAuthToken: (cb: (t: string) => void) => cb(accessToken),
    volume: 0.8,
  })

  return new Promise<{ player: any; deviceId: string }>((resolve, reject) => {
    let settled = false

    const forwardError = (message: string) => {
      onError?.(message)
      if (!settled) {
        settled = true
        reject(new Error(message))
      }
    }

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      settled = true
      resolve({ player, deviceId: device_id })
    })

    player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
      console.warn("Spotify-enhed gik offline", device_id)
      onError?.("Browserens Spotify-enhed er midlertidigt offline. Pr\u00F8v at forbinde igen.")
    })

    ;["initialization_error", "authentication_error", "account_error", "playback_error"].forEach((event) => {
      player.addListener(event, ({ message }: any) => forwardError(message))
    })

    player.connect()
  })
}

export async function transferPlayback(accessToken: string, deviceId: string, play = true) {
  await spotifyFetch(accessToken, "https://api.spotify.com/v1/me/player", {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play }),
  })
}

export async function startContext(accessToken: string, deviceId: string, contextUri: string) {
  await spotifyFetch(
    accessToken,
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ context_uri: contextUri }),
    },
  )
}

export async function startTrackUris(accessToken: string, deviceId: string, uris: string[]) {
  await spotifyFetch(
    accessToken,
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      body: JSON.stringify({ uris }),
    },
  )
}
