import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

/* ══════════════════════════════════════════════════════════════
   One playlist, two possible sources.

   A track carrying an "mp3" path plays that file through an Audio
   element; everything else streams from YouTube through a hidden
   iframe, so the artists keep their play counts. Callers never need
   to know which of the two is running.
   ══════════════════════════════════════════════════════════════ */

const YT_SRC = 'https://www.youtube.com/iframe_api';
const HOST_ID = 'yt-host';

function loadYTScript() {
  if (document.querySelector(`script[src="${YT_SRC}"]`)) return;
  const s = document.createElement('script');
  s.src = YT_SRC;
  document.head.appendChild(s);
}

export function usePlayer(tracks) {
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(null);        // { text, href? }
  const [dead, setDead] = useState(() => new Set());
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState(null);      // track indices, or null = whole songbook

  const yt = useRef(null);
  const ytReady = useRef(false);
  const audio = useRef(null);
  const pending = useRef(null);                  // queued while the API boots
  const idxRef = useRef(-1);
  const tracksRef = useRef(tracks);
  const deadRef = useRef(dead);
  const queueRef = useRef(null);
  const stepRef = useRef(() => {});              // YT callbacks need the latest

  tracksRef.current = tracks;
  deadRef.current = dead;
  queueRef.current = queue;

  const current = idx >= 0 ? tracks[idx] : null;

  /* the mp3 element is created once, lazily */
  const getAudio = useCallback(() => {
    if (!audio.current) {
      const a = new Audio();
      a.preload = 'none';
      audio.current = a;
    }
    return audio.current;
  }, []);

  /* ── source abstraction ──────────────────────────────────── */
  const isFile = (t) => !!(t && t.mp3);

  const loadInto = useCallback((track, autoplay) => {
    const a = getAudio();
    if (isFile(track)) {
      if (ytReady.current && yt.current?.stopVideo) yt.current.stopVideo();
      a.src = track.mp3;
      if (autoplay) a.play().catch(() => setPlaying(false));
      return;
    }
    a.pause();
    a.removeAttribute('src');
    if (!ytReady.current) { pending.current = { id: track.yt, autoplay }; return; }
    if (autoplay) yt.current.loadVideoById(track.yt);
    else yt.current.cueVideoById(track.yt);
  }, [getAudio]);

  const readNow = useCallback(() => {
    const t = tracksRef.current[idxRef.current];
    if (isFile(t)) return audio.current?.currentTime || 0;
    return (ytReady.current && yt.current?.getCurrentTime) ? yt.current.getCurrentTime() || 0 : 0;
  }, []);

  const readTotal = useCallback(() => {
    const t = tracksRef.current[idxRef.current];
    if (isFile(t)) return audio.current?.duration || 0;
    return (ytReady.current && yt.current?.getDuration) ? yt.current.getDuration() || 0 : 0;
  }, []);

  /* ── transport ───────────────────────────────────────────── */
  const pick = useCallback((i, autoplay) => {
    const list = tracksRef.current;
    if (!list.length) return;
    const n = ((i % list.length) + list.length) % list.length;
    idxRef.current = n;
    setIdx(n);
    setNote(null);
    setPosition(0);
    setDuration(0);
    if (autoplay) setLoading(true);
    loadInto(list[n], autoplay);
  }, [loadInto]);

  /* Skip tracks already known to be dead, so a run of them can't trap us.
     With a queue (a playlist), next/prev walk the queue instead. */
  const step = useCallback((dir, autoplay) => {
    const list = tracksRef.current;
    if (!list.length) return;
    const q = queueRef.current;
    if (q && q.length) {
      let at = q.indexOf(idxRef.current);
      for (let hop = 0; hop < q.length; hop++) {
        at = ((at + dir) % q.length + q.length) % q.length;
        if (!deadRef.current.has(q[at])) return pick(q[at], autoplay);
      }
      return pick(q[0], autoplay);
    }
    let n = idxRef.current;
    for (let hop = 0; hop < list.length; hop++) {
      n = ((n + dir) % list.length + list.length) % list.length;
      if (!deadRef.current.has(n)) return pick(n, autoplay);
    }
    pick(idxRef.current + dir, autoplay);
  }, [pick]);

  /* Next/prev walk only these tracks, in this order. null = everything. */
  const setPlaylist = useCallback((indices) => {
    const q = indices && indices.length ? indices.slice() : null;
    queueRef.current = q;
    setQueue(q);
  }, []);

  /* ...and start playing them, from the first or from `start`. */
  const playQueue = useCallback((indices, start) => {
    setPlaylist(indices);
    if (indices && indices.length) pick(start ?? indices[0], true);
  }, [setPlaylist, pick]);

  stepRef.current = step;

  const toggle = useCallback(() => {
    const list = tracksRef.current;
    if (idxRef.current < 0) return pick(0, true);
    const t = list[idxRef.current];
    if (playing) {
      if (isFile(t)) getAudio().pause();
      else if (ytReady.current) yt.current.pauseVideo();
      setPlaying(false);
      return;
    }
    setNote(null);
    setLoading(true);
    if (isFile(t)) getAudio().play().catch(() => { setPlaying(false); setLoading(false); });
    else if (ytReady.current) yt.current.playVideo();
  }, [playing, pick, getAudio]);

  const seekTo = useCallback((seconds) => {
    const t = tracksRef.current[idxRef.current];
    if (isFile(t)) getAudio().currentTime = seconds;
    else if (ytReady.current) yt.current.seekTo(seconds, true);
    setPosition(seconds);
  }, [getAudio]);

  const seekByFraction = useCallback((frac) => {
    const total = readTotal();
    if (total) seekTo(Math.max(0, Math.min(1, frac)) * total);
  }, [readTotal, seekTo]);

  const nudge = useCallback((delta) => {
    const total = readTotal();
    if (total) seekTo(Math.max(0, Math.min(total, readNow() + delta)));
  }, [readNow, readTotal, seekTo]);

  /* ── YouTube iframe, booted once ─────────────────────────── */
  useEffect(() => {
    /* The YT API *replaces* its host element with the iframe. Preact would
       keep diffing against the node it thinks is still there, so the host is
       created outside the vdom and cleaned up by hand. */
    const host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);

    const boot = () => {
      yt.current = new window.YT.Player(host, {
        height: '1', width: '1',
        playerVars: { playsinline: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            ytReady.current = true;
            const q = pending.current;
            if (q) {
              if (q.autoplay) yt.current.loadVideoById(q.id);
              else yt.current.cueVideoById(q.id);
              pending.current = null;
            }
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING)        { setPlaying(true);  setLoading(false); }
            else if (e.data === S.PAUSED)    { setPlaying(false); setLoading(false); }
            else if (e.data === S.BUFFERING) { setLoading(true); }
            else if (e.data === S.ENDED)     { stepRef.current(1, true); }
            else if (e.data === S.CUED)      {
              setLoading(false);
              setDuration(yt.current.getDuration() || 0);
            }
          },
          /* An upload can be pulled, or blocked outside YouTube. Say so and
             keep the baithak going rather than sitting on a dead track. */
          onError: () => {
            const n = idxRef.current;
            const t = tracksRef.current[n];
            if (t) {
              setDead((prev) => new Set(prev).add(n));
              setNote({
                text: 'यह गाना यहाँ नहीं चल सकता — अगला लगा रहे हैं…',
                href: `https://www.youtube.com/watch?v=${t.yt}`,
                hrefLabel: 'YouTube पर सुनें',
              });
            }
            setLoading(false);
            setPlaying(false);
            setTimeout(() => stepRef.current(1, true), 1800);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) boot();
    else {
      window.onYouTubeIframeAPIReady = boot;
      loadYTScript();
    }

    return () => {
      try { yt.current?.destroy?.(); } catch { /* already gone */ }
      ytReady.current = false;
      yt.current = null;
      document.getElementById(HOST_ID)?.remove();
    };
  }, []);

  /* ── mp3 events ──────────────────────────────────────────── */
  useEffect(() => {
    const a = getAudio();
    const onPlay  = () => { setPlaying(true); setLoading(false); };
    const onPause = () => setPlaying(false);
    const onEnd   = () => stepRef.current(1, true);
    const onErr   = () => {
      const t = tracksRef.current[idxRef.current];
      if (t?.mp3) setNote({ text: `${t.mp3} नहीं मिली — file missing or unplayable.` });
      setLoading(false);
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
    };
  }, [getAudio]);

  /* ── progress ────────────────────────────────────────────── */
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setPosition(readNow());
      setDuration(readTotal());
    }, 250);
    return () => clearInterval(id);
  }, [playing, readNow, readTotal]);

  return {
    idx, current, playing, loading, note, dead, position, duration,
    queue, pick, toggle, step, seekTo, seekByFraction, nudge, setPlaylist, playQueue,
  };
}
