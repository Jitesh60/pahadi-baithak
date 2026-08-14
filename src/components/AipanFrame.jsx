/* ═══ SIGNATURE ═══
   Kumaoni women paint aipan on a doorstep before you may enter. This one
   paints itself — the outline draws, the patterned bands wash in, the corner
   lotuses bloom — and then you are inside. */
export default function AipanFrame() {
  return (
    <div class="aipan" aria-hidden="true">
      <svg viewBox="0 0 1000 640" preserveAspectRatio="none" class="aipan__line">
        <rect x="14" y="14" width="972" height="612" rx="2" class="aipan__stroke" />
      </svg>
      <div class="aipan__band aipan__band--t" />
      <div class="aipan__band aipan__band--b" />
      {['tl', 'tr', 'bl', 'br'].map((corner) => (
        <svg key={corner} class={`aipan__corner aipan__corner--${corner}`} viewBox="0 0 100 100">
          <use href="#lotus" />
        </svg>
      ))}
    </div>
  );
}
