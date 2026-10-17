import { useCallback, useEffect, useState } from 'preact/hooks';

/* ══════════════════════════════════════════════════════════════
   "मेरी सूची" — the listener's own playlist.

   Stored as YouTube ids rather than positions, so the list survives
   songs being added to or reordered in songs.json. Lives only in this
   browser; sharing it means sending a link.
   ══════════════════════════════════════════════════════════════ */

const KEY = 'pahadi-baithak:my-list';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useMyList() {
  const [ids, setIds] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* private mode */ }
  }, [ids]);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback((id) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  /* add a shared list after whatever is already here, skipping repeats */
  const addAll = useCallback((more) => {
    setIds((prev) => [...prev, ...more.filter((x) => !prev.includes(x))]);
  }, []);

  return { ids, has, toggle, addAll };
}
