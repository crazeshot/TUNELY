import { useState, useRef, useEffect } from 'react';
import {
  Play,
  ListPlus,
  ListOrdered,
  Heart,
  Plus,
  Share2,
  User,
  Radio,
  Download,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';

export default function TrackContextMenu({ track, onClose, position = { x: 0, y: 0 } }) {
  const {
    playTrack,
    playNext,
    addToQueue,
    toggleLike,
    likedTrackIds,
    playlists,
    addTrackToPlaylist,
    setActiveArtistModal,
    setShareTrackModal,
    startTrackRadio,
    downloadTrack,
    removeDownloadedTrack,
    downloadedTrackIds,
  } = usePlayer();

  const [showPlaylists, setShowPlaylists] = useState(false);
  const menuRef = useRef(null);

  const isLiked = likedTrackIds.has(track.id);
  const isDownloaded = downloadedTrackIds.has(track.id);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-52 py-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl border border-white/15 text-xs text-white/90 animate-fade-in"
      style={{
        top: Math.min(position.y, window.innerHeight - 320),
        left: Math.min(position.x, window.innerWidth - 230),
        background: 'rgba(24, 25, 30, 0.98)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => { playTrack(track); onClose(); }}
      >
        <Play size={13} className="text-white/70" />
        <span>Play Now</span>
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => {
          startTrackRadio(track);
          onClose();
        }}
      >
        <Radio size={13} className="text-white" />
        <span className="text-white font-medium">Start Track Radio</span>
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => { playNext(track); onClose(); }}
      >
        <ListOrdered size={13} className="text-white/70" />
        <span>Play Next</span>
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => { addToQueue(track); onClose(); }}
      >
        <ListPlus size={13} className="text-white/70" />
        <span>Add to Queue</span>
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => {
          if (track.youtube_url) {
            window.open(track.youtube_url, '_blank', 'noopener,noreferrer');
          } else if (track.videoId) {
            window.open(`https://www.youtube.com/watch?v=${track.videoId}`, '_blank', 'noopener,noreferrer');
          }
          onClose();
        }}
      >
        <ExternalLink size={13} className="text-white/70" />
        <span>Watch on YouTube</span>
      </button>

      {/* Add to Playlist Sub-Trigger */}
      <div className="relative group/sub">
        <button
          className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowPlaylists((v) => !v);
          }}
        >
          <div className="flex items-center gap-2.5">
            <Plus size={13} className="text-white/70" />
            <span>Add to Playlist</span>
          </div>
          <ChevronRight size={12} className="text-white/40" />
        </button>

        {/* Submenu on hover / click */}
        {showPlaylists && (
          <div className="absolute left-full top-0 ml-1 w-48 bg-neutral-900 border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in backdrop-blur-xl">
            <div className="max-h-40 overflow-y-auto">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 text-left text-xs text-white/80 hover:text-white truncate"
                  onClick={() => {
                    addTrackToPlaylist(pl.id, track);
                    onClose();
                  }}
                >
                  <FolderPlus size={11} className="text-white/50 shrink-0" />
                  <span className="truncate">{pl.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Offline download toggle */}
      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => {
          if (isDownloaded) removeDownloadedTrack(track.id);
          else downloadTrack(track);
          onClose();
        }}
      >
        {isDownloaded ? (
          <>
            <CheckCircle2 size={13} className="text-green-400" />
            <span className="text-green-300">Saved Offline</span>
          </>
        ) : (
          <>
            <Download size={13} className="text-white/70" />
            <span>Download for Offline</span>
          </>
        )}
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => {
          setActiveArtistModal(track);
          onClose();
        }}
      >
        <User size={13} className="text-white/70" />
        <span>View Artist Profile</span>
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => { toggleLike(track); onClose(); }}
      >
        <Heart size={13} className={isLiked ? 'text-white fill-white' : 'text-white/70'} />
        <span>{isLiked ? 'Remove from Liked' : 'Save to Liked Songs'}</span>
      </button>

      <button
        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-white/10 text-left transition-colors"
        onClick={() => {
          setShareTrackModal(track);
          onClose();
        }}
      >
        <Share2 size={13} className="text-white/70" />
        <span>Share Track</span>
      </button>
    </div>
  );
}
