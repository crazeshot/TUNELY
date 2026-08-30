/**
 * lyricsService.js
 * High-precision .LRC synchronized lyrics engine and LRCLIB free open API integration.
 */

export function parseLRC(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return [];

  const lines = lrcString.split('\n');
  const result = [];
  // Regex matches [mm:ss.xx] or [mm:ss] or [mm:ss:xx]
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    timeRegex.lastIndex = 0;
    const match = timeRegex.exec(trimmed);

    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3]
        ? parseInt(match[3].length === 2 ? match[3] + '0' : match[3], 10)
        : 0;

      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      const text = trimmed.replace(timeRegex, '').trim();

      if (text) {
        result.push({
          time: timeInSeconds,
          text,
        });
      }
    } else if (trimmed && !trimmed.startsWith('[')) {
      // Plain line without timestamp
      result.push({
        time: null,
        text: trimmed,
      });
    }
  }

  return result.sort((a, b) => (a.time || 0) - (b.time || 0));
}

export function getActiveLyricIndex(parsedLyrics, currentTime) {
  if (!parsedLyrics || parsedLyrics.length === 0) return -1;

  for (let i = parsedLyrics.length - 1; i >= 0; i--) {
    if (parsedLyrics[i].time !== null && currentTime >= parsedLyrics[i].time) {
      return i;
    }
  }
  return 0;
}

const lyricsCache = new Map();

export async function fetchLyricsFromLRCLIB(artist, title) {
  if (!artist || !title) return null;
  const key = `${artist.toLowerCase()}-${title.toLowerCase()}`;
  if (lyricsCache.has(key)) return lyricsCache.get(key);

  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const result = {
      syncedLyrics: data.syncedLyrics || null,
      plainLyrics: data.plainLyrics || null,
    };
    lyricsCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}
