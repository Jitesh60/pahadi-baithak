# Private library server

Paste a YouTube link in the app's **लाइब्रेरी** (Library) tab. This server downloads the audio as MP3 with yt-dlp and stores it in a **private** Cloudflare R2 bucket. After that the song plays from your own copy, with no ads.

This is for **personal listening only**. The bucket has no public URL. The app gets play links that expire after 12 hours, and only someone holding your key can see the Library tab or add songs. Share links and listen-together still send friends the YouTube version.

## 1. Cloudflare R2 (private bucket)

1. Go to Cloudflare → **R2** → **Create bucket** and name it `pahadi-music`.
   Do **not** turn on the public `r2.dev` URL or a custom domain.
2. Go to R2 → **Manage API tokens** → **Create Account API token**:
   - Permission: **Object Read & Write**
   - Bucket: `pahadi-music` only
3. Keep the **Access Key ID**, **Secret Access Key** and the endpoint (`https://<account-id>.r2.cloudflarestorage.com`).
   They go in the server's `.env` file only. Never put them in chat or git.

## 2. Run it on your server (Docker)

```sh
cd ~/pahadi-baithak && git pull
cd server
cp .env.example .env
openssl rand -base64 36        # copy this into LIBRARY_TOKEN
nano .env                      # fill in the token, R2 values and your site URL
docker compose up -d --build
curl localhost:8787/health     # {"ok":true}
```

The site is served over HTTPS, so it can only call an HTTPS API. Expose the server with Cloudflare Tunnel:

```sh
cloudflared tunnel --url http://localhost:8787   # prints https://<random>.trycloudflare.com
```

A quick tunnel's URL changes every time it restarts. For a URL that stays the same, create a named tunnel on your own domain (Cloudflare → Zero Trust → Networks → Tunnels).

## 3. Point the site at it

1. In Netlify, go to **Site configuration → Environment variables** and add:
   `VITE_LIBRARY_API = https://<your-tunnel-url>`
2. Redeploy.
3. Put the site's address in `ALLOWED_ORIGINS` in `.env`, then run `docker compose up -d` again.

## 4. Unlock it on your phone or laptop

Open this once on each device:

```
https://<your-site>/#key=<LIBRARY_TOKEN>
```

The part after `#` never leaves the browser, so it isn't logged anywhere. The app saves the key on that device and removes it from the address bar.

After that the song list has a **लाइब्रेरी** tab. Paste a link and press **जोड़ें**. It takes about half a minute.

To remove the key from a device, tap **इस डिवाइस से हटाएँ**. If the key ever leaks, change `LIBRARY_TOKEN` and restart the server.

## When YouTube says no

- **"confirm you're not a bot" / "sign in"**: YouTube sometimes blocks cloud servers.
  1. Export your YouTube cookies with a "Get cookies.txt" browser extension.
  2. Save them as `server/cookies.txt`.
  3. Set `YTDLP_COOKIES=/app/cookies.txt` in `.env`.
  4. Uncomment the `volumes` lines in `compose.yml`, then run `docker compose up -d`.
- **Downloads suddenly fail for everything**: YouTube changed something, and yt-dlp usually fixes it within days. Run `docker compose build --no-cache && docker compose up -d` to get the newest yt-dlp.
- Songs longer than 30 minutes and live streams are skipped (`MAX_SONG_SECONDS`).

## API

All routes except `/health` need `Authorization: Bearer <LIBRARY_TOKEN>`.

| Method | Path | |
|---|---|---|
| GET | `/health` | `{ ok: true }` |
| GET | `/library` | `{ songs: [{ yt, title, artist, duration, addedAt, mp3 }] }`, where `mp3` is a signed link |
| POST | `/songs` `{ url }` | fetches the link and returns `{ song }`. A song already in the library isn't fetched again |
| DELETE | `/songs/<id>` | removes the song and its file |

Tests: `pnpm test`.
