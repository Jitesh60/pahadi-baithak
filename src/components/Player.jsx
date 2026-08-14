import Seek from './Seek.jsx';
import { thumb, clock } from '../lib/track.js';

export default function Player({
  track, playing, loading, note, position, duration, count,
  onToggle, onStep, onSeek, onNudge, onOpenList, listOpen,
}) {
  const cls = ['player', playing && 'is-playing', loading && 'is-loading']
    .filter(Boolean).join(' ');

  return (
    <section class={cls} aria-label="Now playing">
      <img
        class="player__art"
        src={track ? thumb(track) : undefined}
        alt={track ? `${track.title} — ${track.artist}` : ''}
        width="60"
        height="60"
      />

      <div class="player__info">
        <p class="player__title">{track ? track.title : 'बैठक लग रही है…'}</p>
        <p class="player__sub">{track ? track.artist : 'Loading the songbook'}</p>
        <div class="player__bar">
          <span class="t">{clock(position)}</span>
          <Seek position={position} duration={duration} onSeek={onSeek} onNudge={onNudge} />
          <span class="t t--end">{clock(duration)}</span>
        </div>
      </div>

      <div class="player__ctrl">
        <button class="tbtn" onClick={() => onStep(-1)} aria-label="Previous song">
          <svg viewBox="0 0 24 24"><path d="M18 6v12L9 12zM7 6h2v12H7z" /></svg>
        </button>

        {/* the play button IS the record: an aipan mandala that turns while it plays */}
        <button class="play" onClick={onToggle} aria-pressed={playing} aria-label={playing ? 'Pause' : 'Play'}>
          <svg class="play__mandala" viewBox="0 0 120 120" aria-hidden="true"><use href="#mandala" /></svg>
          <svg class="play__ico play__ico--play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" /></svg>
          <svg class="play__ico play__ico--pause" viewBox="0 0 24 24"><path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" /></svg>
          <span class="play__spinner" aria-hidden="true" />
        </button>

        <button class="tbtn" onClick={() => onStep(1)} aria-label="Next song">
          <svg viewBox="0 0 24 24"><path d="M6 6v12l9-6zM15 6h2v12h-2z" /></svg>
        </button>
      </div>

      <div class="player__foot">
        <button class="listbtn" onClick={onOpenList} aria-expanded={listOpen} aria-controls="listPanel">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h11M4 12h11M4 18h8M18 8v9.2a2 2 0 1 1-1.4-1.9V8z"
                  fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
          <span>सारे गाने</span><b>{count || '—'}</b>
        </button>

        {note && (
          <p class="player__note is-on" role="status">
            {note.text}{' '}
            {note.href && <a href={note.href} target="_blank" rel="noopener">{note.hrefLabel}</a>}
          </p>
        )}
      </div>
    </section>
  );
}
