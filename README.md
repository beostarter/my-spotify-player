# my-spotify-player

Minimal Vite + React + TypeScript app, der afspiller Spotify i browseren **uden** at vise sangmetadata. Kræver Spotify Premium.

## Opsætning

1) Opret app på https://developer.spotify.com/dashboard og kopier **Client ID**.  
2) Tilføj redirect-URI’er i app-indstillinger:
   - `http://localhost:5173/callback`
   - (valgfri) `http://localhost:5173/`

3) Opret `.env.local` i projektroden:
```
VITE_SPOTIFY_CLIENT_ID=DIN_CLIENT_ID_HER
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
VITE_SPOTIFY_SCOPES=streaming user-read-playback-state user-modify-playback-state
```

## Kørsel
```bash
npm install
npm run dev
```

Åbn den viste URL (typisk `http://localhost:5173/`), log ind, forbind afspiller og start en `spotify:playlist:...` context URI.

> Der vises ikke titel/kunstner/cover. Kun kontrolknapper og “Powered by Spotify” badge.
