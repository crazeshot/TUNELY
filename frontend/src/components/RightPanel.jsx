/**
 * RightPanel.jsx
 * Right sidebar exactly matching the screenshot:
 *  - > arrow top-left
 *  - Circular avatar with waveform animation + "Alex M." below
 *  - "Next Queue" heading (large, bold)
 *  - List of QueueItem rows with circular thumbnails
 */
import { ChevronRight } from 'lucide-react';
import QueueItem from './QueueItem';
import { usePlayer } from '../context/PlayerContext';

export default function RightPanel({ collapsed = false, onToggle = () => {} }) {
  const { queue } = usePlayer();
  const panelWidth = collapsed ? '56px' : '260px';

  return (
    <aside
      className="relative flex flex-col rounded-2xl overflow-hidden shrink-0 transition-all duration-300 bg-white/[0.04] backdrop-blur-lg bg-gradient-to-br from-white/16 via-white/8 to-white/[0.015] border border-white/10 ring-1 ring-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/18 before:to-transparent before:opacity-15 before:pointer-events-none after:content-[''] after:absolute after:inset-0 after:rounded-2xl after:bg-[url('https://www.transparenttextures.com/patterns/noise.png')] after:opacity-[0.02] after:pointer-events-none"
      style={{ width: panelWidth }}
    >
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand right panel' : 'Collapse right panel'}
        className={`
          absolute top-4 left-4 z-20
          text-white/35 hover:text-white/65
          transition-transform duration-300
          ${collapsed ? 'rotate-180' : ''}
        `}
      >
        <ChevronRight size={20} />
      </button>

      <div
        aria-hidden={collapsed}
        className={`
          flex flex-col h-full
          pt-5
          transition-all duration-300
          ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        style={{ transform: collapsed ? 'translateX(16px)' : 'translateX(0)' }}
      >
        {/* User profile block */}
        <div className="flex flex-col items-center pt-2 pb-5">
          {/* Avatar circle with waveform */}
          <div className="relative mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {/* Waveform icon (matches screenshot's audio waveform glyph) */}
              <div className="flex items-end gap-[2.5px] h-6 text-white/70">
                <span className="wbar" style={{ height: '35%' }} />
                <span className="wbar" style={{ height: '70%' }} />
                <span className="wbar" style={{ height: '100%' }} />
                <span className="wbar" style={{ height: '55%' }} />
                <span className="wbar" style={{ height: '80%' }} />
                <span className="wbar" style={{ height: '40%' }} />
              </div>
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#1a0a1e]" />
          </div>
          <p className="text-white text-sm font-semibold">Crazeshot.</p>
        </div>

        {/* Next Queue */}
        <div className="px-4 pb-3">
          <h3
            className="text-white font-bold text-lg"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.3px' }}
          >
            Next Queue
          </h3>
        </div>

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
          {queue.length === 0
            ? <p className="text-white/25 text-xs text-center mt-10">Queue is empty</p>
            : queue.map((t, i) => <QueueItem key={t.id} track={t} index={i} />)
          }
        </div>
      </div>
    </aside>
  );
}
