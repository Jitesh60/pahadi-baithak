/** Cover art comes free with the video id — no separate image to host. */
export const thumb = (t) => (t && t.yt ? `https://i.ytimg.com/vi/${t.yt}/mqdefault.jpg` : '');

/** Seconds to m:ss. */
export function clock(s) {
  if (!isFinite(s) || s < 0) s = 0;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
