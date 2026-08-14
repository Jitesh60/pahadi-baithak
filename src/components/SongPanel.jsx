import { useEffect, useRef, useState } from 'preact/hooks';
import { thumb } from '../lib/track.js';

const ALL = '*';

function Song({ track, index, isCurrent, isPaused, isDead, onPick }) {
  const cls = [
    'song',
    isCurrent && 'is-current',
    isCurrent && isPaused && 'is-paused',
    isDead && 'is-dead',
  ].filter(Boolean).join(' ');

  return (
    <button class={cls} onClick={() => onPick(index)} aria-current={isCurrent || undefined}>
      <span class="song__art"><img loading="lazy" src={thumb(track)} alt="" /></span>
      <span class="song__meta">
        <span class="song__t">{track.title}</span>
        <span class="song__a">{track.artist}</span>
      </span>
      <span class="eq" aria-hidden="true"><i /><i /><i /><i /></span>
    </button>
  );
}

export default function SongPanel({
  open, groups, tracks, idx, playing, dead, onPick, onClose,
}) {
  const [room, setRoom] = useState(ALL);
  const closeRef = useRef(null);
  const gridRef = useRef(null);

  /* Two flags, because the panel must be display:none when closed (else its
     buttons stay in the tab order) yet still animate both ways:
       present — in the DOM at all; lags the close by the transition
       shown   — carries .is-on; lags the open by a frame so it can slide  */
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setPresent(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    const id = setTimeout(() => setPresent(false), 430);
    return () => clearTimeout(id);
  }, [open]);

  /* Land on whatever is playing rather than at the top of the whole songbook. */
  useEffect(() => {
    if (!shown) return;
    closeRef.current?.focus();
    const el = gridRef.current?.querySelector('.is-current');
    if (el) el.scrollIntoView({ block: 'center' });
  }, [shown]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const counts = tracks.reduce((acc, t) => {
    acc[t.group] = (acc[t.group] || 0) + 1;
    return acc;
  }, {});

  const rooms = [
    { id: ALL, hi: 'सब कुछ', en: 'Everything', n: tracks.length },
    ...groups.map((g) => ({ ...g, n: counts[g.id] || 0 })),
  ];

  return (
    <>
      <div class={`veil${shown ? ' is-on' : ''}`} hidden={!present} onClick={onClose} />
      <div class={`panel${shown ? ' is-on' : ''}`} id="listPanel" hidden={!present}>
        <div class="panel__head">
          <div>
            <p class="panel__eyebrow">The songbook</p>
            <h2 class="panel__h">सारे गाने</h2>
          </div>
          <button class="panel__x" ref={closeRef} onClick={onClose} aria-label="Close song list">
            <svg viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="rooms" role="tablist" aria-label="Song groups">
          {rooms.map((r) => (
            <button
              key={r.id}
              class={`room${room === r.id ? ' is-on' : ''}`}
              role="tab"
              aria-selected={room === r.id}
              onClick={() => setRoom(r.id)}
            >
              <b>{r.hi}</b><span>{r.en} · {r.n}</span>
            </button>
          ))}
        </div>

        <div class="grid" ref={gridRef}>
          {tracks.map((t, i) => (
            (room === ALL || t.group === room) && (
              <Song
                key={t.yt}
                track={t}
                index={i}
                isCurrent={i === idx}
                isPaused={!playing}
                isDead={dead.has(i)}
                onPick={onPick}
              />
            )
          ))}
        </div>
      </div>
    </>
  );
}
