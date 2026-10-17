/* A playlist travels as plain YouTube ids in the URL: /?list=id1,id2,…
   No account, no server — the link *is* the playlist. */

const PARAM = 'list';
const ID = /^[\w-]{6,20}$/;

export function listLink(ids) {
  const url = new URL('/', window.location.origin);
  url.searchParams.set(PARAM, ids.join(','));
  return url.toString();
}

/** Ids from the current address, or [] when nobody shared anything. */
export function readSharedList() {
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  if (!raw) return [];
  return [...new Set(raw.split(',').map((s) => s.trim()).filter((s) => ID.test(s)))];
}

/** Tidy the address bar once the shared list has been dealt with. */
export function clearSharedList() {
  const url = new URL(window.location.href);
  url.searchParams.delete(PARAM);
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

export const shareText = (n) => `पहाड़ी बैठक — मेरी सूची के ${n} गाने सुनो 🎶`;

/**
 * The phone's own share sheet when there is one, else copy the link.
 * Resolves to 'shared', 'copied', or 'cancelled'.
 */
export async function shareList(ids) {
  const url = listLink(ids);
  const text = shareText(ids.length);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Pahadi Baithak', text, url });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.prompt('यह लिंक कॉपी करें', url);
  }
  return 'copied';
}

export const whatsappHref = (ids) =>
  `https://wa.me/?text=${encodeURIComponent(`${shareText(ids.length)}\n${listLink(ids)}`)}`;
