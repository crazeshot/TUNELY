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
import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerCtx } from './PlayerContextInstance';
import { allTracks, defaultTrack, initialQueue, initialPlaylists, recommended, recentlyPlayed } from '../data/musicData';
import { api } from '../services/api';
import { audioEngine, EQ_PRESETS } from '../services/audioEngine';
import { extractColorsFromImage } from '../utils/colorExtractor';
import { saveTrackForOffline, getAllOfflineTracks, deleteOfflineTrack } from '../services/offlineStorage';
import { useAuth } from './useAuth';

export function PlayerProvider({ children }) {
  const { isLoggedIn, setIsAuthModalOpen } = useAuth();

  // Load last played track from localStorage or fallback to default
  const [currentTrack, setCurrentTrack] = useState(() => {
    try {
      const saved = localStorage.getItem('tunely_last_played_track');
      return saved ? JSON.parse(saved) : defaultTrack;
    } catch {
      return defaultTrack;
    }
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => {
    try {
      const saved = parseFloat(localStorage.getItem('tunely_last_played_time') || '0');
      return !isNaN(saved) ? saved : 0;
    } catch {
      return 0;
    }
  });
  const [audioDuration, setAudioDuration] = useState(null);
  const duration = audioDuration || currentTrack?.durationSeconds || 240;
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

  // Queue & Playlists
  const [queue, setQueue] = useState(initialQueue);
  const [history, setHistory] = useState([defaultTrack]);
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [likedTrackIds, setLikedTrackIds] = useState(new Set([0, 3, 7]));
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

  // Theme & Toast
  const [themeColors, setThemeColors] = useState({
    primary: '#ffffff',
    secondary: '#94a3b8',
    glow: 'rgba(255, 255, 255, 0.35)',
    gradient: ['#0f172a', '#475569', '#cbd5e1'],
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
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setProgressState(0);
    setHistory(prev => [track, ...prev.filter(t => t.id !== track.id)].slice(0, 20));

    // Dynamically fetch and populate real-time queue for the played song
    if (track) {
      refreshRealtimeQueue(track, false);
    }

    const audio = audioRef.current;
    if (audio) {
      audioEngine.resume();
      let streamUrl = track.audio_url;

      if (track.videoId) {
        streamUrl = `http://127.0.0.1:8000/api/ytm/stream/${track.videoId}/`;
      }

      if (streamUrl) {
        audio.src = streamUrl;
        audio.play().catch((err) => {
          console.warn('[Audio] Direct stream notice:', err);
          playSynthFallback();
        });
      }
    }

    if (track.id && !track.is_ytm) {
      api.recordPlay(track.id);
    }
  }, [isLoggedIn, setIsAuthModalOpen, showToast, playSynthFallback, refreshRealtimeQueue]);

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
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        playSynthFallback();
        setIsPlaying(true);
      });
    }
  }, [isLoggedIn, setIsAuthModalOpen, showToast, isPlaying, playSynthFallback]);

  const pauseTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback((percent) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(100, percent));
    setProgressState(clamped);
    if (audio && audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = (clamped / 100) * audio.duration;
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
      const all = [...allTracks, ...recommended, ...recentlyPlayed];
      const next = all[Math.floor(Math.random() * all.length)];
      playTrack(next);
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
          showToast(`🎵 Autoplaying related from YouTube Music: "${nextTrack.title}"`);
          playTrack(nextTrack);
          return;
        }

        // Fallback to YouTube Music trending if related query was empty
        const trending = await api.getYtmTrending();
        const unplayedTrending = (trending || []).filter(
          (t) => t && t.videoId !== vid && !historyIds.has(t.videoId)
        );
        const nextTrending = unplayedTrending[0] || (trending && trending[0]);
        if (nextTrending) {
          showToast(`🎵 Autoplaying trending from YouTube Music: "${nextTrending.title}"`);
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
  }, [queue, isShuffle, repeatMode, isAutoplay, currentTrack, history, playTrack, showToast]);

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

  // Initialize HTML5 Audio element & Web Audio DSP engine
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audioEngine.init(audio);

    const handleTimeUpdate = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      setCurrentTime(audio.currentTime);
      setProgressState((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
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
      playSynthFallback();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Register Media Session Handlers
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => pauseTrack());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && audio.duration) {
          seekTo((details.seekTime / audio.duration) * 100);
        }
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [playSynthFallback, togglePlay, pauseTrack, handlePrev, handleNext, seekTo]);

  // Load track source into Audio element when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (currentTrack.audio_url) {
      audio.src = currentTrack.audio_url;
      audio.load();
      if (isPlaying) {
        audioEngine.resume();
        audio.play().catch(() => {
          playSynthFallback();
        });
      }
    }
  }, [currentTrack, isPlaying, playSynthFallback]);

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

  // Likes & Favorites
  const toggleLike = useCallback((track) => {
    if (!track) return;
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      const isLiked = next.has(track.id);
      if (isLiked) {
        next.delete(track.id);
        showToast(`Removed "${track.title}" from Liked Songs`);
      } else {
        next.add(track.id);
        showToast(`Added "${track.title}" to Liked Songs`);
      }
      return next;
    });
    if (track.id) {
      api.toggleLike(track.id);
    }
  }, [showToast]);

  // Playlists
  const createPlaylist = useCallback(async ({ title, description, cover_url }) => {
    const newPl = {
      id: `pl-${Date.now()}`,
      title: title || 'My Playlist',
      description: description || '',
      cover_url: cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      tracks: [],
    };
    setPlaylists(prev => [newPl, ...prev]);
    showToast(`Playlist "${newPl.title}" created`);

    const backendRes = await api.createPlaylist({ title: newPl.title, description: newPl.description, cover_url: newPl.cover_url });
    if (backendRes && backendRes.id) {
      setPlaylists(prev => prev.map(p => p.id === newPl.id ? backendRes : p));
    }
    return newPl;
  }, [showToast]);

  const addTrackToPlaylist = useCallback(async (playlistId, track) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        const tracks = p.tracks || [];
        if (tracks.some(t => t.id === track.id)) return p;
        return { ...p, tracks: [...tracks, track] };
      }
      return p;
    }));
    showToast(`Added to playlist`);
    await api.addTrackToPlaylist(playlistId, track.id);
  }, [showToast]);

  const removeTrackFromPlaylist = useCallback(async (playlistId, trackId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: (p.tracks || []).filter(t => t.id !== trackId) };
      }
      return p;
    }));
    showToast(`Removed from playlist`);
    await api.removeTrackFromPlaylist(playlistId, trackId);
  }, [showToast]);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
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

  const isCurrentTrackLiked = likedTrackIds.has(currentTrack?.id);

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
