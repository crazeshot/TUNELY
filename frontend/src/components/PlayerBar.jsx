/**
 * PlayerBar.jsx
 * Bottom player bar exactly as in the screenshot:
 *  - Small square album art thumbnail (left)
 *  - Song title + artist
 *  - |◄  ▶  ►| controls
 *  - Progress bar (thin line)
 *  - Volume icon (right)
 */
import { SkipBack, Play, Pause, SkipForward, Volume2, BoomBox } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

function secToDisplay(progress, durSec) {
  const elapsed = Math.floor((progress / 100) * durSec);
  return `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`;
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, progress, togglePlay, prevTrack, nextTrack, setProgress } = usePlayer();
  if (!currentTrack) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Top row: thumb + title + controls */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {/* Album art */}
        <img
          src={currentTrack.cover}
          alt={currentTrack.title}
          className="w-10 h-10 rounded-lg object-cover shrink-0"
        />

        {/* Title + artist */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{currentTrack.title}</p>
          <p className="text-white/45 text-xs truncate">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={prevTrack} className="text-white/50 hover:text-white transition-colors">
            <SkipBack size={15} />
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors shadow-md"
          >
            {isPlaying
              ? <Pause size={13} className="text-black" />
              : <Play  size={13} className="text-black ml-0.5" />}
          </button>
          <button onClick={nextTrack} className="text-white/50 hover:text-white transition-colors">
            <SkipForward size={15} />
          </button>
          <Volume2 size={15} className="text-white/35" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-3">
        <div className="relative">
          <div className="prog-track w-full">
            <div className="prog-fill" style={{ width: `${progress}%` }} />
          </div>
          <input
            type="range" min={0} max={100} value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full"
          />
        </div>
        <div className="flex justify-start mt-2">
          <button
            type="button"
            onClick={() => {}}
            className="text-white/50 hover:text-white transition-colors"
          >
            <BoomBox size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
