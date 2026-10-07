import { thumb } from '../lib/track.js';

/* Shown when someone opens a link a friend sent: what's in it, and two
   plain choices — play it now, or keep it in my list. */
export default function SharedCard({ tracks, saved, onPlay, onSave, onDismiss }) {
  const n = tracks.length;
  return (
    <section class="shared" aria-label="Shared playlist">
      <div class="shared__art" aria-hidden="true">
        {tracks.slice(0, 3).map((t) => <img key={t.yt} src={thumb(t)} alt="" />)}
      </div>
      <div class="shared__txt">
        <b>किसी ने आपको गाने भेजे हैं</b>
        <i>{n} {n === 1 ? 'गाना' : 'गाने'} · {tracks[0].title}{n > 1 ? ' …' : ''}</i>
      </div>
      <div class="shared__btns">
        <button class="sharebtn sharebtn--play" onClick={onPlay}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
          सुनें
        </button>
        <button class="sharebtn" onClick={onSave} disabled={saved}>
          {saved ? 'सूची में है ✓' : 'मेरी सूची में रखें'}
        </button>
      </div>
      <button class="shared__x" onClick={onDismiss} aria-label="Dismiss shared playlist">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
      </button>
    </section>
  );
}
