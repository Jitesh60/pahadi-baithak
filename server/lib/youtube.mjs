import { spawn } from 'node:child_process';
import { join } from 'node:path';

/* ══════════════════════════════════════════════════════════════
   YouTube link → MP3 on disk, via yt-dlp + ffmpeg.

   Only the 11-character video id is taken from what the user pasted;
   yt-dlp is always handed a URL we build ourselves, so a pasted link
   can't point it at another site, a playlist, or extra flags.
   ══════════════════════════════════════════════════════════════ */

const ID = /^[\w-]{11}$/;
const HOSTS = /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtube-nocookie\.com)$/;

/** The video id in a YouTube link (or a bare id), else null. */
export function videoId(input) {
  const s = String(input || '').trim();
  if (ID.test(s)) return s;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.toLowerCase();
  let id = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1];
  else if (HOSTS.test(host)) {
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = u.searchParams.get('v');
    else if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) id = parts[1];
  }
  return id && ID.test(id) ? id : null;
}

const MAX_SECONDS = Number(process.env.MAX_SONG_SECONDS || 1800);

/**
 * Download one video's audio as MP3 into `dir`.
 * Resolves to { file, title, artist, duration }.
 */
export function fetchAudio(id, dir, {
  bin = process.env.YTDLP_BIN || 'yt-dlp',
  cookies = process.env.YTDLP_COOKIES,
  jsRuntime = process.env.YTDLP_JS_RUNTIME ?? 'node',   // YouTube needs one to unlock formats
  timeoutMs = 5 * 60_000,
} = {}) {
  if (!ID.test(id)) return Promise.reject(new Error('bad video id'));
  const args = [
    '--no-playlist', '--no-progress', '--no-warnings', '--quiet',
    '-f', 'bestaudio/best',
    '-x', '--audio-format', 'mp3', '--audio-quality', '2',
    '--match-filter', `duration < ${MAX_SECONDS} & !is_live`,
    '-o', join(dir, '%(id)s.%(ext)s'),
    '--print', 'after_move:%(.{id,title,artist,creator,uploader,channel,duration})j',
    ...(cookies ? ['--cookies', cookies] : []),
    ...(jsRuntime ? ['--js-runtimes', jsRuntime] : []),
    `https://www.youtube.com/watch?v=${id}`,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(e.code === 'ENOENT' ? 'yt-dlp is not installed on the server' : e.message));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(friendly(err) || `yt-dlp exited with ${code}`));
      const line = out.trim().split('\n').pop();
      if (!line) return reject(new Error(`Skipped: longer than ${Math.round(MAX_SECONDS / 60)} minutes, or a live stream`));
      let info;
      try { info = JSON.parse(line); } catch { return reject(new Error('could not read yt-dlp output')); }
      resolve({
        file: join(dir, `${id}.mp3`),
        title: info.title || id,
        artist: info.artist || info.creator || info.uploader || info.channel || '',
        duration: Math.round(Number(info.duration) || 0),
      });
    });
  });
}

/* The last ERROR line, without yt-dlp's prefix — enough to show in the app. */
function friendly(stderr) {
  const line = stderr.split('\n').filter((l) => l.includes('ERROR')).pop() || '';
  if (/confirm you.?re not a bot|sign in to confirm/i.test(line)) {
    return 'YouTube is asking the server to sign in. Add a cookies file (see server/README.md).';
  }
  return line.replace(/^ERROR:\s*(\[[^\]]+\]\s*[\w-]+:\s*)?/, '').slice(0, 200);
}
