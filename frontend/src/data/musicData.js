/**
 * musicData.js
 * Clean data structures and taxonomy definitions for Tunely.
 * All tracks and playlists are dynamically populated live from the user's library and YouTube Music.
 */

export const defaultTrack = null;
export const recommended = [];
export const recentlyPlayed = [];
export const initialQueue = [];
export const allTracks = [];
export const initialPlaylists = [];

export const genresList = [
  { name: 'All', icon: '✨', gradient: 'from-zinc-800 to-zinc-950' },
  { name: 'Pop', icon: '🎤', gradient: 'from-pink-900/60 to-purple-950/80' },
  { name: 'Hip-Hop', icon: '🎧', gradient: 'from-amber-900/60 to-zinc-950/80' },
  { name: 'Rock', icon: '🎸', gradient: 'from-red-950/60 to-zinc-950/80' },
  { name: 'R&B / Soul', icon: '🎷', gradient: 'from-purple-950/60 to-indigo-950/80' },
  { name: 'Electronic / Dance', icon: '🎛️', gradient: 'from-cyan-950/60 to-blue-950/80' },
  { name: 'Indie & Alternative', icon: '🌿', gradient: 'from-emerald-950/60 to-teal-950/80' },
  { name: 'Metal', icon: '⚡', gradient: 'from-neutral-900 to-stone-950' },
  { name: 'Jazz', icon: '🎺', gradient: 'from-amber-950/60 to-yellow-950/80' },
  { name: 'Classical', icon: '🎻', gradient: 'from-slate-900 to-blue-950' },
  { name: 'Acoustic / Folk', icon: '🪕', gradient: 'from-orange-950/60 to-amber-950' },
  { name: 'Ambient / Chill', icon: '🌌', gradient: 'from-blue-950/60 to-violet-950' },
  { name: 'Bollywood / Desi', icon: '🪘', gradient: 'from-rose-950/60 to-orange-950' },
  { name: 'K-Pop', icon: '🌟', gradient: 'from-fuchsia-950/60 to-pink-950' },
  { name: 'Country', icon: '🤠', gradient: 'from-yellow-950/60 to-stone-950' },
  { name: 'Reggae', icon: '🏝️', gradient: 'from-green-950/60 to-emerald-950' },
];

export const moodsList = [
  { id: 'All', label: 'All Moods', emoji: '✨' },
  { id: 'Chill', label: 'Chill & Relax', emoji: '☕' },
  { id: 'Workout', label: 'Workout & Gym', emoji: '💪' },
  { id: 'Energy', label: 'High Energy', emoji: '⚡' },
  { id: 'Party', label: 'Party Vibes', emoji: '🎉' },
  { id: 'Focus', label: 'Deep Focus', emoji: '🧠' },
  { id: 'Romance', label: 'Romance', emoji: '❤️' },
  { id: 'Late Night', label: 'Night Drive', emoji: '🌙' },
  { id: 'Sad', label: 'Melancholy', emoji: '🌧️' },
];
