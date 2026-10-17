import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import Defs from './components/Defs.jsx';
import AipanFrame from './components/AipanFrame.jsx';
import TopBar from './components/TopBar.jsx';
import WhatsAppStrip from './components/WhatsAppStrip.jsx';
import Player from './components/Player.jsx';
import LineCard from './components/LineCard.jsx';
import SongPanel from './components/SongPanel.jsx';
import SharedCard from './components/SharedCard.jsx';

import { usePlayer } from './hooks/usePlayer.js';
import { useRotatingLine } from './hooks/useChrome.js';
import { useMyList } from './hooks/useMyList.js';
import { useLibrary, withLibrary } from './hooks/useLibrary.js';
import { readSharedList, clearSharedList } from './lib/share.js';

/* songs.json is fetched rather than imported so it stays hand-editable in
   the built output — change a song, reload, done. No rebuild. */
const SONGBOOK = '/songs.json';

export default function App() {
  const [book, setBook] = useState({ groups: [], tracks: [], lines: [] });
  const [failed, setFailed] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [sharedIds, setSharedIds] = useState(readSharedList);

  const library = useLibrary();
  /* your saved copies play instead of YouTube; extra songs join the end */
  const tracks = useMemo(() => withLibrary(book.tracks, library.songs), [book.tracks, library.songs]);

  const player = usePlayer(tracks);
  const { line, turning } = useRotatingLine(book.lines);
  const myList = useMyList();

  /* a friend's list, as positions in the songbook (unknown ids are dropped) */
  const at = new Map(tracks.map((t, i) => [t.yt, i]));
  const shared = sharedIds.map((id) => at.get(id)).filter((i) => i !== undefined);
  const sharedSaved = sharedIds.every((id) => myList.has(id));

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

  /* queue: the list to keep playing from (my list), or null for the whole book */
  const pickFromList = useCallback((i, queue) => {
    player.setPlaylist(queue);
    if (i === player.idx) player.toggle();
    else player.pick(i, true);
    setListOpen(false);   /* get out of the way so you can see the hills again */
  }, [player.idx, player.toggle, player.pick, player.setPlaylist]);

  const dismissShared = useCallback(() => { setSharedIds([]); clearSharedList(); }, []);
  const playShared = () => { player.playQueue(shared); dismissShared(); };

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

          {ready && shared.length > 0
            ? (
              <SharedCard
                tracks={shared.map((i) => tracks[i])}
                saved={sharedSaved}
                onPlay={playShared}
                onSave={() => myList.addAll(shared.map((i) => tracks[i].yt))}
                onDismiss={dismissShared}
              />
            )
            : <WhatsAppStrip />}

          <Player
            track={failed ? null : player.current}
            playing={player.playing}
            loading={player.loading}
            note={failed
              ? { text: 'songs.json लोड नहीं हुई — check that public/songs.json is valid JSON.' }
              : player.note}
            position={player.position}
            duration={player.duration}
            count={tracks.length}
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
        tracks={tracks}
        library={library}
        idx={player.idx}
        playing={player.playing}
        dead={player.dead}
        myList={myList.ids}
        onToggleMine={myList.toggle}
        onPick={pickFromList}
        onClose={closeList}
      />
    </>
  );
}
