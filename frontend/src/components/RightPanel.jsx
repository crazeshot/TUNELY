import { ChevronRight, Trash2, ListMusic, Music, Disc } from 'lucide-react';
import QueueItem from './QueueItem';
import { usePlayer } from '../context/usePlayer';
import AudioCanvasVisualizer from './AudioCanvasVisualizer';

export default function RightPanel({ collapsed = false, onToggle = () => {} }) {
  const { queue, clearQueue, currentTrack, isPlaying } = usePlayer();
  const panelWidth = collapsed ? '72px' : '260px';

  return (
    <aside
      className="relative flex flex-col rounded-3xl overflow-hidden shrink-0 transition-all duration-300 bg-white/[0.03] backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
      style={{ width: panelWidth }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand right panel' : 'Collapse right panel'}
        className={`
          absolute top-5 left-4 z-20
          w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10
          flex items-center justify-center
          text-white/50 hover:text-white
          transition-all duration-300
          ${collapsed ? 'rotate-180' : ''}
        `}
      >
        <ChevronRight size={16} />
      </button>

      <div
        aria-hidden={collapsed}
        className={`
          flex flex-col h-full pt-5
          transition-all duration-300
          ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        {/* Next Queue Header with count and clear button */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 pl-7">
            <ListMusic size={16} className="text-white" />
            <h3
              className="text-white font-bold text-sm tracking-tight"
              style={{ fontFamily: "'gg sans', sans-serif" }}
            >
              Up Next Queue
            </h3>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white/70 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                {queue.length}
              </span>
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
            <div className="flex flex-col items-center justify-center h-56 text-center px-4 text-white/30 space-y-2">
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Music size={20} className="opacity-40" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60">Queue is currently empty</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  Hover over any song and click &quot;Add to Queue&quot; to line up music
                </p>
              </div>
            </div>
          ) : (
            queue.map((track, i) => <QueueItem key={`${track.id}-${i}`} track={track} index={i} />)
          )}
        </div>

        {/* Now Streaming Mini Card Footer */}
        {currentTrack && (
          <div className="p-3.5 border-t border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={currentTrack.cover_url || currentTrack.cover || (currentTrack.videoId ? `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80')}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (currentTrack.videoId && !e.currentTarget.src.includes('i.ytimg.com')) {
                      e.currentTarget.src = `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg`;
                    } else {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
                    }
                  }}
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
    </aside>
  );
}
