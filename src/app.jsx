import { useCallback, useEffect, useState } from 'preact/hooks';

import Defs from './components/Defs.jsx';
import AipanFrame from './components/AipanFrame.jsx';
import TopBar from './components/TopBar.jsx';
import WhatsAppStrip from './components/WhatsAppStrip.jsx';
import Player from './components/Player.jsx';
import LineCard from './components/LineCard.jsx';
import SongPanel from './components/SongPanel.jsx';

import { usePlayer } from './hooks/usePlayer.js';
import { useRotatingLine } from './hooks/useChrome.js';

/* songs.json is fetched rather than imported so it stays hand-editable in
   the built output — change a song, reload, done. No rebuild. */
const SONGBOOK = '/songs.json';

export default function App() {
  const [book, setBook] = useState({ groups: [], tracks: [], lines: [] });
  const [failed, setFailed] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const player = usePlayer(book.tracks);
  const { line, turning } = useRotatingLine(book.lines);

  useEffect(() => {
    fetch(SONGBOOK)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(setBook)
      .catch(() => setFailed(true));
  }, []);

  /* cue the first song without playing it — nobody wants audio on arrival */
  const ready = book.tracks.length > 0;
  useEffect(() => { if (ready) player.pick(0, false); }, [ready]);

  const openList = useCallback(() => setListOpen((v) => !v), []);
  const closeList = useCallback(() => setListOpen(false), []);

  const pickFromList = useCallback((i) => {
    if (i === player.idx) player.toggle();
    else player.pick(i, true);
    setListOpen(false);   /* get out of the way so you can see the hills again */
  }, [player.idx, player.toggle, player.pick]);

  /* space toggles play, unless you're on a control or the list is up */
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || listOpen) return;
      if (e.target.closest('button, a, input, textarea, [role="slider"]')) return;
      e.preventDefault();
      player.toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listOpen, player.toggle]);

  return (
    <>
      <Defs />

      {/* Panchachuli at sunrise, seen from Munsiyari */}
      <div class="bg" aria-hidden="true">
        <img class="bg__img" src="/hero.jpg" alt="" fetchpriority="high" />
        <div class="bg__scrim" />
      </div>

      <AipanFrame />
      <TopBar />

      <main class="hero">
        <div class="stack">
          <h1 class="wordmark"><span>पहाड़ी</span><span>बैठक</span></h1>
          <p class="wordmark__sub">Pahadi Baithak · Kumaoni Sounds</p>

          <WhatsAppStrip />

          <Player
            track={failed ? null : player.current}
            playing={player.playing}
            loading={player.loading}
            note={failed
              ? { text: 'songs.json लोड नहीं हुई — check that public/songs.json is valid JSON.' }
              : player.note}
            position={player.position}
            duration={player.duration}
            count={book.tracks.length}
            listOpen={listOpen}
            onToggle={player.toggle}
            onStep={(dir) => player.step(dir, true)}
            onSeek={player.seekByFraction}
            onNudge={player.nudge}
            onOpenList={openList}
          />

          <LineCard line={line} turning={turning} />

          <p class="contact">
            पहाड़ बुला रहा है — जितेश भट्ट ·{' '}
            <a href="mailto:jiteshbhatt.dev@gmail.com">jiteshbhatt.dev@gmail.com</a>
          </p>

          {/* CC BY-SA 4.0 requires the credit to stay visible */}
          <p class="credit">
            Panchachuli from Munsiyari ·{' '}
            <a href="https://commons.wikimedia.org/wiki/File:Munsiyari.jpg" target="_blank" rel="noopener">Ebenezer Rao</a>,{' '}
            <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noopener">CC BY-SA 4.0</a>
          </p>
        </div>
      </main>

      <SongPanel
        open={listOpen}
        groups={book.groups}
        tracks={book.tracks}
        idx={player.idx}
        playing={player.playing}
        dead={player.dead}
        onPick={pickFromList}
        onClose={closeList}
      />
    </>
  );
}
