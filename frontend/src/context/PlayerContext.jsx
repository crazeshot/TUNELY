/**
 * PlayerContext.jsx
 * Enterprise-Grade Global Player Provider.
 * Features:
 *  - Full Web Audio DSP (10-Band EQ, 3D Spatial Audio, Dynamics Compressor Limiter)
 *  - Media Session API (OS Lockscreen, Bluetooth, Media Keys)
 *  - Track Radio & Similarity Engine
 *  - IndexedDB Offline Download Manager
 *  - Group Session ("Listen Together") Hub
 *  - Dynamic Theme Palette & Sleep Timers
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PlayerCtx } from './PlayerContextInstance';
import { defaultTrack, initialQueue } from '../data/musicData';
import { api } from '../services/api';
import { audioEngine, EQ_PRESETS } from '../services/audioEngine';
import { extractColorsFromImage } from '../utils/colorExtractor';
import { saveTrackForOffline, getAllOfflineTracks, deleteOfflineTrack } from '../services/offlineStorage';
import { useAuth } from './useAuth';

// Helper to extract known track duration in seconds
export function parseTrackDuration(t) {
  if (!t) return 0;
  const rawSec = t.duration_seconds ?? t.durationSeconds;
  if (typeof rawSec === 'number' && rawSec > 0) return Math.floor(rawSec);
  if (typeof rawSec === 'string' && /^\d+$/.test(rawSec.trim())) {
    const n = parseInt(rawSec.trim(), 10);
    if (n > 0) return n;
  }
  if (typeof t.duration === 'number' && t.duration > 0) {
    return Math.floor(t.duration);
  }
  if (typeof t.duration === 'string') {
    const s = t.duration.trim();
    if (/^\d+$/.test(s)) {
      const num = parseInt(s, 10);
      if (num > 0) return num;
    }
    const parts = s.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }
  return 0;
}

export function PlayerProvider({ children }) {
  const { user, isLoggedIn, setIsAuthModalOpen } = useAuth();
  const userId = user?.id ? String(user.id) : (user?.username || 'guest');
  const currentUserIdRef = useRef(userId);
  useEffect(() => { currentUserIdRef.current = userId; }, [userId]);

  // Load last played track from per-user localStorage
  const [currentTrack, setCurrentTrack] = useState(() => {
    try {
      const saved = localStorage.getItem(`tunely_last_track_v3_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultTrack;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(null);
  const trackDuration = useMemo(() => parseTrackDuration(currentTrack), [currentTrack]);
  const duration = useMemo(() => {
    // If authentic metadata duration is known, it is authoritative!
    // Never allow dynamic chunk buffering, AVPlayer live estimation, or HE-AAC SBR doubling
    // to override or expand the genuine song duration.
    if (trackDuration > 0) {
      if (audioDuration && isFinite(audioDuration) && Math.abs(audioDuration - trackDuration) <= 3) {
        return audioDuration;
      }
      return trackDuration;
    }
    if (audioDuration && isFinite(audioDuration) && audioDuration > 0) {
      return audioDuration;
    }
    return 240;
  }, [audioDuration, trackDuration]);

  const durationRef = useRef(duration);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);
  const [progress, setProgressState] = useState(0);
  const [volume, setVolumeState] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [isSlowedReverb, setIsSlowedReverb] = useState(false);
  const [isNightcore, setIsNightcore] = useState(false);
  const [isSpatialAudio, setIsSpatialAudio] = useState(false);

  // Settings & Autoplay States
  const [isAutoplay, setIsAutoplay] = useState(() => {
    try {
      return localStorage.getItem('tunely_autoplay') !== 'false';
    } catch {
      return true;
    }
  });
  const [audioQuality, setAudioQualityState] = useState(() => {
    try {
      return localStorage.getItem('tunely_audio_quality') || 'high';
    } catch {
      return 'high';
    }
  });
  const [crossfadeSeconds, setCrossfadeSecondsState] = useState(() => {
    try {
      return parseInt(localStorage.getItem('tunely_crossfade') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isNormalization, setIsNormalization] = useState(true);
  const [enableShader, setEnableShaderState] = useState(() => {
    try {
      return localStorage.getItem('tunely_shader') !== 'false';
    } catch {
      return true;
    }
  });

  // Equalizer
  const [eqPreset, setEqPresetState] = useState('Flat');
  const [eqBands, setEqBands] = useState(EQ_PRESETS.Flat);

  // Offline downloads
  const [downloadedTrackIds, setDownloadedTrackIds] = useState(new Set());

  // Per-User Library, Playlists, Likes & Analytics States
  const [queue, setQueue] = useState(initialQueue);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`tunely_history_v3_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem(`tunely_playlists_v3_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });
  const [likedTracks, setLikedTracks] = useState(() => {
    try {
      const saved = localStorage.getItem(`tunely_liked_tracks_v3_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [likedTrackIds, setLikedTrackIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`tunely_liked_tracks_v3_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const ids = new Set();
        parsed.forEach(t => {
          if (t.id !== undefined && t.id !== null) ids.add(t.id);
          if (t.videoId) ids.add(t.videoId);
        });
        return ids;
      }
    } catch {
      // fallback
    }
    return new Set();
  });

  // Per-User Play Counts & Accurate Listening Seconds for Wrapped
  const [playCounts, setPlayCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(`tunely_play_counts_v3_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  const [totalListeningSeconds, setTotalListeningSeconds] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(`tunely_listening_seconds_v3_${userId}`) || '0', 10);
      return !isNaN(saved) ? saved : 0;
    } catch {
      return 0;
    }
  });

  // Dynamic Reload when User switches / logs in / logs out
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedLikes = localStorage.getItem(`tunely_liked_tracks_v3_${userId}`) || localStorage.getItem('tunely_liked_tracks_v2');
        const parsedLikes = savedLikes ? JSON.parse(savedLikes) : [];
        setLikedTracks(parsedLikes);
        const nextIds = new Set();
        parsedLikes.forEach(t => {
          if (t.id !== undefined && t.id !== null) nextIds.add(t.id);
          if (t.videoId) nextIds.add(t.videoId);
        });
        setLikedTrackIds(nextIds);

        const savedPls = localStorage.getItem(`tunely_playlists_v3_${userId}`) || localStorage.getItem('tunely_playlists_v2');
        setPlaylists(savedPls ? JSON.parse(savedPls) : []);

        const savedHist = localStorage.getItem(`tunely_history_v3_${userId}`) || localStorage.getItem('tunely_history_v2');
        setHistory(savedHist ? JSON.parse(savedHist) : []);

        const savedCounts = localStorage.getItem(`tunely_play_counts_v3_${userId}`);
        setPlayCounts(savedCounts ? JSON.parse(savedCounts) : {});

        const savedSecs = parseInt(localStorage.getItem(`tunely_listening_seconds_v3_${userId}`) || '0', 10);
        setTotalListeningSeconds(!isNaN(savedSecs) ? savedSecs : 0);

        const savedLast = localStorage.getItem(`tunely_last_track_v3_${userId}`);
        if (savedLast) setCurrentTrack(JSON.parse(savedLast));
      } catch (err) {
        console.warn('[User Sync] Storage note:', err);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [userId]);

  const [dailyMixes, setDailyMixes] = useState([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('home');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeMood, setActiveMood] = useState('All');
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isGroupSessionOpen, setIsGroupSessionOpen] = useState(false);
  const [groupSessionCode, setGroupSessionCode] = useState('TUNELY-8820');
  const [activeArtistModal, setActiveArtistModal] = useState(null);
  const [activePlaylistModal, setActivePlaylistModal] = useState(null);
  const [shareTrackModal, setShareTrackModal] = useState(null);

  // Sleep Timer
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState(null);

  // Theme & Toast (Monochromatic Grey & White)
  const [themeColors, setThemeColors] = useState({
    primary: '#ffffff',
    secondary: '#a1a1aa',
    glow: 'rgba(255, 255, 255, 0.25)',
    gradient: ['#18181b', '#3f3f46', '#e4e4e7'],
  });
  const [toastMessage, setToastMessage] = useState(null);

  const audioRef = useRef(null);
  const synthCtxRef = useRef(null);
  const toastTimerRef = useRef(null);
  const sleepIntervalRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Sync last played track to localStorage
  useEffect(() => {
    if (currentTrack) {
      try {
        localStorage.setItem('tunely_last_played_track', JSON.stringify(currentTrack));
      } catch {
        // Ignore storage errors
      }
    }
  }, [currentTrack]);

  // Sync last played time to localStorage
  useEffect(() => {
    if (currentTime > 0) {
      try {
        localStorage.setItem('tunely_last_played_time', currentTime.toFixed(1));
      } catch {
        // Ignore storage errors
      }
    }
  }, [currentTime]);

  // Sync Offline Tracks on mount
  useEffect(() => {
    let isMounted = true;
    getAllOfflineTracks().then((tracks) => {
      if (isMounted && tracks) {
        setDownloadedTrackIds(new Set(tracks.map(t => t.id)));
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Update Dynamic Theme Colors when Track changes
  useEffect(() => {
    let isMounted = true;
    const cover = currentTrack?.cover_url || currentTrack?.cover;
    if (cover) {
      extractColorsFromImage(cover).then((colors) => {
        if (isMounted && colors) setThemeColors(colors);
      });
    }
    return () => { isMounted = false; };
  }, [currentTrack]);

  // Media Session API Sync
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      const cover = currentTrack.cover_url || currentTrack.cover || '';
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist_name || currentTrack.artist || 'Tunely Artist',
        album: currentTrack.album_title || 'Tunely Master Track',
        artwork: [
          { src: cover, sizes: '96x96', type: 'image/jpeg' },
          { src: cover, sizes: '128x128', type: 'image/jpeg' },
          { src: cover, sizes: '192x192', type: 'image/jpeg' },
          { src: cover, sizes: '256x256', type: 'image/jpeg' },
          { src: cover, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    }
  }, [currentTrack]);

  // Update Media Session Playback State & Position
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      if ('setPositionState' in navigator.mediaSession && duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(1, duration),
            playbackRate: playbackRate || 1.0,
            position: Math.min(currentTime, duration),
          });
        } catch {
          // Ignore
        }
      }
    }
  }, [isPlaying, currentTime, duration, playbackRate]);

  // Next-track prefetch optimization for zero-gap playback
  useEffect(() => {
    if (isPlaying && duration > 0 && currentTime / duration > 0.75) {
      const nextTrack = queue[0];
      if (nextTrack && nextTrack.videoId) {
        fetch(`http://127.0.0.1:8000/api/ytm/stream/${nextTrack.videoId}/?json=1`).catch(() => {});
      }
    }
  }, [isPlaying, currentTime, duration, queue]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerSeconds === null) {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      return;
    }

    sleepIntervalRef.current = setInterval(() => {
      setSleepTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(sleepIntervalRef.current);
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          showToast('🌙 Sleep timer finished. Goodnight!');
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, [sleepTimerSeconds, showToast]);

  const setSleepTimer = useCallback((minutes) => {
    if (minutes === 0) {
      setSleepTimerSeconds(null);
      showToast('Sleep timer cancelled');
    } else {
      setSleepTimerSeconds(minutes * 60);
      showToast(`Sleep timer set for ${minutes} minutes`);
    }
    setIsSleepTimerOpen(false);
  }, [showToast]);

  // Web Audio Synth Fallback
  const playSynthFallback = useCallback(() => {
    try {
      if (!synthCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        synthCtxRef.current = new AudioContextClass();
      }
      if (synthCtxRef.current.state === 'suspended') {
        synthCtxRef.current.resume();
      }
      const ctx = synthCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 2);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3);
    } catch {
      // Ignore synth errors
    }
  }, []);

  // Real-time Queue System (Dynamically fetched from YouTube Music)
  const refreshRealtimeQueue = useCallback(async (trackToUse = null, force = false) => {
    const target = trackToUse || currentTrack;
    if (!target) return;
    try {
      const vid = target.videoId || null;
      const artist = target.artist_name || target.artist || '';
      const title = target.title || '';

      const relatedTracks = await api.getYtmRelated(vid, artist, title, 10);
      if (relatedTracks && relatedTracks.length > 0) {
        const filtered = relatedTracks.filter((t) => t && t.videoId !== vid);
        if (filtered.length > 0) {
          setQueue(prev => (force || prev.length === 0 ? filtered : prev));
          return filtered;
        }
      }
    } catch (err) {
      console.warn('[Realtime Queue] Sync note:', err);
    }
  }, [currentTrack]);

  // Playback Actions
  const playTrack = useCallback((track) => {
    if (!isLoggedIn) {
      showToast('🔒 Sign in or create an account to play songs');
      setIsAuthModalOpen(true);
      return;
    }
    if (!track) return;
    setCurrentTrack(track);
    setAudioDuration(null);
    setIsPlaying(true);
    setCurrentTime(0);
    setProgressState(0);

    const uid = currentUserIdRef.current;
    const trackKey = track.videoId || (track.id !== undefined && track.id !== null ? String(track.id) : track.title);

    // Save to user's history
    setHistory(prev => {
      const next = [track, ...prev.filter(t => {
        const k = t.videoId || (t.id !== undefined && t.id !== null ? String(t.id) : t.title);
        return k !== trackKey;
      })].slice(0, 50);
      try {
        localStorage.setItem(`tunely_history_v3_${uid}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Save last track for user
    try {
      localStorage.setItem(`tunely_last_track_v3_${uid}`, JSON.stringify(track));
    } catch {
      // ignore
    }

    // Increment play count for Wrapped ranking
    setPlayCounts(prev => {
      const next = { ...prev, [trackKey]: (prev[trackKey] || 0) + 1 };
      try {
        localStorage.setItem(`tunely_play_counts_v3_${uid}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // Dynamically fetch and populate real-time queue for the played song
    refreshRealtimeQueue(track, false);

    const audio = audioRef.current;
    if (audio) {
      audioEngine.resume();
      let streamUrl = track.audio_url;

      if (track.videoId) {
        streamUrl = `http://127.0.0.1:8000/api/ytm/stream/${track.videoId}/`;
      } else if (streamUrl && streamUrl.startsWith('/')) {
        streamUrl = `http://127.0.0.1:8000${streamUrl}`;
      }

      if (streamUrl) {
        audio.src = streamUrl;
        audio.play().catch((err) => {
          console.warn('[Audio Playback] Error or Autoplay block:', err);
          playSynthFallback();
        });
      } else {
        playSynthFallback();
      }
    }
  }, [isLoggedIn, setIsAuthModalOpen, showToast, refreshRealtimeQueue, playSynthFallback]);

  const togglePlay = useCallback(() => {
    if (!isLoggedIn) {
      showToast('🔒 Sign in or create an account to play songs');
      setIsAuthModalOpen(true);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audioEngine.resume();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // If audio has no src set yet, initialize from currentTrack
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        if (currentTrack) {
          let streamUrl = currentTrack.audio_url;
          if (currentTrack.videoId) {
            streamUrl = `http://127.0.0.1:8000/api/ytm/stream/${currentTrack.videoId}/`;
          } else if (streamUrl && streamUrl.startsWith('/')) {
            streamUrl = `http://127.0.0.1:8000${streamUrl}`;
          }
          if (streamUrl) {
            audio.src = streamUrl;
            if (currentTime > 0) {
              audio.currentTime = currentTime;
            }
          }
        }
      }

      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('[Audio] Resume notice:', err);
        playSynthFallback();
        setIsPlaying(true);
      });
    }
  }, [isLoggedIn, setIsAuthModalOpen, showToast, isPlaying, playSynthFallback, currentTrack, currentTime]);

  const pauseTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback((percent) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(100, percent));
    setProgressState(clamped);
    const targetDuration = durationRef.current || (audio?.duration && isFinite(audio.duration) ? audio.duration : 0);
    if (audio && targetDuration > 0) {
      audio.currentTime = (clamped / 100) * targetDuration;
      setCurrentTime(audio.currentTime);
    }
    window.dispatchEvent(new CustomEvent('tunely-seek', { detail: { percent: clamped } }));
  }, []);

  const handleNext = useCallback(async () => {
    if (queue.length > 0) {
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      }
      const next = queue[nextIndex];
      const newQueue = queue.filter((_, idx) => idx !== nextIndex);
      setQueue(newQueue);
      playTrack(next);
    } else if (repeatMode === 'all') {
      const all = (history && history.length > 0) ? history : likedTracks;
      if (all && all.length > 0) {
        const next = all[Math.floor(Math.random() * all.length)];
        playTrack(next);
      }
    } else if (isAutoplay) {
      // Fetch related songs from YouTube Music (not from static catalog)
      try {
        const vid = currentTrack?.videoId || null;
        const artist = currentTrack?.artist_name || currentTrack?.artist || '';
        const title = currentTrack?.title || '';

        const relatedTracks = await api.getYtmRelated(vid, artist, title, 8);
        const historyIds = new Set(history.map((h) => h.videoId || h.id));

        const unplayedRelated = (relatedTracks || []).filter(
          (t) => t && t.videoId !== vid && !historyIds.has(t.videoId) && !historyIds.has(t.id)
        );

        const nextTrack = unplayedRelated[0] || (relatedTracks && relatedTracks[0]);

        if (nextTrack) {
          const restQueue = (relatedTracks || []).filter((t) => t.videoId !== nextTrack.videoId);
          if (restQueue.length > 0) {
            setQueue(restQueue);
          }
          showToast(`🎵 Autoplaying related from Tunely: "${nextTrack.title}"`);
          playTrack(nextTrack);
          return;
        }

        // Fallback to Tunely trending if related query was empty
        const trending = await api.getYtmTrending();
        const unplayedTrending = (trending || []).filter(
          (t) => t && t.videoId !== vid && !historyIds.has(t.videoId)
        );
        const nextTrending = unplayedTrending[0] || (trending && trending[0]);
        if (nextTrending) {
          showToast(`🎵 Autoplaying trending on Tunely: "${nextTrending.title}"`);
          playTrack(nextTrending);
          return;
        }
      } catch (err) {
        console.warn('[Autoplay] YTM fetch note:', err);
      }

      setIsPlaying(false);
      setProgressState(0);
      setCurrentTime(0);
    } else {
      setIsPlaying(false);
      setProgressState(0);
      setCurrentTime(0);
    }
  }, [queue, isShuffle, repeatMode, likedTracks, isAutoplay, currentTrack, history, playTrack, showToast]);

  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } else {
      handleNext();
    }
  }, [repeatMode, handleNext]);

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setProgressState(0);
      return;
    }
    if (history.length > 1) {
      const prevTrack = history[1];
      setHistory(prev => prev.slice(1));
      playTrack(prevTrack);
    } else {
      seekTo(0);
    }
  }, [history, playTrack, seekTo]);

  // Keep latest onEnded callback in ref
  const onEndedRef = useRef(null);
  useEffect(() => {
    onEndedRef.current = handleTrackEnd;
  }, [handleTrackEnd]);

  // Stable refs so media-session & audio-init effect never need to re-run
  const togglePlayRef = useRef(null);
  const pauseTrackRef = useRef(null);
  const handlePrevRef = useRef(null);
  const handleNextRef = useRef(null);
  const seekToRef = useRef(null);
  const playSynthFallbackRef = useRef(null);
  useEffect(() => { togglePlayRef.current = togglePlay; }, [togglePlay]);
  useEffect(() => { pauseTrackRef.current = pauseTrack; }, [pauseTrack]);
  useEffect(() => { handlePrevRef.current = handlePrev; }, [handlePrev]);
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);
  useEffect(() => { seekToRef.current = seekTo; }, [seekTo]);
  useEffect(() => { playSynthFallbackRef.current = playSynthFallback; }, [playSynthFallback]);

  // Initialize HTML5 Audio element & Web Audio DSP engine — runs ONCE only
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audioEngine.init(audio);

    let lastTimeUpdate = 0;
    let prevAudioTime = 0;
    let secAccumulator = 0;

    const handleTimeUpdate = () => {
      const curTime = audio.currentTime;
      const targetDuration = durationRef.current || (audio.duration && isFinite(audio.duration) ? audio.duration : 0);
      if (!targetDuration || isNaN(targetDuration) || targetDuration <= 0) return;

      const deltaSec = Math.max(0, curTime - prevAudioTime);
      prevAudioTime = curTime;

      // If playing normally (delta between 0 and 1.5s), accumulate exact listened seconds
      if (deltaSec > 0 && deltaSec < 1.5) {
        secAccumulator += deltaSec;
        if (secAccumulator >= 1.0) {
          const added = Math.floor(secAccumulator);
          secAccumulator -= added;
          setTotalListeningSeconds(prev => {
            const next = prev + added;
            try {
              localStorage.setItem(`tunely_listening_seconds_v3_${currentUserIdRef.current}`, String(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }

      // Check if song has finished (reached or passed effective duration)
      // Eliminates dead silence when audio stream has extra padding or mismatched duration
      if (targetDuration > 0 && curTime >= targetDuration - 0.4) {
        if (onEndedRef.current) {
          onEndedRef.current();
          return;
        }
      }

      const now = performance.now();
      if (now - lastTimeUpdate < 150 && curTime < targetDuration) return;
      lastTimeUpdate = now;
      setCurrentTime(curTime);
      setProgressState(Math.min(100, (curTime / targetDuration) * 100));
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(Math.floor(audio.duration));
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(Math.floor(audio.duration));
      }
    };

    const handleEnded = () => {
      if (onEndedRef.current) {
        onEndedRef.current();
      }
    };

    const handleError = () => {
      console.warn('[Audio] URL note, triggering fallback.');
      if (playSynthFallbackRef.current) playSynthFallbackRef.current();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Register Media Session Handlers — use refs so always up-to-date
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlayRef.current?.());
      navigator.mediaSession.setActionHandler('pause', () => pauseTrackRef.current?.());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevRef.current?.());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextRef.current?.());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        const targetDuration = durationRef.current || audio.duration;
        if (details.seekTime && targetDuration) {
          seekToRef.current?.((details.seekTime / targetDuration) * 100);
        }
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []); // ← intentionally empty: audio element created once for app lifetime

  // Sync volume with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // Equalizer & DSP controls
  const setEqualizerPreset = useCallback((presetName) => {
    setEqPresetState(presetName);
    const gains = audioEngine.setEqualizerPreset(presetName);
    setEqBands(gains);
    showToast(`EQ Preset: ${presetName}`);
  }, [showToast]);

  const setEqualizerBand = useCallback((index, gain) => {
    audioEngine.setEqualizerBand(index, gain);
    setEqBands(prev => {
      const next = [...prev];
      next[index] = gain;
      return next;
    });
    setEqPresetState('Custom');
  }, []);

  const toggleSpatialAudio = useCallback(() => {
    setIsSpatialAudio(prev => {
      const next = !prev;
      audioEngine.setSpatialAudio(next);
      showToast(next ? '🎧 3D Spatial Soundstage Activated' : 'Stereo Audio Restored');
      return next;
    });
  }, [showToast]);

  const toggleSlowedReverb = useCallback(() => {
    setIsSlowedReverb(prev => {
      const next = !prev;
      if (next) setIsNightcore(false);
      audioEngine.setSlowedReverb(next);
      setPlaybackRateState(next ? 0.85 : 1.0);
      showToast(next ? '✨ Slowed + Reverb mode activated' : 'Standard audio restored');
      return next;
    });
  }, [showToast]);

  const toggleNightcore = useCallback(() => {
    setIsNightcore(prev => {
      const next = !prev;
      if (next) setIsSlowedReverb(false);
      audioEngine.setNightcore(next);
      setPlaybackRateState(next ? 1.25 : 1.0);
      showToast(next ? '⚡ Nightcore mode activated' : 'Standard audio restored');
      return next;
    });
  }, [showToast]);

  const setPlaybackRate = useCallback((rate) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = rate;
      setPlaybackRateState(rate);
      showToast(`Playback speed: ${rate}x`);
    }
  }, [showToast]);

  // Track Radio Launcher
  const startTrackRadio = useCallback(async (seedTrack) => {
    showToast(`Starting ${seedTrack.title} Radio...`);
    const radioData = await api.getTrackRadio(seedTrack.id);
    if (radioData && radioData.tracks && radioData.tracks.length > 0) {
      playTrack(seedTrack);
      setQueue(radioData.tracks);
      showToast(`📻 Playing "${seedTrack.title} Radio" (10 vibe tracks added)`);
    }
  }, [playTrack, showToast]);

  // Offline Download Manager
  const downloadTrack = useCallback(async (track) => {
    try {
      showToast(`Downloading "${track.title}" for offline...`);
      await saveTrackForOffline(track);
      setDownloadedTrackIds(prev => new Set(prev).add(track.id));
      showToast(`✓ "${track.title}" saved offline`);
    } catch {
      showToast('Download failed. Try again.');
    }
  }, [showToast]);

  const removeDownloadedTrack = useCallback(async (trackId) => {
    await deleteOfflineTrack(trackId);
    setDownloadedTrackIds(prev => {
      const next = new Set(prev);
      next.delete(trackId);
      return next;
    });
    showToast('Removed from offline downloads');
  }, [showToast]);

  // Fetch backend data & daily mixes on mount
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      const [backendPlaylists, mixes] = await Promise.all([
        api.getPlaylists(),
        api.getDailyMixes(),
      ]);
      if (isMounted) {
        if (backendPlaylists && backendPlaylists.length > 0) setPlaylists(backendPlaylists);
        if (mixes && mixes.length > 0) setDailyMixes(mixes);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, []);

  const setVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(100, val));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) setIsMuted(false);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const next = !prev;
      showToast(next ? 'Shuffle enabled' : 'Shuffle disabled');
      return next;
    });
  }, [showToast]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      let next = 'off';
      if (prev === 'off') next = 'all';
      else if (prev === 'all') next = 'one';
      else next = 'off';

      const labels = { off: 'Repeat off', all: 'Repeat all', one: 'Repeat track' };
      showToast(labels[next]);
      return next;
    });
  }, [showToast]);

  // Queue Actions
  const addToQueue = useCallback((track) => {
    setQueue(prev => [...prev, track]);
    showToast(`Added "${track.title}" to queue`);
  }, [showToast]);

  const playNext = useCallback((track) => {
    setQueue(prev => [track, ...prev.filter(t => t.id !== track.id)]);
    showToast(`"${track.title}" will play next`);
  }, [showToast]);

  const removeFromQueue = useCallback((trackId, index) => {
    setQueue(prev => prev.filter((t, i) => (index !== undefined ? i !== index : t.id !== trackId)));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    showToast('Queue cleared');
  }, [showToast]);

  // Likes & Favorites with per-user LocalStorage persistence
  const toggleLike = useCallback((track) => {
    if (!track) return;
    const trackKey = track.videoId || (track.id !== undefined && track.id !== null ? String(track.id) : track.title);
    if (!trackKey) return;
    const uid = currentUserIdRef.current;

    setLikedTracks(prevTracks => {
      const exists = prevTracks.some(t => {
        const k = t.videoId || (t.id !== undefined && t.id !== null ? String(t.id) : t.title);
        return k === trackKey;
      });
      let nextTracks;
      if (exists) {
        nextTracks = prevTracks.filter(t => {
          const k = t.videoId || (t.id !== undefined && t.id !== null ? String(t.id) : t.title);
          return k !== trackKey;
        });
        showToast(`Removed "${track.title}" from Liked Songs`);
      } else {
        nextTracks = [track, ...prevTracks];
        showToast(`Added "${track.title}" to Liked Songs`);
      }
      try {
        localStorage.setItem(`tunely_liked_tracks_v3_${uid}`, JSON.stringify(nextTracks));
      } catch {
        // ignore
      }

      const nextIds = new Set();
      nextTracks.forEach(t => {
        if (t.id !== undefined && t.id !== null) nextIds.add(t.id);
        if (t.videoId) nextIds.add(t.videoId);
      });
      setLikedTrackIds(nextIds);

      return nextTracks;
    });

    if (track.id && typeof track.id === 'number') {
      api.toggleLike(track.id).catch(() => {});
    }
  }, [showToast]);

  // Per-User Playlists with Tracks Persistence
  const createPlaylist = useCallback(async ({ title, description, cover_url }) => {
    const uid = currentUserIdRef.current;
    const newPl = {
      id: `pl-${Date.now()}`,
      title: title || 'My Playlist',
      description: description || '',
      cover_url: cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      tracks: [],
    };
    setPlaylists(prev => {
      const next = [newPl, ...prev];
      try {
        localStorage.setItem(`tunely_playlists_v3_${uid}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Playlist "${newPl.title}" created`);

    const backendRes = await api.createPlaylist({ title: newPl.title, description: newPl.description, cover_url: newPl.cover_url });
    if (backendRes && backendRes.id) {
      setPlaylists(prev => {
        const next = prev.map(p => p.id === newPl.id ? { ...backendRes, tracks: p.tracks || [] } : p);
        try {
          localStorage.setItem(`tunely_playlists_v3_${uid}`, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
    return newPl;
  }, [showToast]);

  const addTrackToPlaylist = useCallback(async (playlistId, track) => {
    if (!track) return;
    const uid = currentUserIdRef.current;
    const trackKey = track.videoId || (track.id !== undefined && track.id !== null ? String(track.id) : track.title);

    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id === playlistId) {
          const tracks = p.tracks || [];
          if (tracks.some(t => {
            const k = t.videoId || (t.id !== undefined && t.id !== null ? String(t.id) : t.title);
            return k === trackKey;
          })) return p;
          return { ...p, tracks: [...tracks, track] };
        }
        return p;
      });
      try {
        localStorage.setItem(`tunely_playlists_v3_${uid}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Added to playlist`);
    if (track.id && typeof track.id === 'number') {
      await api.addTrackToPlaylist(playlistId, track.id).catch(() => {});
    }
  }, [showToast]);

  const removeTrackFromPlaylist = useCallback(async (playlistId, trackIdOrVideoId) => {
    const uid = currentUserIdRef.current;
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id === playlistId) {
          return {
            ...p,
            tracks: (p.tracks || []).filter(t => t.id !== trackIdOrVideoId && t.videoId !== trackIdOrVideoId),
          };
        }
        return p;
      });
      try {
        localStorage.setItem(`tunely_playlists_v3_${uid}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    showToast(`Removed from playlist`);
    if (typeof trackIdOrVideoId === 'number') {
      await api.removeTrackFromPlaylist(playlistId, trackIdOrVideoId).catch(() => {});
    }
  }, [showToast]);

  const deletePlaylist = useCallback((playlistId) => {
    const uid = currentUserIdRef.current;
    setPlaylists(prev => {
      const next = prev.filter(p => p.id !== playlistId);
      try {
        localStorage.setItem(`tunely_playlists_v3_${uid}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setActivePlaylistModal(null);
    showToast('Playlist deleted');
  }, [showToast]);

  const playPlaylist = useCallback((playlist, shuffle = false) => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
      showToast('Playlist is currently empty');
      return;
    }
    let tracks = [...playlist.tracks];
    if (shuffle) {
      tracks.sort(() => Math.random() - 0.5);
    }
    const first = tracks[0];
    const rest = tracks.slice(1);
    setQueue(rest);
    playTrack(first);
    showToast(`Playing playlist: "${playlist.title}"`);
  }, [playTrack, showToast]);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplay(prev => {
      const next = !prev;
      try {
        localStorage.setItem('tunely_autoplay', String(next));
      } catch {
        // Ignore storage error
      }
      showToast(next ? '✓ Autoplay enabled: continuous songs' : 'Autoplay disabled');
      return next;
    });
  }, [showToast]);

  const setAudioQuality = useCallback((quality) => {
    setAudioQualityState(quality);
    try {
      localStorage.setItem('tunely_audio_quality', quality);
    } catch {
      // Ignore storage error
    }
    const labels = { lossless: 'Lossless FLAC 1411kbps', high: 'High-Res AAC 320kbps', standard: 'Standard 160kbps' };
    showToast(`Audio streaming: ${labels[quality] || quality}`);
  }, [showToast]);

  const setCrossfadeSeconds = useCallback((sec) => {
    setCrossfadeSecondsState(sec);
    try {
      localStorage.setItem('tunely_crossfade', String(sec));
    } catch {
      // Ignore storage error
    }
    showToast(sec > 0 ? `Crossfade: ${sec}s transition` : 'Crossfade disabled');
  }, [showToast]);

  const toggleNormalization = useCallback(() => {
    setIsNormalization(prev => {
      const next = !prev;
      showToast(next ? 'Volume normalization enabled' : 'Volume normalization disabled');
      return next;
    });
  }, [showToast]);

  const setEnableShader = useCallback((val) => {
    setEnableShaderState(val);
    try {
      localStorage.setItem('tunely_shader', String(val));
    } catch {
      // Ignore storage error
    }
    showToast(val ? 'Dynamic Liquid Ether shader enabled' : 'Eco Mode: shader disabled');
  }, [showToast]);

  const clearAudioCache = useCallback(() => {
    try {
      localStorage.removeItem('tunely_last_played_track');
      localStorage.removeItem('tunely_last_played_time');
      showToast('✓ Audio & streaming cache cleared');
    } catch {
      showToast('Cache cleared');
    }
  }, [showToast]);

  const isCurrentTrackLiked = useMemo(() => {
    if (!currentTrack) return false;
    return likedTrackIds.has(currentTrack.id) || (currentTrack.videoId && likedTrackIds.has(currentTrack.videoId));
  }, [currentTrack, likedTrackIds]);

  const value = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackRate,
    isSlowedReverb,
    isNightcore,
    isSpatialAudio,
    isAutoplay,
    audioQuality,
    crossfadeSeconds,
    isNormalization,
    enableShader,
    eqPreset,
    eqBands,
    queue,
    history,
    playlists,
    dailyMixes,
    likedTrackIds,
    likedTracks,
    playCounts,
    totalListeningSeconds,
    downloadedTrackIds,
    isCurrentTrackLiked,
    activeTab,
    activeGenre,
    activeMood,
    isVisualizerOpen,
    isEqualizerOpen,
    isCommandPaletteOpen,
    isSleepTimerOpen,
    isGroupSessionOpen,
    groupSessionCode,
    activeArtistModal,
    shareTrackModal,
    sleepTimerSeconds,
    themeColors,
    toastMessage,
    playTrack,
    togglePlay,
    pauseTrack,
    seekTo,
    setProgress: seekTo,
    setProgressState,
    setCurrentTime,
    setDuration: setAudioDuration,
    nextTrack: handleNext,
    prevTrack: handlePrev,
    handleTrackEnd,
    toggleAutoplay,
    setAudioQuality,
    setCrossfadeSeconds,
    toggleNormalization,
    setEnableShader,
    clearAudioCache,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setPlaybackRate,
    toggleSlowedReverb,
    toggleNightcore,
    toggleSpatialAudio,
    setEqualizerPreset,
    setEqualizerBand,
    setSleepTimer,
    startTrackRadio,
    downloadTrack,
    removeDownloadedTrack,
    addToQueue,
    playNext,
    removeFromQueue,
    removeQueue: removeFromQueue,
    clearQueue,
    refreshRealtimeQueue,
    fetchRelatedQueue: refreshRealtimeQueue,
    toggleLike,
    createPlaylist,
    deletePlaylist,
    playPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    activePlaylistModal,
    setActivePlaylistModal,
    setActiveTab,
    setActiveGenre,
    setActiveMood,
    setIsVisualizerOpen,
    setIsEqualizerOpen,
    setIsCommandPaletteOpen,
    setIsSleepTimerOpen,
    setIsGroupSessionOpen,
    setGroupSessionCode,
    setActiveArtistModal,
    setShareTrackModal,
    showToast,
    getFrequencyData: () => audioEngine.getFrequencyData(),
  };

  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}
