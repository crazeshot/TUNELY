/**
 * Sidebar.jsx
 * Left panel — exactly matching the screenshot:
 *  - "Tunelly" logo top-left
 *  - Back arrow top-right
 *  - Empty space in middle (no nav links shown)
 *  - "New Playlist" wide button near bottom
 *  - PlayerBar pinned to very bottom
 */
import { ChevronLeft } from 'lucide-react';
import PlayerBar from './PlayerBar';

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  const panelWidth = collapsed ? '56px' : '280px';

  return (
    <aside
      className="relative flex flex-col shrink-0 rounded-2xl overflow-hidden transition-all duration-300 bg-white/[0.04] backdrop-blur-lg bg-gradient-to-br from-white/16 via-white/8 to-white/[0.015] border border-white/10 ring-1 ring-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/18 before:to-transparent before:opacity-15 before:pointer-events-none after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-[url('https://www.transparenttextures.com/patterns/noise.png')] after:opacity-[0.02] after:pointer-events-none"
      style={{ width: panelWidth }}
    >
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand left panel' : 'Collapse left panel'}
        className={`
          absolute top-4 right-4 z-20
          text-white/40 hover:text-white/70
          transition-transform duration-300
          ${collapsed ? 'rotate-180' : ''}
        `}
      >
        <ChevronLeft size={20} />
      </button>

      <div
        aria-hidden={collapsed}
        className={`
          flex flex-col h-full
          transition-all duration-300
          ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        style={{ transform: collapsed ? 'translateX(-16px)' : 'translateX(0)' }}
      >
        {/* Top: logo */}
        <div className="flex items-start px-6 pt-6 pb-4">
          <h1
            className="text-white font-bold tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif', fontSize: '26px', letterSpacing: '-0.5px' }}
          >
            Tunelly
          </h1>
        </div>

        {/* Empty middle — this is the blurred background showing through */}
        <div className="flex-1" />

        {/* New Playlist button */}
        <div className="px-4 pb-4">
          <button
            className="
              w-full flex items-center justify-center gap-2
              bg-white/10 hover:bg-white/15
              border border-white/20 hover:border-white/35
              text-white/80 hover:text-white
              text-sm font-medium
              py-3 rounded-2xl
              transition-all duration-200
            "
          >
            <span className="text-lg leading-none">+</span>
            New Playlist
          </button>
        </div>

        {/* Player bar pinned to bottom */}
        <div className="px-3 pb-3">
          <PlayerBar />
        </div>
      </div>
    </aside>
  );
}
