/**
 * musicData.js
 * Central data store — all mock track / album objects.
 * Replace these with real API calls in production.
 */

export const recommended = [
  { id: 1, title: 'Borderline',      artist: 'Tame Impala',             cover: 'https://picsum.photos/seed/borderline99/300/400',  duration: '4:06', durationSeconds: 246 },
  { id: 2, title: 'King',            artist: 'Florence + The Machine',  cover: 'https://picsum.photos/seed/florence42/300/400',    duration: '3:58', durationSeconds: 238 },
  { id: 3, title: 'Blinding Lights', artist: 'The Weeknd',              cover: 'https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/2fd96f95651575.5e9c9b1750fb3.png',      duration: '3:20', durationSeconds: 200 },
  { id: 4, title: 'Nude',            artist: 'Radiohead',               cover: 'https://picsum.photos/seed/radiohead11/300/400',   duration: '4:15', durationSeconds: 255 },
];

export const recentlyPlayed = [
  { id: 5, title: '22 (OVER S∞∞N)', artist: 'Bon Iver',        cover: 'https://picsum.photos/seed/boniver55/300/400',    duration: '3:57', durationSeconds: 237 },
  { id: 6, title: 'Kyoto',          artist: 'Phoebe Bridgers', cover: 'https://picsum.photos/seed/phoebe22/300/400',     duration: '3:05', durationSeconds: 185 },
  { id: 7, title: 'Pink + White',   artist: 'Frank Ocean',     cover: 'https://picsum.photos/seed/frankblond/300/400',   duration: '3:04', durationSeconds: 184 },
  { id: 8, title: 'Green Light',    artist: 'Lorde',           cover: 'https://picsum.photos/seed/lordegreen/300/400',   duration: '3:53', durationSeconds: 233 },
];

export const initialQueue = [
  { id: 9,  title: 'Get Lucky',            artist: 'Daft Punk',      cover: 'https://picsum.photos/seed/daftpunk9/60/60',   duration: '4:08' },
  { id: 10, title: 'Rolling in the Deep',  artist: 'Adele',          cover: 'https://picsum.photos/seed/adele10/60/60',     duration: '3:49' },
  { id: 11, title: 'Do I Wanna Know?',     artist: 'Arctic Monkeys', cover: 'https://picsum.photos/seed/arctic11/60/60',    duration: '4:32' },
  { id: 12, title: 'Video Games',          artist: 'Lana Del Rey',   cover: 'https://picsum.photos/seed/lana12/60/60',      duration: '4:39' },
];

export const defaultTrack = {
  id: 0,
  title: 'Midnight City',
  artist: 'MBS',
  cover: 'https://picsum.photos/seed/m83mid/60/60',
  duration: '4:03',
  durationSeconds: 243,
};
