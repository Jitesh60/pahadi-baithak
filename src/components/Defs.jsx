/* Shared SVG symbols: the aipan lotus (frame corners, and the shape the
   whole visual language is built from) and the mandala that rides behind
   the play button. */
export default function Defs() {
  return (
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <symbol id="lotus" viewBox="0 0 100 100">
          <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <circle cx="50" cy="50" r="6" />
            <circle cx="50" cy="50" r="14" stroke-dasharray="1 5" />
            <g id="lotus-petals">
              <path d="M50 30 C58 38 58 44 50 50 C42 44 42 38 50 30Z" />
            </g>
            {[45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <use key={deg} href="#lotus-petals" transform={`rotate(${deg} 50 50)`} />
            ))}
            <circle cx="50" cy="50" r="30" stroke-dasharray="2 7" />
          </g>
        </symbol>

        <symbol id="mandala" viewBox="0 0 120 120">
          <g fill="none" stroke="currentColor" stroke-linecap="round">
            <circle cx="60" cy="60" r="56" stroke-width="1" stroke-dasharray="1 6" />
            <circle cx="60" cy="60" r="46" stroke-width="1.5" />
            <g stroke-width="1.5">
              <path id="mandala-petal" d="M60 14 C68 26 68 34 60 44 C52 34 52 26 60 14Z" />
              {[45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <use key={deg} href="#mandala-petal" transform={`rotate(${deg} 60 60)`} />
              ))}
            </g>
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
