import { ChevronRight, Trash2, ListMusic, Sparkles, LogIn, LogOut } from 'lucide-react';
import QueueItem from './QueueItem';
import { usePlayer } from '../context/usePlayer';
import { useAuth } from '../context/useAuth';

export default function RightPanel({ collapsed = false, onToggle = () => {} }) {
  const { queue, clearQueue, currentTrack } = usePlayer();
  const { user, isLoggedIn, logout, setIsAuthModalOpen } = useAuth();
  const panelWidth = collapsed ? '64px' : '280px';

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
          flex flex-col h-full pt-6
          transition-all duration-300
          ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        {/* User profile block */}
        <div className="flex flex-col items-center pb-4 px-4 border-b border-white/10">
          <div className="relative mb-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl p-0.5 bg-white/20 border border-white/40">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user.display_name || user.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {/* Online status indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#12141a] shadow-sm" />
          </div>

          <div className="flex items-center gap-1.5 text-center">
            <p className="text-white text-xs font-bold tracking-tight truncate max-w-[160px]" style={{ fontFamily: 'Syne, sans-serif' }}>
              {user.display_name || user.username || 'Alex Morgan'}
            </p>
            <Sparkles size={12} className="text-white shrink-0" />
          </div>
          <span className="text-[10px] text-white/40 mb-2">
            {isLoggedIn ? 'Audiophile • Member' : 'Guest Listener'} • {user.total_minutes_listened || 1420}m
          </span>

          {/* Auth Button */}
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-red-400 transition-colors"
            >
              <LogOut size={11} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-[11px] font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all"
            >
              <LogIn size={11} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>

        {/* Next Queue Header with count and clear button */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <ListMusic size={15} className="text-white" />
            <h3
              className="text-white font-bold text-xs tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Next Queue
            </h3>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/60 font-mono bg-white/10 px-2 py-0.5 rounded-full">
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

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center px-4 text-white/30">
              <ListMusic size={28} className="mb-2 opacity-40" />
              <p className="text-xs font-medium">Queue is empty</p>
              <p className="text-[10px] text-white/20 mt-1">
                Hover over songs to add them to your queue
              </p>
            </div>
          ) : (
            queue.map((track, i) => <QueueItem key={`${track.id}-${i}`} track={track} index={i} />)
          )}
        </div>

        {/* Mini Now Playing card footer */}
        {currentTrack && (
          <div className="p-3 border-t border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <img
                src={currentTrack.cover_url || currentTrack.cover}
                alt={currentTrack.title}
                className="w-8 h-8 rounded-lg object-cover shadow-md"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-semibold text-white/70">Now Streaming</span>
                <p className="text-white text-xs font-semibold truncate">{currentTrack.title}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
