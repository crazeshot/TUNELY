import { X, Play, Shuffle, Trash2, Music, Clock, Plus } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';

export default function PlaylistModal() {
  const {
    activePlaylistModal,
    setActivePlaylistModal,
    playTrack,
    playPlaylist,
    removeTrackFromPlaylist,
    deletePlaylist,
    currentTrack,
    isPlaying,
    setActiveTab,
  } = usePlayer();

  if (!activePlaylistModal) return null;

  const tracks = activePlaylistModal.tracks || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in text-white"
      onClick={() => setActivePlaylistModal(null)}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.98) 0%, rgba(10, 11, 15, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 blur-[100px] pointer-events-none" />

        {/* Header with Close */}
        <div className="relative p-6 pb-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-4">
            <img
              src={activePlaylistModal.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'}
              alt={activePlaylistModal.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-2xl ring-1 ring-white/20 shrink-0"
            />
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-white/50 block mb-1">
                Playlist
              </span>
              <h2
                className="text-xl sm:text-2xl font-black tracking-tight"
                style={{ fontFamily: "'gg sans', sans-serif" }}
              >
                {activePlaylistModal.title}
              </h2>
              <p className="text-xs text-white/60 mt-1 line-clamp-2">
                {activePlaylistModal.description || 'Created on Tunely'}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-white/40 mt-1.5 font-mono">
                <span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
                <span>•</span>
                <span>Curated Library</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActivePlaylistModal(null)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="px-6 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => playPlaylist(activePlaylistModal, false)}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={14} className="fill-black" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => playPlaylist(activePlaylistModal, true)}
              disabled={tracks.length === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Shuffle size={13} />
              <span>Shuffle</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${activePlaylistModal.title}"?`)) {
                deletePlaylist(activePlaylistModal.id);
              }
            }}
            className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete Playlist"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {/* Tracklist content */}
        <div className="flex-1 overflow-y-auto p-6 z-10 space-y-2">
          {tracks.length === 0 ? (
            <div className="py-16 text-center text-white/40 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <Music size={22} className="text-white/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/70">This playlist is currently empty</p>
                <p className="text-xs text-white/40 mt-0.5">Explore songs and search music to add tracks to your playlist</p>
              </div>
              <button
                onClick={() => {
                  setActivePlaylistModal(null);
                  setActiveTab('search');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all mt-2"
              >
                <Plus size={13} />
                <span>Explore & Search Songs</span>
              </button>
            </div>
          ) : (
            tracks.map((t, idx) => {
              const isCurrentlyPlaying = currentTrack?.id === t.id && isPlaying;
              return (
                <div
                  key={`${t.id}-${idx}`}
                  onClick={() => playTrack(t)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer group ${
                    isCurrentlyPlaying
                      ? 'bg-white/15 border-white text-white shadow-lg'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-white/50 w-6 text-center shrink-0">
                      #{idx + 1}
                    </span>
                    <img
                      src={t.cover_url || t.cover || (t.videoId ? `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80')}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (t.videoId && !e.currentTarget.src.includes('i.ytimg.com')) {
                          e.currentTarget.src = `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`;
                        } else {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
                        }
                      }}
                      className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-white/50 truncate">{t.artist_name || t.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-white/40">
                      {t.duration || '3:20'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist(activePlaylistModal.id, t.id);
                      }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove from playlist"
                    >
                      <Trash2 size={13} />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black text-white flex items-center justify-center transition-all">
                      <Play size={12} className="fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
