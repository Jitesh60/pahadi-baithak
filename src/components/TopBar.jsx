import { useClock, useListeners } from '../hooks/useChrome.js';

function SpotifyMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1DB954" />
      <path d="M6.5 9.2c3.4-1 7.7-.7 10.7 1.1M7.2 12.1c2.8-.8 6.4-.6 8.9 1M7.9 14.9c2.3-.6 5.2-.4 7.2.8"
            stroke="#0B120F" stroke-width="1.6" fill="none" stroke-linecap="round" />
    </svg>
  );
}

function YTMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#FF0033" />
      <path d="M10 8.2l6 3.8-6 3.8z" fill="#fff" />
    </svg>
  );
}

export default function TopBar() {
  const time = useClock();
  const listeners = useListeners();

  return (
    <header class="topbar">
      <div class="topbar__meta">
        <span class="chip"><span class="chip__time">{time}</span></span>
        <span class="chip">
          <i class="dot" />
          <b>{listeners ? listeners.toLocaleString('en-IN') : '—'}</b>
          <span class="chip__lbl">सुन रहे हैं</span>
        </span>
      </div>
      <nav class="topbar__nav" aria-label="Primary">
        <a class="pill" href="https://open.spotify.com/search/kumaoni" target="_blank" rel="noopener">
          <SpotifyMark />Spotify
        </a>
        <a class="pill" href="https://music.youtube.com/search?q=kumaoni" target="_blank" rel="noopener">
          <YTMark />YT Music
        </a>
      </nav>
    </header>
  );
}
