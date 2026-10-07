import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { videoId } from './lib/youtube.mjs';
import { createApp } from './lib/app.mjs';

const TOKEN = 'x'.repeat(32);

test('videoId reads the usual YouTube link shapes', () => {
  for (const u of [
    'XNvP0H3Fa8A',
    'https://youtu.be/XNvP0H3Fa8A?si=abc',
    'https://www.youtube.com/watch?v=XNvP0H3Fa8A&list=RD1',
    'https://m.youtube.com/watch?v=XNvP0H3Fa8A',
    'https://music.youtube.com/watch?v=XNvP0H3Fa8A',
    'https://www.youtube.com/shorts/XNvP0H3Fa8A',
    'https://youtube.com/live/XNvP0H3Fa8A',
  ]) assert.equal(videoId(u), 'XNvP0H3Fa8A', u);
  for (const u of [
    '', 'hello', 'https://vimeo.com/123', 'https://evil.com/watch?v=XNvP0H3Fa8A',
    'https://www.youtube.com/playlist?list=PL123', 'file:///etc/passwd', '--exec=rm',
  ]) assert.equal(videoId(u), null, u);
});

function memoryStore() {
  const songs = new Map();
  return {
    list: async () => [...songs.values()],
    put: async (s) => { songs.set(s.yt, s); },
    remove: async (id) => { songs.delete(id); },
    link: async (id) => `https://signed.example/${id}`,
  };
}

async function start(opts = {}) {
  const calls = [];
  const app = createApp({
    token: TOKEN,
    origins: ['https://site.example'],
    store: memoryStore(),
    log: {},
    fetchAudio: async (id, dir) => {
      calls.push(id);
      if (id === 'blockedxxxx') throw new Error('Video unavailable');
      const file = `${dir}/${id}.mp3`;
      await writeFile(file, 'ID3');
      return { file, title: 'बेड़ु पाको', artist: 'Mohan Upreti', duration: 200 };
    },
    ...opts,
  });
  await new Promise((r) => app.listen(0, r));
  const base = `http://127.0.0.1:${app.address().port}`;
  const call = (path, init = {}, key = TOKEN) => fetch(base + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}), ...init.headers },
  });
  return { app, call, calls };
}

test('needs the key', async (t) => {
  const { app, call } = await start();
  t.after(() => app.close());
  assert.equal((await call('/health', {}, null)).status, 200);
  assert.equal((await call('/library', {}, null)).status, 401);
  assert.equal((await call('/library', {}, 'y'.repeat(32))).status, 401);
  assert.equal((await call('/library')).status, 200);
});

test('add, list, re-add, delete', async (t) => {
  const { app, call, calls } = await start();
  t.after(() => app.close());
  const post = (url) => call('/songs', { method: 'POST', body: JSON.stringify({ url }) });

  const r = await post('https://youtu.be/XNvP0H3Fa8A');
  assert.equal(r.status, 201);
  const { song } = await r.json();
  assert.equal(song.yt, 'XNvP0H3Fa8A');
  assert.equal(song.mp3, 'https://signed.example/XNvP0H3Fa8A');

  assert.equal((await post('XNvP0H3Fa8A')).status, 201);
  assert.deepEqual(calls, ['XNvP0H3Fa8A'], 'a song already in the library is not fetched again');

  const lib = await (await call('/library')).json();
  assert.equal(lib.songs.length, 1);

  assert.equal((await call('/songs/XNvP0H3Fa8A', { method: 'DELETE' })).status, 204);
  assert.equal((await (await call('/library')).json()).songs.length, 0);
});

test('bad links and YouTube errors come back as readable 4xx', async (t) => {
  const { app, call } = await start();
  t.after(() => app.close());
  const bad = await call('/songs', { method: 'POST', body: JSON.stringify({ url: 'https://vimeo.com/1' }) });
  assert.equal(bad.status, 400);
  const blocked = await call('/songs', { method: 'POST', body: JSON.stringify({ url: 'blockedxxxx' }) });
  assert.equal(blocked.status, 422);
  assert.equal((await blocked.json()).error, 'Video unavailable');
});

test('CORS only for the allowed site', async (t) => {
  const { app, call } = await start();
  t.after(() => app.close());
  const ok = await call('/library', { headers: { Origin: 'https://site.example' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://site.example');
  const no = await call('/library', { headers: { Origin: 'https://other.example' } });
  assert.equal(no.headers.get('access-control-allow-origin'), null);
});

test('refuses to start with a short token', () => {
  assert.throws(() => createApp({ token: 'short', store: memoryStore(), fetchAudio: async () => {} }));
});
