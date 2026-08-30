/**
 * api.js
 * Comprehensive REST API Client for Tunely backend with JWT/Token Auth,
 * Track Radio, Daily Mixes, and Tunely Wrapped.
 */
import { allTracks, initialPlaylists } from '../data/musicData';

const BASE_URL = 'http://127.0.0.1:8000/api';

const clientSearchCache = new Map();
let trendingCache = null;
let trendingCacheTime = 0;

function getAuthHeaders() {
  const token = localStorage.getItem('tunely_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

export const api = {
  // ── AUTHENTICATION ───────────────────────────────────────────────
  async register({ username, email, password, display_name }) {
    try {
      const res = await fetch(`${BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, display_name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      if (data.token) {
        localStorage.setItem('tunely_auth_token', data.token);
      }
      return data;
    } catch (err) {
      console.warn('[API] Registration error:', err.message);
      throw err;
    }
  },

  async login(username, password) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      if (data.token) {
        localStorage.setItem('tunely_auth_token', data.token);
      }
      return data;
    } catch (err) {
      console.warn('[API] Login error:', err.message);
      throw err;
    }
  },

  async logout() {
    try {
      await fetch(`${BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('tunely_auth_token');
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${BASE_URL}/auth/me/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return await res.json();
    } catch {
      return {
        is_guest: true,
        username: 'Guest Audiophile',
        display_name: 'Guest Audiophile',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        bio: 'Streaming on Tunely Guest Mode',
        total_minutes_listened: 1420,
      };
    }
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${BASE_URL}/auth/me/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      });
      return await res.json();
    } catch (err) {
      console.warn('[API] Profile update error:', err);
      return null;
    }
  },

  async getWrapped() {
    try {
      const res = await fetch(`${BASE_URL}/auth/wrapped/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Wrapped fetch failed');
      return await res.json();
    } catch {
      return {
        year: 2026,
        total_minutes_streamed: 4820,
        top_genres: ['Dream Pop', 'Psychedelic Pop', 'Synthwave'],
        top_tracks: allTracks.slice(0, 5),
        music_personality: {
          title: 'Atmospheric Voyager',
          desc: 'You dwell in ethereal soundscapes, dream pop frequencies, and late-night synths.',
        },
        listening_streak_days: 42,
        vibes_summary: 'Dreamy, Late-Night, Ambient, Sophisticated',
      };
    }
  },

  // ── TRACK RADIO & DAILY MIX ──────────────────────────────────────
  async getTrackRadio(trackId) {
    try {
      const res = await fetch(`${BASE_URL}/tracks/${trackId}/radio/`);
      if (!res.ok) throw new Error('Radio failed');
      return await res.json();
    } catch {
      return {
        station_title: 'Track Radio',
        tracks: allTracks.filter(t => t.id !== trackId).slice(0, 8),
      };
    }
  },

  async getDailyMixes() {
    try {
      const res = await fetch(`${BASE_URL}/daily-mix/`);
      if (!res.ok) throw new Error('Daily mix fetch failed');
      return await res.json();
    } catch {
      return [];
    }
  },

  // ── CATALOG & PLAYBACK ───────────────────────────────────────────
  async getTracks(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${BASE_URL}/tracks/${query ? `?${query}` : ''}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      return allTracks;
    }
  },

  async getRecommended() {
    try {
      const res = await fetch(`${BASE_URL}/tracks/recommended/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      return allTracks.slice(0, 8);
    }
  },

  async toggleLike(trackId) {
    try {
      const res = await fetch(`${BASE_URL}/tracks/${trackId}/like/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return await res.json();
    } catch {
      return { liked: true };
    }
  },

  async recordPlay(trackId) {
    try {
      await fetch(`${BASE_URL}/tracks/${trackId}/play/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Ignore
    }
  },

  async getPlaylists() {
    try {
      const res = await fetch(`${BASE_URL}/playlists/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      return initialPlaylists;
    }
  },

  async createPlaylist({ title, description, cover_url }) {
    try {
      const res = await fetch(`${BASE_URL}/playlists/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, description, cover_url, is_public: true }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async addTrackToPlaylist(playlistId, trackId) {
    try {
      const res = await fetch(`${BASE_URL}/playlists/${playlistId}/add-track/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ track_id: trackId }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async removeTrackFromPlaylist(playlistId, trackId) {
    try {
      const res = await fetch(`${BASE_URL}/playlists/${playlistId}/remove-track/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ track_id: trackId }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },

  async search(query) {
    const qKey = (query || '').toLowerCase().trim();
    if (!qKey) return { tracks: [], artists: [], albums: [], playlists: [] };
    if (clientSearchCache.has(`local_${qKey}`)) {
      return clientSearchCache.get(`local_${qKey}`);
    }
    try {
      const res = await fetch(`${BASE_URL}/search/?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      clientSearchCache.set(`local_${qKey}`, data);
      return data;
    } catch {
      return { tracks: [], artists: [], albums: [], playlists: [] };
    }
  },

  // ── YOUTUBE MUSIC METHODS ─────────────────────────────────────────
  async searchYTM(query, limit = 16) {
    const qKey = (query || '').toLowerCase().trim();
    if (!qKey) return [];
    const cacheKey = `ytm_${qKey}_${limit}`;
    if (clientSearchCache.has(cacheKey)) {
      return clientSearchCache.get(cacheKey);
    }
    try {
      const res = await fetch(`${BASE_URL}/ytm/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!res.ok) throw new Error('YTM search failed');
      const data = await res.json();
      const results = (data.tracks || []).map((t) => ({
        ...t,
        audio_url: `${BASE_URL}/ytm/stream/${t.videoId}/`,
      }));
      clientSearchCache.set(cacheKey, results);
      if (clientSearchCache.size > 200) {
        const firstKey = clientSearchCache.keys().next().value;
        clientSearchCache.delete(firstKey);
      }
      return results;
    } catch (err) {
      console.warn('[API] YTM search note:', err.message);
      return [];
    }
  },

  async getYTMTrending() {
    const now = Date.now();
    if (trendingCache && now - trendingCacheTime < 300000) { // 5 min cache
      return trendingCache;
    }
    try {
      const res = await fetch(`${BASE_URL}/ytm/trending/`);
      if (!res.ok) throw new Error('YTM trending failed');
      const data = await res.json();
      const results = (data.tracks || []).map((t) => ({
        ...t,
        audio_url: `${BASE_URL}/ytm/stream/${t.videoId}/`,
      }));
      trendingCache = results;
      trendingCacheTime = now;
      return results;
    } catch (err) {
      console.warn('[API] YTM trending note:', err.message);
      return [];
    }
  },

  async getYTMLyrics(videoId) {
    try {
      const res = await fetch(`${BASE_URL}/ytm/lyrics/${videoId}/`);
      if (!res.ok) throw new Error('YTM lyrics failed');
      const data = await res.json();
      return data.lyrics || null;
    } catch {
      return null;
    }
  },
};
