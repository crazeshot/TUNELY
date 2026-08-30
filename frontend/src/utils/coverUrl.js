/**
 * coverUrl.js
 * High-speed artwork resolver with backend proxy for restricted Google/YTM CDN images
 * and direct CDN fetching for open YouTube artwork.
 */

const BASE_URL = 'http://127.0.0.1:8000/api';
const FALLBACK = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';

// Google domains that enforce strict referrer policies and need server-side proxy
const RESTRICTED_DOMAINS = [
  'googleusercontent.com',
  'ggpht.com',
];

function needsProxy(url) {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return RESTRICTED_DOMAINS.some((d) => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

/**
 * Returns the correct cover image URL for a track.
 * - Proxies restricted Google thumbnails through high-performance memory cached endpoint.
 * - Directly streams YouTube video thumbnails from Google edge CDN for instant loading.
 *
 * @param {object} track - track object with cover_url, cover, videoId fields
 * @returns {string} - a fast, loadable image URL
 */
export function getCoverUrl(track) {
  if (!track) return FALLBACK;

  const raw = track.cover_url || track.cover || null;
  const isGenericUnsplash = raw && raw.includes('photo-1518709268805');

  // If genuine track artwork is present
  if (raw && !isGenericUnsplash) {
    if (needsProxy(raw)) {
      return `${BASE_URL}/ytm/thumbnail/?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  }

  // Blazing fast direct CDN thumbnail
  if (track.videoId) {
    return `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
  }

  if (raw) return raw;

  return FALLBACK;
}

/**
 * onError handler for <img> tags.
 * Falls back to proxy if direct fails, then Unsplash placeholder.
 */
export function handleCoverError(e, track) {
  const el = e.currentTarget;
  if (track?.videoId && !el.dataset.proxyTried) {
    el.dataset.proxyTried = '1';
    el.src = `${BASE_URL}/ytm/thumbnail/?url=${encodeURIComponent(`https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`)}`;
  } else {
    el.src = FALLBACK;
  }
}
