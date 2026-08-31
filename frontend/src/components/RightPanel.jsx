import { ChevronRight, Trash2, ListMusic, Music, Sparkles, RefreshCw, Disc, Play, Pause } from 'lucide-react';
import QueueItem from './QueueItem';
import { usePlayer } from '../context/usePlayer';
import AudioCanvasVisualizer from './AudioCanvasVisualizer';
import { getCoverUrl, handleCoverError } from '../utils/coverUrl';

export default function RightPanel({ collapsed = false, onToggle = () => {} }) {
  const {
    queue,
    clearQueue,
    currentTrack,
    isPlaying,
    refreshRealtimeQueue,
    playTrack,
    togglePlay,
    setIsVisualizerOpen,
  } = usePlayer();

  const panelWidth = collapsed ? '72px' : '260px';

  return (
    <aside
      className={`relative flex flex-col h-full min-h-0 shrink-0 rounded-3xl transition-all duration-300 bg-white/[0.03] backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 select-none`}
      style={{ width: panelWidth, minWidth: panelWidth, maxWidth: panelWidth }}
    >
      {/* ── COLLAPSED QUEUE DOCK VIEW (72px Icon Bar) ─────────────────── */}
      {collapsed ? (
        <div className="flex flex-col items-center h-full py-4 px-2.5 justify-between">
          {/* Top Section: Toggle & Queue Header Icon */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Expand Toggle Button */}
            <button
              onClick={onToggle}
              aria-label="Expand right panel"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 border border-white/15 hover:border-white/30 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-md group relative"
              title="Expand Live Queue"
            >
              <ChevronRight size={16} className="rotate-180 transition-transform group-hover:scale-110" />
              <span className="absolute right-full mr-3 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Expand Queue
              </span>
            </button>

            {/* Queue Icon with Live Counter Badge */}
            <div className="relative group w-full flex justify-center">
              <button
                onClick={onToggle}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center p-1.5 transition-all hover:scale-105 relative"
                aria-label="Live Queue"
              >
                <ListMusic size={18} className="text-white" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center shadow-md">
                    {queue.length > 99 ? '99+' : queue.length}
                  </span>
                )}
              </button>
              <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                <ListMusic size={12} className="text-white/70" />
                <span>Live Queue ({queue.length})</span>
              </span>
            </div>

            {/* Live Dancing Equalizer Wave Bars (Fixed Height Container with GPU Scale Transform) */}
            {isPlaying && (
              <div className="h-6 w-11 flex items-center justify-center gap-0.5 bg-white/5 rounded-full border border-white/10 shrink-0 select-none overflow-hidden" title="Audio streaming">
                <span className="wbar text-emerald-400" />
                <span className="wbar text-emerald-400" />
                <span className="wbar text-emerald-400" />
                <span className="wbar text-emerald-400" />
              </div>
            )}

            <div className="w-8 h-px bg-white/10 my-0.5" />

            {/* Quick Actions (Refresh & Clear) */}
            <div className="flex items-center gap-1.5">
              <div className="relative group">
                <button
                  onClick={() => refreshRealtimeQueue(currentTrack, true)}
                  className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  aria-label="Refresh Queue"
                >
                  <RefreshCw size={12} />
                </button>
                <span
                  className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl border border-white/20 text-[10px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100]"
                  style={{ backgroundColor: '#0d0f17' }}
                >
                  Refresh Queue
                </span>
              </div>

              {queue.length > 0 && (
                <div className="relative group">
                  <button
                    onClick={clearQueue}
                    className="w-7 h-7 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    aria-label="Clear Queue"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl border border-white/20 text-[10px] font-semibold text-red-300 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100]"
                    style={{ backgroundColor: '#0d0f17' }}
                  >
                    Clear Queue
                  </span>
                </div>
              )}
            </div>

            <div className="w-8 h-px bg-white/10 my-0.5" />

            {/* Collapsed Queue Items List (Mini Artwork Tiles) */}
            <div className="flex flex-col items-center gap-2 w-full max-h-[320px] overflow-y-auto no-scrollbar py-1">
              {queue.length === 0 ? (
                <div className="relative group flex flex-col items-center py-4">
                  <button
                    onClick={() => refreshRealtimeQueue(currentTrack, true)}
                    className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all hover:scale-105 active:scale-95"
                    title="Auto-fill Queue"
                  >
                    <Sparkles size={16} className="text-white/60 animate-pulse" />
                  </button>
                  <span
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] flex items-center gap-1.5"
                    style={{ backgroundColor: '#0d0f17' }}
                  >
                    <Sparkles size={12} className="text-white" />
                    <span>Auto-Fill Live Queue</span>
                  </span>
                </div>
              ) : (
                queue.slice(0, 8).map((track, i) => {
                  const isCurrent = (currentTrack?.videoId && track?.videoId)
                    ? currentTrack.videoId === track.videoId
                    : (currentTrack?.id !== undefined && track?.id !== undefined && currentTrack.id === track.id);

                  return (
                    <div key={track.videoId || track.id || `collapsed-queue-${i}`} className="relative group w-full flex justify-center">
                      <button
                        onClick={() => {
                          if (isCurrent) togglePlay();
                          else playTrack(track);
                        }}
                        className={`w-10 h-10 rounded-2xl overflow-hidden ring-1 transition-all hover:scale-108 active:scale-95 shadow-md relative flex items-center justify-center ${
                          isCurrent
                            ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                            : 'ring-white/15 hover:ring-white/40'
                        }`}
                        aria-label={track.title}
                      >
                        <img
                          src={getCoverUrl(track)}
                          alt={track.title}
                          onError={(e) => handleCoverError(e, track)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          {isCurrent && isPlaying ? (
                            <Pause size={13} className="text-white" />
                          ) : (
                            <Play size={13} className="text-white ml-0.5" />
                          )}
                        </div>
                      </button>

                      {/* Floating Left Flyout Card on Hover with Solid Opaque Background */}
                      <div
                        className="absolute right-full mr-3.5 top-1/2 -translate-y-1/2 p-3 rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] whitespace-nowrap z-[100] opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex items-center gap-3 scale-95 group-hover:scale-100 text-white"
                        style={{ backgroundColor: '#0d0f17' }}
                      >
                        <img
                          src={getCoverUrl(track)}
                          alt={track.title}
                          onError={(e) => handleCoverError(e, track)}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20 shadow-sm shrink-0"
                        />
                        <div className="text-left">
                          <span className="text-[9px] font-mono text-emerald-400 font-semibold uppercase tracking-wider block">
                            #{i + 1} Up Next
                          </span>
                          <p className="text-xs font-bold text-white max-w-[180px] truncate">{track.title}</p>
                          <p className="text-[11px] text-neutral-300 max-w-[180px] truncate">{track.artist_name || track.artist}</p>
                        </div>
                        {track.duration && (
                          <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                            {track.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Section: Now Playing Mini Cover Thumbnail */}
          {currentTrack && (
            <div className="w-full pt-2 flex justify-center border-t border-white/10">
              <div className="relative group flex justify-center">
                <button
                  onClick={() => setIsVisualizerOpen(true)}
                  className={`w-10 h-10 rounded-2xl overflow-hidden transition-all hover:scale-108 active:scale-95 relative flex items-center justify-center ${
                    isPlaying ? 'ring-2 ring-white/60 shadow-[0_0_15px_rgba(255,255,255,0.35)]' : 'ring-1 ring-white/20'
                  }`}
                  title="Now Playing - Click for Visualizer"
                >
                  <img
                    src={getCoverUrl(currentTrack)}
                    alt={currentTrack.title}
                    onError={(e) => handleCoverError(e, currentTrack)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isPlaying && (
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black animate-pulse" />
                  )}
                </button>
                <div
                  className="absolute right-full mr-3.5 bottom-0 p-3 rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] whitespace-nowrap z-[100] opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex items-center gap-3 scale-95 group-hover:scale-100 text-white"
                  style={{ backgroundColor: '#0d0f17' }}
                >
                  <Disc size={16} className="text-white shrink-0" />
                  <div className="text-left">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">
                      Now Streaming
                    </span>
                    <p className="text-xs font-bold text-white max-w-[180px] truncate">{currentTrack.title}</p>
                    <p className="text-[11px] text-neutral-300 max-w-[180px] truncate">{currentTrack.artist_name || currentTrack.artist}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── EXPANDED QUEUE VIEW (260px Full Panel) ──────────────────── */
        <div className="flex flex-col h-full pt-5">
          {/* Next Queue Header with count, live badge, and clear button */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggle}
                aria-label="Collapse right panel"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all duration-300"
                title="Collapse Panel"
              >
                <ChevronRight size={16} />
              </button>
              <div className="flex items-center gap-2">
                <ListMusic size={16} className="text-white" />
                <h3
                  className="text-white font-bold text-sm tracking-tight"
                  style={{ fontFamily: "'gg sans', sans-serif" }}
                >
                  Live Queue
                </h3>
              </div>
            </div>

            {queue.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[10px] text-white/80 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {queue.length}
                </span>
                <button
                  onClick={() => refreshRealtimeQueue(currentTrack, true)}
                  className="text-white/40 hover:text-white transition-colors p-1"
                  title="Refresh Real-time Queue"
                >
                  <RefreshCw size={12} />
                </button>
                <button
                  onClick={clearQueue}
                  className="text-white/40 hover:text-red-400 transition-colors p-1"
                  title="Clear Queue"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Live Audio Visualizer Mini Wave */}
          {isPlaying && (
            <div className="px-4 py-2 opacity-50 pointer-events-none">
              <AudioCanvasVisualizer mode="bars" height={36} />
            </div>
          )}

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-center px-4 text-white/30 space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Music size={20} className="opacity-40" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/60">Queue is currently empty</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Hover over any song and click &quot;Add to Queue&quot; or auto-fill with live related tracks
                  </p>
                </div>
                {currentTrack && (
                  <button
                    onClick={() => refreshRealtimeQueue(currentTrack, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white/90 font-medium transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles size={13} className="text-white" />
                    Auto-Fill Live Queue
                  </button>
                )}
              </div>
            ) : (
              queue.filter(Boolean).map((track, i) => (
                <QueueItem key={track.videoId || track.id || `queue-item-${i}`} track={track} index={i} />
              ))
            )}
          </div>

          {/* Now Streaming Mini Card Footer */}
          {currentTrack && (
            <div className="p-3.5 border-t border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={getCoverUrl(currentTrack)}
                    alt={currentTrack.title}
                    onError={(e) => handleCoverError(e, currentTrack)}
                    className="w-10 h-10 rounded-xl object-cover shadow-md ring-1 ring-white/20"
                  />
                  {isPlaying && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Disc size={10} className="text-white/60" />
                    <span className="text-[9px] uppercase tracking-wider font-bold text-white/60">
                      Now Playing
                    </span>
                  </div>
                  <p className="text-white text-xs font-bold truncate mt-0.5">{currentTrack.title}</p>
                  <p className="text-[11px] text-white/50 truncate">{currentTrack.artist_name || currentTrack.artist}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

