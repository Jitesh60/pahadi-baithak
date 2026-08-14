# पहाड़ी बैठक · Pahadi Baithak

One page, built with Preact. **147 Kumaoni songs** across eight rooms:

| Room | | Songs |
|---|---|--:|
| लोकगीत | Folk canon — Bedu Pako, Chhana Bilauri, Haye Teri Rumala, Nyoli, Chhapeli | 24 |
| पुरखों की आवाज़ | The first voices — Kabutari Devi, Mohan & Naima Khan Upreti | 13 |
| गोपाल बाबू गोस्वामी | The voice | 12 |
| नई पहाड़ी | Playing now — Pappu Karki, Inder Arya, Priyanka Meher, Jitendra Tomkyal | 70 |
| झोड़ा–चांचरी | Circle dances, chholiya | 10 |
| बैठकी होली | Holi in the hills | 6 |
| संस्कार गीत | Weddings and rites — shakunakhar, mangal geet | 4 |
| जागर | Calling the gods — Golu Devta, Nanda Devi | 8 |

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:8080
```

```bash
pnpm build      # → dist/
pnpm preview    # serve dist/ to check it before shipping
```

Deploy by uploading `dist/` to any static host. No server, no API keys.

## Layout

```
index.html            Vite entry — fonts, meta, #app
public/songs.json     Every song and every rotating line
public/hero.jpg       The background photograph
src/
  app.jsx             Composes the page, owns the panel + keyboard shortcuts
  styles.css          Palette, type, the aipan threshold animation
  lib/track.js        Thumbnail url + m:ss formatting
  hooks/
    usePlayer.js      The engine: YouTube iframe + mp3 behind one interface
    useChrome.js      Clock, listener count, the rotating line
  components/
    Defs.jsx          Shared SVG symbols (aipan lotus, play-button mandala)
    AipanFrame.jsx    The self-drawing threshold
    TopBar.jsx        Clock, listeners, Spotify / YT Music
    WhatsAppStrip.jsx
    Player.jsx        Art, title, transport, songbook toggle
    Seek.jsx          Scrub bar (drag + arrow keys)
    LineCard.jsx      A known line, and what it actually says
    SongPanel.jsx     Room filters and the 60-song grid
```

## Add a song

Edit `public/songs.json` — it's fetched at runtime, not bundled, so in a
deployed build you can change a song and reload. **No rebuild.**

`yt` is the id from a YouTube URL — in `youtube.com/watch?v=mKlSC60wfCY` the
id is `mKlSC60wfCY`.

```json
{ "title": "गाने का नाम", "artist": "गायक", "group": "lok", "yt": "mKlSC60wfCY", "mp3": null }
```

`group` must match one of the ids in `groups`: `lok`, `purv`, `gbg`, `nai`,
`jhoda`, `holi`, `sanskar`, `jagar`. Cover art comes from the YouTube
thumbnail automatically.

All 147 ids were checked and resolve. If one is taken down later the player
says so, marks the card, and skips to the next song instead of sitting silent.
To re-check the whole songbook at any time:

```bash
python3 - <<'EOF'
import json, urllib.request, concurrent.futures as cf
d = json.load(open('public/songs.json'))
def chk(t):
    try:
        r = urllib.request.urlopen(urllib.request.Request(
            f"https://i.ytimg.com/vi/{t['yt']}/mqdefault.jpg", method='HEAD'), timeout=20)
        return t, r.status
    except Exception as e:
        return t, getattr(e, 'code', 'ERR')
with cf.ThreadPoolExecutor(16) as ex:
    for t, s in ex.map(chk, d['tracks']):
        if s != 200: print('DEAD', t['yt'], t['title'], '—', t['artist'])
EOF
```

## Play your own files instead

Put MP3s in `public/audio/` and point a track at one:

```json
{ "title": "बेड़ु पाको बारो मासा", "artist": "पारंपरिक", "group": "lok", "yt": "XNvP0H3Fa8A", "mp3": "/audio/bedu.mp3" }
```

A track with an `mp3` path ignores YouTube completely and plays the file.
Keep the `yt` id anyway — it's still used for the cover art.

## Change the background

Replace `public/hero.jpg` and it just works — the scrim, vignette and slow
zoom live in CSS, not in the image. Landscape, at least 2000px wide, with
something dark or empty in the lower half reads best, since the player sits
there.

**If you replace it, update the credit in `src/app.jsx`.** The current photo
is *Panchachuli from Munsiyari* by **Ebenezer Rao**, used under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) — that licence
requires the attribution to stay visible, which is why it's on the page.
[Source](https://commons.wikimedia.org/wiki/File:Munsiyari.jpg).

## Contact

| Where | What |
|---|---|
| `src/components/WhatsAppStrip.jsx` | WhatsApp `919528865610` — opens a chat with the join message pretyped |
| `src/app.jsx` | Byline and `jiteshbhatt.dev@gmail.com` |
| `index.html` | `<meta name="author">` |

The banner opens a direct chat rather than a group invite, so nobody's number
is exposed to anyone but you. If you'd rather run it as a broadcast list or a
group, swap the `JOIN` url in `WhatsAppStrip.jsx` for the invite link.

## One thing that is not real

**The listener count is simulated.** There's no server behind this page, so it
can't measure anything. It drifts with the hour to feel alive — busy in the
evening, quiet at 4am. The clock beside it is real, in IST.

Nothing is hosted here — every track streams from YouTube, so plays count for
the artist and the label.

## Keyboard

| Key | Does |
|---|---|
| `Space` | Play / pause |
| `←` `→` | Seek 5s, when the scrub bar has focus |
| `Esc` | Close the songbook |
