/**
 * AlbumCard.jsx
 * Portrait-ratio card with album art filling the card,
 * title + artist overlaid at the bottom (matching screenshot).
 * Shows play overlay on hover. Waveform indicator when active.
 */
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export default function AlbumCard({ track, delay = 0 }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const active = currentTrack?.id === track.id;

  return (
    <div
      className="group relative cursor-pointer rounded-2xl overflow-hidden"
      style={{
        aspectRatio: '3/4',
        animationDelay: `${delay}ms`,
        animation: 'fadeUp 0.4s ease-out both',
      }}
      onClick={() => playTrack(track)}
    >
      {/* Album art */}
      <img
        src={track.cover}
        alt={track.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient overlay so bottom text is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Active ring */}
      {active && <div className="absolute inset-0 rounded-2xl ring-2 ring-pink-500/80" />}

      {/* Hover play button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
          <Play size={18} fill="white" className="text-white ml-0.5" />
        </div>
      </div>

      {/* Waveform on active+playing */}
      {active && isPlaying && (
        <div className="absolute top-2 right-2 flex items-end gap-[2px] h-4 text-pink-400">
          <span className="wbar" style={{ height: '55%' }} />
          <span className="wbar" style={{ height: '100%' }} />
          <span className="wbar" style={{ height: '40%' }} />
          <span className="wbar" style={{ height: '75%' }} />
        </div>
      )}

      {/* Title + Artist at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm leading-tight truncate">{track.title}</p>
        <p className="text-white/55 text-xs mt-0.5 truncate">{track.artist}</p>
      </div>
    </div>
  );
}
