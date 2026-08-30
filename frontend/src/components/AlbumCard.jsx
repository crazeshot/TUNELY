import { useState } from 'react';
import { Play, Pause, MoreVertical, Heart } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import TrackContextMenu from './TrackContextMenu';
import { getCoverUrl, handleCoverError } from '../utils/coverUrl';

export default function AlbumCard({ track, delay = 0 }) {
  const { playTrack, togglePlay, currentTrack, isPlaying, likedTrackIds, toggleLike } = usePlayer();
  const [contextMenuPos, setContextMenuPos] = useState(null);

  const isCurrent = (currentTrack?.videoId && track?.videoId)
    ? currentTrack.videoId === track.videoId
    : (currentTrack?.id !== undefined && track?.id !== undefined && currentTrack.id === track.id);
  const isLiked = likedTrackIds.has(track.id);

  const handleCardClick = () => {
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

  const handleLikeClick = (e) => {
    e.stopPropagation();
    toggleLike(track);
  };

  return (
    <>
      <div
        className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 bg-white/[0.02] border border-white/10 hover:border-white/30"
        style={{
          aspectRatio: '3/4',
          animationName: 'fadeUp',
          animationDuration: '0.5s',
          animationTimingFunction: 'ease-out',
          animationFillMode: 'both',
          animationDelay: `${delay}ms`,
        }}
        onClick={handleCardClick}
      >
        {/* Album Cover */}
        <img
          src={getCoverUrl(track)}
          alt={track.title}
          loading="lazy"
          onError={(e) => handleCoverError(e, track)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Active border glow */}
        {isCurrent && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-white shadow-[inset_0_0_20px_rgba(255,255,255,0.35)] pointer-events-none" />
        )}

        {/* Top actions: Like & More */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={handleLikeClick}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <Heart size={14} className={isLiked ? 'text-white fill-white' : ''} />
          </button>
          <button
            onClick={handleMoreClick}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-white text-black border border-white/60 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.5)] transform scale-90 group-hover:scale-100 transition-transform">
            {isCurrent && isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} className="ml-0.5" />
            )}
          </div>
        </div>

        {/* Active playing waveform */}
        {isCurrent && isPlaying && (
          <div className="absolute top-3 right-3 flex items-end gap-0.5 h-4 text-white bg-black/60 px-2 py-1 rounded-full backdrop-blur-md">
            <span className="wbar" style={{ height: '55%' }} />
            <span className="wbar" style={{ height: '100%' }} />
            <span className="wbar" style={{ height: '40%' }} />
            <span className="wbar" style={{ height: '75%' }} />
          </div>
        )}

        {/* Title, Artist, Genre footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
          {track.genre && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-white/70 mb-0.5">
              {track.genre}
            </span>
          )}
          <p className="text-white font-semibold text-sm leading-snug truncate drop-shadow-md">
            {track.title}
          </p>
          <p className="text-white/60 text-xs mt-0.5 truncate">
            {track.artist_name || track.artist}
          </p>
        </div>
      </div>

      {/* Context Menu */}
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
