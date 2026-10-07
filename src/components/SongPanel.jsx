import { useEffect, useRef, useState } from 'preact/hooks';
import { thumb } from '../lib/track.js';
import { shareList, whatsappHref } from '../lib/share.js';

const ALL = '*';
const MINE = 'mine';

function Song({ track, index, isCurrent, isPaused, isDead, inList, onPick, onToggleMine }) {
  const cls = [
    'song',
    isCurrent && 'is-current',
    isCurrent && isPaused && 'is-paused',
    isDead && 'is-dead',
  ].filter(Boolean).join(' ');

  return (
    <div class="songrow">
      <button class={cls} onClick={() => onPick(index)} aria-current={isCurrent || undefined}>
        <span class="song__art"><img loading="lazy" src={thumb(track)} alt="" /></span>
        <span class="song__meta">
          <span class="song__t">{track.title}</span>
          <span class="song__a">{track.artist}</span>
        </span>
        <span class="eq" aria-hidden="true"><i /><i /><i /><i /></span>
      </button>
      <button
        class={`song__add${inList ? ' is-in' : ''}`}
        onClick={() => onToggleMine(track.yt)}
        aria-pressed={inList}
        aria-label={inList ? `Remove ${track.title} from my list` : `Add ${track.title} to my list`}
        title={inList ? 'मेरी सूची से हटाएँ' : 'मेरी सूची में जोड़ें'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {inList
            ? <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            : <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />}
        </svg>
      </button>
    </div>
  );
}

function ShareBar({ ids }) {
  const [said, setSaid] = useState('');
  useEffect(() => {
    if (!said) return undefined;
    const id = setTimeout(() => setSaid(''), 2200);
    return () => clearTimeout(id);
  }, [said]);

  const share = async () => {
    const r = await shareList(ids);
    if (r === 'copied') setSaid('लिंक कॉपी हो गया');
  };

  return (
    <div class="sharebar">
      <p class="sharebar__txt">दोस्तों को भेजें — वो भी यही गाने इसी क्रम में सुनेंगे।</p>
      <div class="sharebar__btns">
        <a class="sharebtn sharebtn--wa" href={whatsappHref(ids)} target="_blank" rel="noopener">WhatsApp</a>
        <button class="sharebtn" onClick={share}>{said || 'लिंक शेयर करें'}</button>
      </div>
    </div>
  );
}

export default function SongPanel({
  open, groups, tracks, idx, playing, dead, myList, onToggleMine, onPick, onClose,
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

  /* my list, in the order it was made, as positions in the songbook */
  const at = new Map(tracks.map((t, i) => [t.yt, i]));
  const mine = myList.map((id) => at.get(id)).filter((i) => i !== undefined);
  const inMine = new Set(myList);

  /* Picking from my list plays just my list; anywhere else, the whole book. */
  const pick = (i) => onPick(i, room === MINE ? mine : null);

  const shownIdx = room === MINE
    ? mine
    : tracks.map((_, i) => i).filter((i) => room === ALL || tracks[i].group === room);

  const rooms = [
    { id: ALL, hi: 'सब कुछ', en: 'Everything', n: tracks.length },
    { id: MINE, hi: 'मेरी सूची', en: 'My list', n: mine.length },
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

        {room === MINE && mine.length > 0 && <ShareBar ids={mine.map((i) => tracks[i].yt)} />}

        <div class="grid" ref={gridRef}>
          {room === MINE && mine.length === 0 && (
            <p class="grid__empty">
              अभी कोई गाना नहीं। किसी भी गाने के आगे <b>＋</b> दबाएँ — वो यहाँ आ जाएगा,
              फिर पूरी सूची दोस्तों को भेज सकते हैं।
            </p>
          )}
          {shownIdx.map((i) => (
            <Song
              key={tracks[i].yt}
              track={tracks[i]}
              index={i}
              isCurrent={i === idx}
              isPaused={!playing}
              isDead={dead.has(i)}
              inList={inMine.has(tracks[i].yt)}
              onPick={pick}
              onToggleMine={onToggleMine}
            />
          ))}
        </div>
      </div>
    </>
  );
}
