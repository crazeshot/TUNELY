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
  { name: 'All', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Pop', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Hip-Hop', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Rock', color: 'from-neutral-700 to-neutral-800' },
  { name: 'R&B / Soul', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Electronic / Dance', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Indie & Alternative', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Acoustic / Folk', color: 'from-neutral-700 to-neutral-800' },
  { name: 'Ambient / Chill', color: 'from-neutral-700 to-neutral-800' },
];

export const moodsList = [
  'All',
  'Relax',
  'Energy Boost',
  'Workout',
  'Focus / Study',
  'Late Night',
  'Party',
  'Romance',
];
