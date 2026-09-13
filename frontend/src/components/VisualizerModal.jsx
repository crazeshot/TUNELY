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
  Radio,
  Gauge,
  Palette,
  Maximize2,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import AudioCanvasVisualizer, { VISUALIZER_THEMES } from './AudioCanvasVisualizer';
import UniversalReactPlayer from './UniversalReactPlayer';
import { parseLRC, getActiveLyricIndex, fetchLyricsFromLRCLIB } from '../services/lyricsService';
import { getCoverUrl, handleCoverError } from '../utils/coverUrl';

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
    visualizerTheme,
    setVisualizerTheme,
    getFrequencyData,
  } = usePlayer();

  const [visualMode, setVisualMode] = useState('vinyl'); // 'vinyl' | 'spectrum' | 'wave' | 'radial' | 'particles' | 'vu-meter' | 'video'
  const [showThemePicker, setShowThemePicker] = useState(false);
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
    if (parsedLyrics[0]?.time !== null) {
      return getActiveLyricIndex(parsedLyrics, currentTime);
    }
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

  const themes = Object.entries(VISUALIZER_THEMES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in text-white">
      <div
        className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] rounded-3xl border border-white/10 p-5 sm:p-7 flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(24, 26, 32, 0.98) 0%, rgba(12, 13, 17, 0.98) 100%)',
        }}
      >
        {/* Dynamic ambient soft theme glow */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none transition-all duration-700"
          style={{ background: VISUALIZER_THEMES[visualizerTheme]?.glow || 'rgba(255,255,255,0.06)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[130px] pointer-events-none transition-all duration-700"
          style={{ background: VISUALIZER_THEMES[visualizerTheme]?.bgGlow || 'rgba(161,161,170,0.05)' }}
        />

        {/* ── TOP HEADER: TITLE + VISUALIZER MODE TABS + THEME + CLOSE ── */}
        <div className="flex items-center justify-between z-10 pb-3 border-b border-white/10 flex-wrap gap-2">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-white/50 block">
              Studio Visualizer & Lyrics
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-xs sm:max-w-md" style={{ fontFamily: "'gg sans', sans-serif" }}>
              {currentTrack.title}
            </h2>
          </div>

          {/* Visualizer Mode Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto no-scrollbar">
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
              <span className="hidden sm:inline">Harmonic</span>
            </button>

            <button
              onClick={() => setVisualMode('radial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'radial'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Radio size={13} />
              <span className="hidden sm:inline">Audio Halo</span>
            </button>

            <button
              onClick={() => setVisualMode('particles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'particles'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Cosmic</span>
            </button>

            <button
              onClick={() => setVisualMode('vu-meter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                visualMode === 'vu-meter'
                  ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Gauge size={13} />
              <span className="hidden sm:inline">VU Meter</span>
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
              <span className="hidden sm:inline">Video</span>
            </button>
          </div>

          {/* Theme Palette & Close */}
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setShowThemePicker((p) => !p)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                title="Change Visualizer Theme"
              >
                <Palette size={16} />
              </button>

              {/* Theme Dropdown Menu */}
              {showThemePicker && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 p-2 rounded-2xl bg-[#14161f]/95 backdrop-blur-xl border border-white/15 shadow-2xl z-50 space-y-1"
                  onClick={() => setShowThemePicker(false)}
                >
                  <p className="text-[10px] uppercase font-mono text-white/40 px-2 py-1">Color Palette</p>
                  {themes.map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setVisualizerTheme(key)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        visualizerTheme === key
                          ? 'bg-white text-black font-bold'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{t.name}</span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20"
                        style={{ background: t.accent }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsVisualizerOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── CENTER: DYNAMIC VISUALIZER STAGES ── */}
        <div className="flex-1 py-4 overflow-hidden z-10 flex flex-col justify-center relative">
          {/* Mode 1: Vinyl & Karaoke Lyrics */}
          {visualMode === 'vinyl' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center h-full">
              {/* Left: Spinning Vinyl Record */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-52 h-52 sm:w-64 sm:h-64">
                  <div
                    className={`w-full h-full rounded-full border-4 border-white/10 shadow-2xl p-2 bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 transition-transform ${
                      isPlaying ? 'animate-spin-slow' : ''
                    }`}
                    style={{
                      boxShadow: '0 0 50px rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <div className="w-full h-full rounded-full border-8 border-neutral-900 overflow-hidden relative flex items-center justify-center">
                      <img
                        src={getCoverUrl(currentTrack)}
                        alt={currentTrack.title}
                        onError={(e) => handleCoverError(e, currentTrack)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute w-8 h-8 rounded-full bg-neutral-950 border-2 border-white/40 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xs">{currentTrack.title}</h3>
                  <p className="text-xs sm:text-sm text-white/60 truncate max-w-xs">
                    {currentTrack.artist_name || currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Right: Synced Lyrics Card with mini Audio Canvas */}
              <div className="h-full flex flex-col justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                    Live Karaoke Synced Lyrics
                  </span>
                  <div className="w-28 h-6">
                    <AudioCanvasVisualizer mode="bars" barCount={16} height={24} showReflection={false} />
                  </div>
                </div>

                <div
                  ref={lyricsContainerRef}
                  className="flex-1 overflow-y-auto pr-2 space-y-3 py-2 text-center text-sm font-light scroll-smooth no-scrollbar"
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
                  <span>{currentTrack.bpm ? `${currentTrack.bpm} BPM` : (currentTrack.genre || 'Tunely').replace(/youtube\s*music/gi, 'Tunely')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Studio Neon Spectrum */}
          {visualMode === 'spectrum' && (
            <div className="h-full flex flex-col items-center justify-center px-4 w-full">
              <div className="w-full h-64 sm:h-76 flex items-center justify-center">
                <AudioCanvasVisualizer mode="bars" barCount={56} height={280} showPeaks={true} showReflection={true} />
              </div>
              <div className="text-center mt-3">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {/* Mode 3: Harmonic Oscilloscope */}
          {visualMode === 'wave' && (
            <div className="h-full flex flex-col items-center justify-center px-4 w-full">
              <div className="w-full h-64 sm:h-76 flex items-center justify-center">
                <AudioCanvasVisualizer mode="wave" height={280} />
              </div>
              <div className="text-center mt-3">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {/* Mode 4: Audio Halo (Circular 360) */}
          {visualMode === 'radial' && (
            <div className="h-full flex flex-col items-center justify-center px-4 w-full">
              <div className="w-full h-64 sm:h-76 flex items-center justify-center relative">
                <AudioCanvasVisualizer mode="radial" height={280} />
                {/* Central circular album art */}
                <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-2xl pointer-events-none">
                  <img
                    src={getCoverUrl(currentTrack)}
                    alt={currentTrack.title}
                    onError={(e) => handleCoverError(e, currentTrack)}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center mt-3">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {/* Mode 5: Quantum Cosmic Starfield */}
          {visualMode === 'particles' && (
            <div className="h-full flex flex-col items-center justify-center px-4 w-full">
              <div className="w-full h-64 sm:h-76 flex items-center justify-center">
                <AudioCanvasVisualizer mode="particles" height={280} />
              </div>
              <div className="text-center mt-3">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {/* Mode 6: Vintage Analogue VU Meters */}
          {visualMode === 'vu-meter' && (
            <div className="h-full flex flex-col items-center justify-center px-4 w-full">
              <div className="w-full h-64 sm:h-76 flex items-center justify-center">
                <AudioCanvasVisualizer mode="vu-meter" height={260} />
              </div>
              <div className="text-center mt-3">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}

          {/* Mode 7: ReactPlayer Video */}
          {visualMode === 'video' && (
            <div className="h-full flex flex-col items-center justify-center px-4 max-w-2xl mx-auto w-full">
              <UniversalReactPlayer showVideo={true} />
              <div className="text-center mt-3">
                <h3 className="text-xl font-bold text-white">{currentTrack.title}</h3>
                <p className="text-sm text-white/60">{currentTrack.artist_name || currentTrack.artist}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM: DSP TOGGLES + SEEK BAR + TRANSPORT CONTROLS ── */}
        <div className="space-y-3 pt-3 border-t border-white/10 z-10">
          {/* DSP Mode quick toggles + EQ Launch */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={toggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isSpatialAudio
                  ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Headphones size={12} />
              <span>3D Spatial</span>
            </button>

            <button
              onClick={toggleSlowedReverb}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isSlowedReverb
                  ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>Slowed + Reverb</span>
            </button>

            <button
              onClick={toggleNightcore}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isNightcore
                  ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Zap size={12} />
              <span>Nightcore</span>
            </button>

            <button
              onClick={() => setIsEqualizerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/15 text-white shadow-sm transition-all"
            >
              <Sliders size={12} />
              <span>10-Band Graphic EQ</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="relative group cursor-pointer py-1">
              <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
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
            <div className="flex justify-between text-xs text-white/40 font-mono px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleLike(currentTrack)}
              className={`p-2 rounded-full hover:bg-white/10 transition-transform hover:scale-110 ${
                isCurrentTrackLiked ? 'text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Heart size={20} className={isCurrentTrackLiked ? 'fill-white' : ''} />
            </button>

            <div className="flex items-center gap-6">
              <button
                onClick={toggleShuffle}
                className={`p-2 transition-colors ${isShuffle ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}
                title="Shuffle"
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={prevTrack}
                className="text-white/60 hover:text-white transition-colors"
                title="Previous"
              >
                <SkipBack size={22} />
              </button>

              <button
                onClick={togglePlay}
                className="w-13 h-13 rounded-full bg-white hover:bg-neutral-200 flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-all duration-200 font-bold"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                className="text-white/60 hover:text-white transition-colors"
                title="Next"
              >
                <SkipForward size={22} />
              </button>

              <button
                onClick={cycleRepeat}
                className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}
                title={`Repeat: ${repeatMode}`}
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
