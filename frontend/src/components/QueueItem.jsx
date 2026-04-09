/**
 * QueueItem.jsx
 * Single row in the Next Queue panel.
 * Uses CIRCULAR thumbnail (matching screenshot).
 * Shows waveform icon on the left for now-playing item.
 */
import { usePlayer } from '../context/PlayerContext';

export default function QueueItem({ track, index }) {
  const { playTrack, removeQueue, currentTrack, isPlaying } = usePlayer();
  const active = currentTrack?.id === track.id;

  return (
    <div
      className="group flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
      onClick={() => playTrack(track)}
    >
      {/* Left: waveform icon (if active playing) or circular thumbnail */}
      <div className="relative shrink-0 w-10 h-10">
        <img
          src={track.cover}
          alt={track.title}
          className="w-10 h-10 rounded-full object-cover"
        />
        {active && isPlaying && (
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-end justify-center pb-1 gap-[1.5px] text-pink-400">
            <span className="wbar" style={{ height: '5px' }} />
            <span className="wbar" style={{ height: '9px' }} />
            <span className="wbar" style={{ height: '5px' }} />
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${active ? 'text-pink-400' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-white/45 text-xs truncate">{track.artist}</p>
      </div>

      {/* Remove button on hover */}
      <button
        onClick={e => { e.stopPropagation(); removeQueue(track.id); }}
        className="opacity-0 group-hover:opacity-100 text-white/25 hover:text-red-400 text-xs transition-all"
      >
        ✕
      </button>
    </div>
  );
}
