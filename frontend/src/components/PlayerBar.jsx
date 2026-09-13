import { useState } from "react";
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
  Activity,
} from "lucide-react";
import { usePlayer } from "../context/usePlayer";
import { getCoverUrl, handleCoverError } from "../utils/coverUrl";
import AudioCanvasVisualizer from "./AudioCanvasVisualizer";

function formatTime(secs) {
  const s = Math.floor(secs || 0);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

export default function PlayerBar({ collapsed = false }) {
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
    eqPreset,
    isEqBypassed,
  } = usePlayer();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!currentTrack) return null;

  // ── 1. COMPACT DOCKED LUXURY MODE (When sidebar is closed) ─────────
  if (collapsed) {
    const handleProgressClick = (e) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      if (width > 0) {
        const percent = Math.max(0, Math.min(100, (clickX / width) * 100));
        seekTo(percent);
      }
    };

    return (
      <div
        className="w-[72px] min-w-[72px] max-w-[72px] rounded-3xl p-2.5 flex flex-col items-center gap-2.5 transition-all duration-300 shadow-2xl relative select-none shrink-0 group z-30"
        style={{
          background: 'rgba(18, 20, 26, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(30px)',
          boxShadow: `0 10px 30px ${themeColors.glow || 'rgba(255, 255, 255, 0.15)'}`,
        }}
      >
        {/* Floating Capsule Tooltip on Hover with 100% Solid Opaque Background */}
        <div
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 p-3 rounded-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.98)] whitespace-nowrap z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 text-white flex items-center gap-3 scale-95 group-hover:scale-100"
          style={{ backgroundColor: '#0d0f17' }}
        >
          <img
            src={getCoverUrl(currentTrack)}
            alt={currentTrack.title}
            onError={(e) => handleCoverError(e, currentTrack)}
            className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20 shadow-sm shrink-0"
          />
          <div className="text-left">
            <p className="text-xs font-bold text-white max-w-[190px] truncate leading-snug">{currentTrack.title}</p>
            <p className="text-[11px] text-neutral-300 max-w-[190px] truncate mt-0.5 font-medium leading-snug">{currentTrack.artist_name || currentTrack.artist}</p>
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-1">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* ── 1. Clean Upright Album Cover Art with Visualizer Trigger ── */}
        <div
          className={`relative group/cover cursor-pointer w-13 h-13 rounded-2xl overflow-hidden transition-all duration-300 shrink-0 ${
            isPlaying ? 'ring-2 ring-white/60 shadow-[0_0_18px_rgba(255,255,255,0.4)]' : 'ring-1 ring-white/20'
          }`}
          onClick={() => setIsVisualizerOpen(true)}
          title={`${currentTrack.title} - Click to open visualizer`}
        >
          <img
            src={getCoverUrl(currentTrack)}
            alt={currentTrack.title}
            onError={(e) => handleCoverError(e, currentTrack)}
            className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 size={14} className="text-white" />
          </div>

          {isPlaying && (
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          )}
        </div>

        {/* ── 2. Primary High-Contrast Tactile Play Button ── */}
        <button
          onClick={togglePlay}
          className="w-11 h-11 rounded-full bg-white hover:bg-neutral-100 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.45)] hover:scale-108 active:scale-95 transition-all shrink-0 group/play"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause size={17} className="transition-transform group-hover/play:scale-110" />
          ) : (
            <Play size={17} className="ml-0.5 transition-transform group-hover/play:scale-110" />
          )}
        </button>

        {/* ── 3. Prev & Next Transport Capsule ── */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-2xl border border-white/10">
          <button
            onClick={prevTrack}
            className="w-7 h-7 rounded-xl hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Previous Track"
          >
            <SkipBack size={12} />
          </button>
          <button
            onClick={nextTrack}
            className="w-7 h-7 rounded-xl hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Next Track"
          >
            <SkipForward size={12} />
          </button>
        </div>

        {/* ── 4. Clickable / Scrubbable Micro Progress Bar ── */}
        <div
          onClick={handleProgressClick}
          className="w-full px-1 py-1 cursor-pointer group/bar flex items-center"
          title={`Seek (${formatTime(currentTime)} / ${formatTime(duration)})`}
        >
          <div className="w-full h-1.5 bg-white/15 group-hover/bar:h-2 group-hover/bar:bg-white/25 rounded-full overflow-hidden transition-all relative">
            <div
              className="h-full bg-white transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── 5. Quick Utility Row: Heart Like + Studio EQ Toggle + Visualizer ── */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleLike(currentTrack)}
            className={`w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
              isCurrentTrackLiked ? 'text-white' : 'text-white/40 hover:text-white'
            }`}
            title={isCurrentTrackLiked ? 'Unlike' : 'Like'}
          >
            <Heart size={13} className={isCurrentTrackLiked ? 'fill-white' : ''} />
          </button>
          <button
            onClick={() => setIsEqualizerOpen(true)}
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative ${
              eqPreset !== 'Flat' && !isEqBypassed
                ? 'bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                : 'bg-white/5 hover:bg-white/15 text-white/40 hover:text-white'
            }`}
            title={`Equalizer (${eqPreset}${isEqBypassed ? ' - Bypassed' : ''})`}
          >
            <Sliders size={12} />
            {eqPreset !== 'Flat' && !isEqBypassed && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-900" />
            )}
          </button>
          <button
            onClick={() => setIsVisualizerOpen(true)}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 text-white/40 hover:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            title="Studio Visualizer"
          >
            <Activity size={12} className={isPlaying ? "text-emerald-400 animate-pulse" : ""} />
          </button>
        </div>
      </div>
    );
  }

  // ── 2. FULL EXPANDED LUXURY PLAYER (Bigger Cover & Spacious) ──────
  return (
    <div
      className="w-[260px] rounded-3xl p-3.5 flex flex-col gap-3 transition-all duration-300 shadow-2xl relative"
      style={{
        background: "rgba(18, 20, 26, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(30px)",
        boxShadow: `0 10px 30px ${themeColors.glow || "rgba(255, 255, 255, 0.15)"}`,
      }}
    >
      {/* Top Section: Larger 62px Cover Art + Title + Controls */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Larger 62px Album Art */}
        <div
          className={`relative group cursor-pointer shrink-0 rounded-2xl overflow-hidden transition-all duration-300 ${
            isPlaying
              ? "shadow-[0_0_18px_rgba(255,255,255,0.35)] ring-1 ring-white/40"
              : ""
          }`}
          onClick={() => setIsVisualizerOpen(true)}
          style={{ width: "62px", height: "62px" }}
        >
          <img
            src={getCoverUrl(currentTrack)}
            alt={currentTrack.title}
            onError={(e) => handleCoverError(e, currentTrack)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 size={16} className="text-white" />
          </div>
        </div>

        {/* Title + Artist */}
        <div className="flex-1 min-w-0 pr-1">
          <p
            className="text-white text-sm font-bold truncate hover:underline cursor-pointer tracking-tight"
            style={{ fontFamily: "'gg sans', sans-serif" }}
            onClick={() => setIsVisualizerOpen(true)}
            title={currentTrack.title}
          >
            {currentTrack.title}
          </p>
          <p
            className="text-white/50 text-xs truncate hover:text-white cursor-pointer transition-colors mt-0.5"
            onClick={() => setActiveArtistModal(currentTrack)}
            title={currentTrack.artist_name || currentTrack.artist}
          >
            {currentTrack.artist_name || currentTrack.artist}
          </p>
        </div>

        {/* Like Button */}
        <button
          onClick={() => toggleLike(currentTrack)}
          className={`shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-transform hover:scale-110 ${
            isCurrentTrackLiked
              ? "text-white"
              : "text-white/30 hover:text-white/80"
          }`}
          title={isCurrentTrackLiked ? "Remove from Liked" : "Save to Liked"}
        >
          <Heart
            size={16}
            className={isCurrentTrackLiked ? "fill-white" : ""}
          />
        </button>
      </div>

      {/* Center Transport Controls (Tactile 38px Play button) */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={toggleShuffle}
          className={`p-1.5 rounded-full transition-colors ${
            isShuffle
              ? "text-white font-bold bg-white/10"
              : "text-white/30 hover:text-white"
          }`}
          title="Shuffle"
        >
          <Shuffle size={13} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={prevTrack}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Previous Track"
          >
            <SkipBack size={16} />
          </button>

          {/* Bigger Play/Pause Disc */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 transition-all"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} className="ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Next Track"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <button
          onClick={cycleRepeat}
          className={`p-1.5 rounded-full transition-colors ${
            repeatMode !== "off"
              ? "text-white font-bold bg-white/10"
              : "text-white/30 hover:text-white"
          }`}
          title={`Repeat: ${repeatMode}`}
        >
          <Repeat size={13} />
        </button>
      </div>

      {/* Live Mini Spectrum Visualizer Strip (Clickable to open Visualizer Studio) */}
      <div
        onClick={() => setIsVisualizerOpen(true)}
        className="h-4 px-1 cursor-pointer group flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        title="Click to launch Visualizer Studio"
      >
        <AudioCanvasVisualizer mode="bars" barCount={28} height={16} showPeaks={false} showReflection={false} />
      </div>

      {/* High-Precision Progress Bar */}
      <div className="space-y-1">
        <div className="relative group cursor-pointer py-1">
          <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
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

        <div className="flex items-center justify-between text-[10px] font-mono text-white/40 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* DSP & Experience Action Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-white/40 text-xs">
        {/* 3D Spatial */}
        <button
          onClick={toggleSpatialAudio}
          className={`p-1.5 rounded-lg transition-colors ${
            isSpatialAudio
              ? "text-white font-bold bg-white/10"
              : "hover:text-white"
          }`}
          title="3D Spatial Audio"
        >
          <Headphones size={13} />
        </button>

        {/* Slowed+Reverb */}
        <button
          onClick={toggleSlowedReverb}
          className={`p-1.5 rounded-lg transition-colors ${
            isSlowedReverb
              ? "text-white font-bold bg-white/10"
              : "hover:text-white"
          }`}
          title="Slowed + Reverb DSP"
        >
          <Sparkles size={13} />
        </button>

        {/* EQ */}
        <button
          onClick={() => setIsEqualizerOpen(true)}
          className={`p-1.5 rounded-lg transition-colors relative ${
            eqPreset !== 'Flat' && !isEqBypassed
              ? 'text-white font-bold bg-white/10'
              : 'hover:text-white'
          }`}
          title={`10-Band Graphic Equalizer (${eqPreset})`}
        >
          <Sliders size={13} />
          {eqPreset !== 'Flat' && !isEqBypassed && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          )}
        </button>

        {/* Visualizer Studio */}
        <button
          onClick={() => setIsVisualizerOpen(true)}
          className="p-1.5 rounded-lg hover:text-white transition-colors"
          title="Studio Visualizer & Lyrics"
        >
          <Activity size={13} className={isPlaying ? "text-emerald-400 animate-pulse" : ""} />
        </button>

        {/* Sleep Timer */}
        <button
          onClick={() => setIsSleepTimerOpen(true)}
          className={`p-1.5 rounded-lg transition-colors ${
            sleepTimerSeconds !== null
              ? "text-white font-bold bg-white/10"
              : "hover:text-white"
          }`}
          title="Sleep Timer"
        >
          <Moon size={13} />
        </button>

        {/* Volume Popover */}
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>

          {showVolumeSlider && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-2 z-30"
              style={{
                background: "rgba(18, 20, 26, 0.98)",
                backdropFilter: "blur(16px)",
              }}
            >
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1.5 cursor-pointer accent-white"
              />
              <span className="text-[10px] font-mono text-white/80">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          )}
        </div>

        {/* Visualizer */}
        <button
          onClick={() => setIsVisualizerOpen(true)}
          className="p-1.5 rounded-lg hover:text-white transition-colors"
          title="Open Studio Visualizer & Lyrics"
        >
          <Maximize2 size={13} />
        </button>
      </div>
    </div>
  );
}
