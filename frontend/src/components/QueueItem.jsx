import { useState } from 'react';
import { Play, Pause, X, MoreVertical } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import TrackContextMenu from './TrackContextMenu';

export default function QueueItem({ track, index }) {
  const { playTrack, togglePlay, removeFromQueue, currentTrack, isPlaying } = usePlayer();
  const [contextMenuPos, setContextMenuPos] = useState(null);

  if (!track) return null;

  const isCurrent = (currentTrack?.videoId && track?.videoId)
    ? currentTrack.videoId === track.videoId
    : (currentTrack?.id !== undefined && track?.id !== undefined && currentTrack.id === track.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPos({ x: rect.right, y: rect.bottom });
  };

  return (
    <>
      <div
        className={`group flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
        }`}
        onClick={handleRowClick}
      >
        {/* Track Number / Waveform / Circular Thumbnail */}
        <div className="relative shrink-0 w-9 h-9">
          <img
            src={track.cover_url || track.cover || (track.videoId ? `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80')}
            alt={track.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (track.videoId && !e.currentTarget.src.includes('i.ytimg.com')) {
                e.currentTarget.src = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
              } else {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
              }
            }}
            className="w-9 h-9 rounded-full object-cover shadow-sm"
          />

          {/* Hover Play icon */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {isCurrent && isPlaying ? (
              <Pause size={12} className="text-white" />
            ) : (
              <Play size={12} className="text-white ml-0.5" />
            )}
          </div>

          {/* Playing waveform indicator */}
          {isCurrent && isPlaying && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-end justify-center pb-1 gap-[1.5px] text-pink-400 group-hover:opacity-0 transition-opacity">
              <span className="wbar" style={{ height: '6px' }} />
              <span className="wbar" style={{ height: '11px' }} />
              <span className="wbar" style={{ height: '7px' }} />
            </div>
          )}
        </div>

        {/* Title + Artist */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold truncate ${
              isCurrent ? 'text-pink-400' : 'text-white/90 group-hover:text-white'
            }`}
          >
            {track.title}
          </p>
          <p className="text-white/45 text-[11px] truncate">
            {track.artist_name || track.artist}
          </p>
        </div>

        {/* Duration / Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-white/35 group-hover:hidden">
            {track.duration || '3:30'}
          </span>

          <button
            onClick={handleMoreClick}
            className="hidden group-hover:flex w-6 h-6 rounded-full hover:bg-white/10 items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical size={12} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFromQueue(track.id, index);
            }}
            className="hidden group-hover:flex w-6 h-6 rounded-full hover:bg-red-500/20 items-center justify-center text-white/40 hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {contextMenuPos && (
        <TrackContextMenu
          track={track}
          position={contextMenuPos}
          onClose={() => setContextMenuPos(null)}
        />
      )}
    </>
  );
}
