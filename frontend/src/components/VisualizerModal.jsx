import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Shuffle,
  Repeat,
  Sparkles,
  Zap,
  Sliders,
  Disc,
  Activity,
  Waves,
  Headphones,
  Video,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import AudioCanvasVisualizer from './AudioCanvasVisualizer';
import UniversalReactPlayer from './UniversalReactPlayer';
import { parseLRC, getActiveLyricIndex, fetchLyricsFromLRCLIB } from '../services/lyricsService';

export default function VisualizerModal() {
  const {
    isVisualizerOpen,
    setIsVisualizerOpen,
    currentTrack,
    isPlaying,
    togglePlay,
    prevTrack,
    nextTrack,
    progress,
    seekTo,
    currentTime,
    duration,
    isCurrentTrackLiked,
    toggleLike,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    isSlowedReverb,
    toggleSlowedReverb,
    isNightcore,
    toggleNightcore,
    isSpatialAudio,
    toggleSpatialAudio,
    setIsEqualizerOpen,
    themeColors,
  } = usePlayer();

  const [visualMode, setVisualMode] = useState('vinyl'); // 'vinyl' | 'spectrum' | 'wave'
  const [onlineLyrics, setOnlineLyrics] = useState(null);
  const lyricsContainerRef = useRef(null);
  const activeLineRef = useRef(null);

  // Fetch LRCLIB lyrics if track has no synced lyrics
  useEffect(() => {
    let isMounted = true;
    if (isVisualizerOpen && currentTrack && !currentTrack.synced_lyrics) {
      fetchLyricsFromLRCLIB(currentTrack.artist_name || currentTrack.artist, currentTrack.title).then((res) => {
        if (isMounted && res) setOnlineLyrics(res.syncedLyrics || res.plainLyrics);
      });
    }
    return () => { isMounted = false; };
  }, [isVisualizerOpen, currentTrack]);

  const parsedLyrics = useMemo(() => {
    const raw = currentTrack?.synced_lyrics || onlineLyrics || currentTrack?.lyrics || '';
    return parseLRC(raw);
  }, [currentTrack, onlineLyrics]);

  const currentLineIndex = useMemo(() => {
    if (parsedLyrics.length === 0) return -1;
    // If lyrics are timestamped
    if (parsedLyrics[0]?.time !== null) {
      return getActiveLyricIndex(parsedLyrics, currentTime);
    }
    // Fallback: duration interpolation
    return Math.min(
      parsedLyrics.length - 1,
      Math.floor((currentTime / Math.max(1, duration)) * parsedLyrics.length)
    );
  }, [parsedLyrics, currentTime, duration]);

  // Auto-scroll to active lyric line
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex]);

  if (!isVisualizerOpen || !currentTrack) return null;

  const formatTime = (secs) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, '0')}`;
  };

  const handleLyricClick = (line) => {
    if (line.time !== null && duration > 0) {
      seekTo((line.time / duration) * 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in text-white">
      <div
        className="relative w-full max-w-5xl h-[88vh] rounded-3xl border border-white/15 p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(28, 12, 40, 0.98) 0%, rgba(10, 5, 18, 0.98) 100%)',
        }}
      >
        {/* Dynamic ambient color glows */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700"
          style={{ background: themeColors.primary, opacity: 0.25 }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700"
          style={{ background: themeColors.secondary, opacity: 0.25 }}
        />

        {/* Top Header: Title + Mode switchers + Close */}
        <div className="flex items-center justify-between z-10 pb-3 border-b border-white/10">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-pink-400">
              Studio Visualizer & Lyrics
            </span>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              {currentTrack.genre || 'Master Audio'}
            </h2>
          </div>

          {/* Visualizer Mode Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setVisualMode('vinyl')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'vinyl'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Disc size={13} />
              <span className="hidden sm:inline">Vinyl & Lyrics</span>
            </button>

            <button
              onClick={() => setVisualMode('spectrum')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'spectrum'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Activity size={13} />
              <span className="hidden sm:inline">Spectrum</span>
            </button>

            <button
              onClick={() => setVisualMode('wave')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'wave'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Waves size={13} />
              <span className="hidden sm:inline">Oscilloscope</span>
            </button>

            <button
              onClick={() => setVisualMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'video'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Video size={13} />
              <span className="hidden sm:inline">ReactPlayer Video</span>
            </button>
          </div>

          <button
            onClick={() => setIsVisualizerOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center: Dynamic Visualizer Views */}
        <div className="flex-1 py-6 overflow-hidden z-10 flex flex-col justify-center">
          {visualMode === 'vinyl' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
              {/* Left: Spinning Vinyl Record */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-56 h-56 sm:w-72 sm:h-72">
                  <div
                    className={`w-full h-full rounded-full border-4 border-white/10 shadow-2xl p-2 bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 transition-transform ${
                      isPlaying ? 'animate-spin-slow' : ''
                    }`}
                    style={{
                      boxShadow: `0 0 50px ${themeColors.glow}`,
                    }}
                  >
                    <div className="w-full h-full rounded-full border-8 border-neutral-900 overflow-hidden relative flex items-center justify-center">
                      <img
                        src={currentTrack.cover_url || currentTrack.cover}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute w-8 h-8 rounded-full bg-neutral-950 border-2 border-white/40 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-5">
                  <h3 className="text-lg font-bold text-white truncate max-w-xs">{currentTrack.title}</h3>
                  <p className="text-sm text-white/60 truncate max-w-xs">
                    {currentTrack.artist_name || currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Right: Live Millisecond .LRC Synced Karaoke Lyrics with Click-to-Seek */}
              <div className="h-full flex flex-col justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-pink-400">
                    Live Karaoke Synced Lyrics
                  </span>
                  <div className="w-24 h-5">
                    <AudioCanvasVisualizer mode="bars" barCount={12} height={20} />
                  </div>
                </div>

                <div
                  ref={lyricsContainerRef}
                  className="flex-1 overflow-y-auto pr-2 space-y-3 py-2 text-center text-sm font-light scroll-smooth"
                >
                  {parsedLyrics.length > 0 ? (
                    parsedLyrics.map((line, idx) => {
                      const isActiveLine = idx === currentLineIndex;
                      return (
                        <p
                          key={idx}
                          ref={isActiveLine ? activeLineRef : null}
                          onClick={() => handleLyricClick(line)}
                          className={`cursor-pointer transition-all duration-300 select-none py-1.5 px-3 rounded-xl ${
                            isActiveLine
                              ? 'text-white font-extrabold text-base scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] bg-white/10'
                              : 'text-white/40 hover:text-white/90 hover:bg-white/5'
                          }`}
                          title="Click to jump playback here"
                        >
                          {line.text || '♫ ♫ ♫'}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-white/40 italic mt-12">Lyrics not available for this track.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
                  <span>{currentTrack.album_title || 'Single'}</span>
                  <span>{currentTrack.bpm ? `${currentTrack.bpm} BPM` : currentTrack.genre}</span>
                </div>
              </div>
            </div>
          )}

          {visualMode === 'spectrum' && (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-full h-64 sm:h-72">
                <AudioCanvasVisualizer
                  mode="bars"
                  barCount={48}
                  height={260}
                  accentColor="#ffffff"
                  secondaryColor="#94a3b8"
                />
              </div>
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {visualMode === 'wave' && (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-full h-64 sm:h-72">
                <AudioCanvasVisualizer
                  mode="wave"
                  height={260}
                  accentColor="#ffffff"
                  secondaryColor="#94a3b8"
                />
              </div>
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {visualMode === 'video' && (
            <div className="h-full flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
              <UniversalReactPlayer showVideo={true} />
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom: DSP Toggles + Playback Controls */}
        <div className="space-y-3 pt-3 border-t border-white/10 z-10">
          {/* DSP Mode quick toggles */}
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button
              onClick={toggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSpatialAudio
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Headphones size={12} />
              <span>3D Spatial Soundstage</span>
            </button>

            <button
              onClick={toggleSlowedReverb}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSlowedReverb
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>Slowed + Reverb</span>
            </button>

            <button
              onClick={toggleNightcore}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isNightcore
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Zap size={12} />
              <span>Nightcore</span>
            </button>

            <button
              onClick={() => setIsEqualizerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            >
              <Sliders size={12} />
              <span>10-Band EQ</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="relative group cursor-pointer">
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-white/40 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLike(currentTrack)}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                isCurrentTrackLiked ? 'text-white fill-white' : 'text-white/50'
              }`}
            >
              <Heart size={20} className={isCurrentTrackLiked ? 'fill-white' : ''} />
            </button>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${isShuffle ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={prevTrack}
                className="text-white/60 hover:text-white transition-colors"
              >
                <SkipBack size={22} />
              </button>

              <button
                onClick={togglePlay}
                className="w-13 h-13 rounded-full bg-white hover:bg-neutral-200 flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-200 font-bold"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                className="text-white/60 hover:text-white transition-colors"
              >
                <SkipForward size={22} />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}
              >
                <Repeat size={18} />
              </button>
            </div>

            <div className="w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
