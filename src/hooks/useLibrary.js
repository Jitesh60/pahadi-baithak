import { useCallback, useEffect, useState } from 'preact/hooks';

/* ══════════════════════════════════════════════════════════════
   The owner's private library (server/). Hidden unless the site was
   built with VITE_LIBRARY_API *and* this browser holds the key.

   The key is entered once by opening  /#key=<LIBRARY_TOKEN>  — the
   part after # never leaves the browser, so it isn't in any server
   log — then kept in localStorage and wiped from the address bar.
   ══════════════════════════════════════════════════════════════ */

const API = (import.meta.env.VITE_LIBRARY_API || '').replace(/\/$/, '');
const KEY = 'pahadi-baithak:library-key';
const REFRESH_MS = 6 * 3600 * 1000;   // play links last 12h; renew well before

function readKey() {
  const m = /^#key=(.+)$/.exec(window.location.hash);
  if (m) {
    const k = decodeURIComponent(m[1]);
    try { localStorage.setItem(KEY, k); } catch { /* private mode: this visit only */ }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return k;
  }
  try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
}

export function useLibrary() {
  const [key, setKey] = useState(() => (API ? readKey() : ''));
  const [songs, setSongs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /* the key can also arrive while the page is already open */
  useEffect(() => {
    if (!API) return undefined;
    const onHash = () => { if (window.location.hash.startsWith('#key=')) setKey(readKey()); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const call = useCallback(async (path, init = {}) => {
    const r = await fetch(API + path, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    });
    if (r.status === 204) return null;
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(r.status === 401 ? 'चाबी गलत है — wrong key' : body.error || `Error ${r.status}`);
    return body;
  }, [key]);

  const load = useCallback(() => {
    call('/library').then((b) => { setSongs(b.songs); setError(''); }).catch((e) => setError(e.message));
  }, [call]);

  useEffect(() => {
    if (!key) return undefined;
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [key, load]);

  /* Resolves true when the song is in. Takes a while: the server downloads it. */
  const add = useCallback(async (url) => {
    setBusy(true);
    setError('');
    try {
      const { song } = await call('/songs', { method: 'POST', body: JSON.stringify({ url }) });
      setSongs((prev) => [...prev.filter((s) => s.yt !== song.yt), song]);
      return true;
    } catch (e) {
      setError(e.message === 'Failed to fetch' ? 'सर्वर से बात नहीं हो पाई — server unreachable' : e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [call]);

  const forget = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
    setKey('');
    setSongs([]);
  }, []);

  return { on: !!(API && key), songs, busy, error, add, forget };
}

/**
 * The songbook with the library folded in: a song you also saved plays
 * from your copy; one that isn't in the songbook joins the "library" room.
 */
export function withLibrary(tracks, songs) {
  if (!songs.length) return tracks;
  const mine = new Map(songs.map((s) => [s.yt, s]));
  const merged = tracks.map((t) => (mine.has(t.yt) ? { ...t, mp3: mine.get(t.yt).mp3 } : t));
  const known = new Set(tracks.map((t) => t.yt));
  for (const s of songs) {
    if (!known.has(s.yt)) merged.push({ title: s.title, artist: s.artist, group: 'library', yt: s.yt, mp3: s.mp3 });
  }
  return merged;
}
