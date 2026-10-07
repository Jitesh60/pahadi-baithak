import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { timingSafeEqual, createHash } from 'node:crypto';
import { videoId } from './youtube.mjs';

/* ══════════════════════════════════════════════════════════════
   A tiny HTTP API for one person's library. Every route except
   /health needs the owner's token. Downloads run one at a time.

     GET    /health
     GET    /library          → { songs: [{ yt, title, artist, duration, mp3 }] }
     POST   /songs { url }    → { song }   (fetches the link into R2)
     DELETE /songs/:id        → 204
   ══════════════════════════════════════════════════════════════ */

const digest = (s) => createHash('sha256').update(String(s)).digest();

export function createApp({ token, origins = [], store, fetchAudio, log = console }) {
  if (!token || token.length < 24) throw new Error('LIBRARY_TOKEN must be at least 24 characters');
  const want = digest(token);
  const authorised = (req) => {
    const got = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    return !!got && timingSafeEqual(digest(got), want);
  };

  let queue = Promise.resolve();
  const oneAtATime = (job) => {
    const run = queue.then(job, job);
    queue = run.catch(() => {});
    return run;
  };

  const withLink = async (s) => ({ ...s, mp3: await store.link(s.yt) });

  async function addSong(url) {
    const id = videoId(url);
    if (!id) throw Object.assign(new Error('That doesn’t look like a YouTube link'), { status: 400 });
    return oneAtATime(async () => {
      const have = (await store.list()).find((s) => s.yt === id);
      if (have) return withLink(have);
      const dir = await mkdtemp(join(tmpdir(), 'pb-'));
      try {
        const got = await fetchAudio(id, dir).catch((e) => {
          throw Object.assign(e, { status: 422 });   /* YouTube said no: tell the user why */
        });
        const song = {
          yt: id, title: got.title, artist: got.artist,
          duration: got.duration, addedAt: new Date().toISOString(),
        };
        await store.put(song, got.file);
        log.info?.(`added ${id} ${song.title}`);
        return withLink(song);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  }

  async function route(req, res) {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true });
    if (!authorised(req)) return send(res, 401, { error: 'Wrong or missing key' });

    if (req.method === 'GET' && url.pathname === '/library') {
      const songs = await store.list();
      return send(res, 200, { songs: await Promise.all(songs.map(withLink)) });
    }
    if (req.method === 'POST' && url.pathname === '/songs') {
      const body = await readJson(req);
      return send(res, 201, { song: await addSong(body.url) });
    }
    const del = /^\/songs\/([\w-]{11})$/.exec(url.pathname);
    if (req.method === 'DELETE' && del) {
      await oneAtATime(() => store.remove(del[1]));
      return send(res, 204);
    }
    return send(res, 404, { error: 'Not found' });
  }

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return send(res, 204);
    try {
      await route(req, res);
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) log.error?.(e);
      send(res, status, { error: status >= 500 ? 'Something went wrong on the server' : e.message });
    }
  });
}

function send(res, status, body) {
  if (body === undefined) { res.writeHead(status); res.end(); return; }
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 4096) throw Object.assign(new Error('Body too large'), { status: 413 });
  }
  try { return JSON.parse(raw || '{}'); } catch {
    throw Object.assign(new Error('Body must be JSON'), { status: 400 });
  }
}
