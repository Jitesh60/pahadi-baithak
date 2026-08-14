import { useRef, useState } from 'preact/hooks';

/* Scrub bar. While a drag is in flight it shows the dragged position rather
   than the player's, so the fill doesn't fight the pointer. */
export default function Seek({ position, duration, onSeek, onNudge }) {
  const rail = useRef(null);
  const [drag, setDrag] = useState(null);

  const fractionAt = (clientX) => {
    const r = rail.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  };

  const shown = drag !== null
    ? drag
    : (duration ? Math.max(0, Math.min(1, position / duration)) : 0);
  const pct = `${shown * 100}%`;

  return (
    <div
      class="seek"
      ref={rail}
      role="slider"
      tabIndex={0}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(shown * 100)}
      onPointerDown={(e) => {
        if (!duration) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(fractionAt(e.clientX));
      }}
      onPointerMove={(e) => { if (drag !== null) setDrag(fractionAt(e.clientX)); }}
      onPointerUp={(e) => {
        if (drag === null) return;
        onSeek(fractionAt(e.clientX));
        setDrag(null);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { onNudge(5); e.preventDefault(); }
        if (e.key === 'ArrowLeft')  { onNudge(-5); e.preventDefault(); }
      }}
    >
      <div class="seek__fill" style={{ width: pct }} />
      <div class="seek__knob" style={{ left: pct }} />
    </div>
  );
}
