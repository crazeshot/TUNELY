import { useState } from 'react';
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Maximize2,
  Sliders,
  Moon,
  Sparkles,
  Headphones,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';

function formatTime(secs) {
  const s = Math.floor(secs || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    togglePlay,
    prevTrack,
    nextTrack,
    seekTo,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    isCurrentTrackLiked,
    toggleLike,
    isSlowedReverb,
    toggleSlowedReverb,
    isSpatialAudio,
    toggleSpatialAudio,
    setIsVisualizerOpen,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setActiveArtistModal,
    sleepTimerSeconds,
    themeColors,
  } = usePlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentTrack) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 relative"
      style={{
        background: 'rgba(18, 20, 26, 0.94)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        backdropFilter: 'blur(28px)',
        boxShadow: `0 10px 30px ${themeColors.glow || 'rgba(255, 255, 255, 0.15)'}`,
      }}
    >
      {/* Top row: thumb + title + like + controls */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        {/* Album art with reactive bass glow */}
        <div
          className={`relative group cursor-pointer shrink-0 w-10 h-10 rounded-lg overflow-hidden transition-all duration-300 ${
            isPlaying ? 'shadow-md scale-102 ring-1 ring-white/30' : ''
          }`}
          onClick={() => setIsVisualizerOpen(true)}
          style={{
            boxShadow: isPlaying ? `0 0 16px ${themeColors.glow || 'rgba(255,255,255,0.2)'}` : 'none',
          }}
        >
          <img
            src={currentTrack.cover_url || currentTrack.cover}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 size={12} className="text-white" />
          </div>
        </div>

        {/* Title + artist */}
        <div className="flex-1 min-w-0 pr-1">
          <p
            className="text-white text-xs font-semibold truncate hover:underline cursor-pointer"
            onClick={() => setIsVisualizerOpen(true)}
          >
            {currentTrack.title}
          </p>
          <p
            className="text-white/45 text-[11px] truncate hover:text-white cursor-pointer transition-colors"
            onClick={() => setActiveArtistModal(currentTrack)}
          >
            {currentTrack.artist_name || currentTrack.artist}
          </p>
        </div>

        {/* Like Button */}
        <button
          onClick={() => toggleLike(currentTrack)}
          className={`shrink-0 p-1 hover:scale-110 transition-transform ${
            isCurrentTrackLiked ? 'text-white' : 'text-white/30 hover:text-white/70'
          }`}
          title={isCurrentTrackLiked ? 'Remove from Liked' : 'Like'}
        >
          <Heart size={14} className={isCurrentTrackLiked ? 'fill-white' : ''} />
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={prevTrack}
            className="p-1 text-white/50 hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.35)] hover:scale-105 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={12} />
            ) : (
              <Play size={12} className="ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-1 text-white/50 hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar and time */}
      <div className="px-3 pb-2.5">
        <div className="relative group cursor-pointer py-1">
          <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
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

        {/* Sub-controls row */}
        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
          <span className="font-mono text-white/60">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex items-center gap-2">
            {/* 3D Spatial Audio soundstage toggle */}
            <button
              onClick={toggleSpatialAudio}
              className={`transition-colors ${
                isSpatialAudio ? 'text-white font-bold' : 'text-white/30 hover:text-white'
              }`}
              title="3D Spatial Soundstage"
            >
              <Headphones size={11} />
            </button>

            {/* Slowed+Reverb quick toggle */}
            <button
              onClick={toggleSlowedReverb}
              className={`transition-colors ${
                isSlowedReverb ? 'text-white font-bold' : 'text-white/30 hover:text-white'
              }`}
              title="Slowed + Reverb Mode"
            >
              <Sparkles size={11} />
            </button>

            {/* EQ trigger */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              className="text-white/30 hover:text-white transition-colors"
              title="Graphic Equalizer"
            >
              <Sliders size={11} />
            </button>

            {/* Sleep timer */}
            <button
              onClick={() => setIsSleepTimerOpen(true)}
              className={`transition-colors ${
                sleepTimerSeconds !== null ? 'text-white font-bold' : 'text-white/30 hover:text-white'
              }`}
              title="Sleep Timer"
            >
              <Moon size={11} />
            </button>

            <button
              onClick={toggleShuffle}
              className={`hover:text-white transition-colors ${
                isShuffle ? 'text-white font-bold' : 'text-white/30'
              }`}
              title="Toggle Shuffle"
            >
              <Shuffle size={11} />
            </button>

            <button
              onClick={cycleRepeat}
              className={`hover:text-white transition-colors ${
                repeatMode !== 'off' ? 'text-white font-bold' : 'text-white/30'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={11} />
            </button>

            {/* Volume toggle with popover */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="text-white/30 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>

              {showVolumeSlider && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-xl border border-white/15 shadow-xl flex items-center gap-2"
                  style={{ background: 'rgba(18, 20, 26, 0.98)', backdropFilter: 'blur(12px)' }}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-16 h-1 cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-white/70">{isMuted ? 0 : volume}%</span>
                </div>
              )}
            </div>

            {/* Studio visualizer trigger */}
            <button
              onClick={() => setIsVisualizerOpen(true)}
              className="text-white/40 hover:text-white transition-colors"
              title="Open Visualizer & Lyrics"
            >
              <Maximize2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
