import { X, Play, BadgeCheck, Users } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import { allTracks } from '../data/musicData';

export default function ArtistModal() {
  const {
    activeArtistModal,
    setActiveArtistModal,
    playTrack,
    addToQueue,
  } = usePlayer();

  if (!activeArtistModal) return null;

  const artistName = activeArtistModal.name || activeArtistModal.artist_name || activeArtistModal.artist;
  const artistTracks = allTracks.filter(
    (t) => (t.artist_name || t.artist).toLowerCase() === artistName.toLowerCase()
  );

  const avatar = activeArtistModal.avatar_url || activeArtistModal.avatar || activeArtistModal.cover_url || activeArtistModal.cover;
  const listeners = activeArtistModal.monthly_listeners || '18.5M';
  const bio = activeArtistModal.bio || `${artistName} is an internationally acclaimed recording artist known for genre-defying production, emotive vocals, and sonic exploration.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-lg animate-fade-in text-white"
      onClick={() => setActiveArtistModal(null)}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 24, 30, 0.98) 0%, rgba(10, 11, 15, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden">
          <img
            src={avatar}
            alt={artistName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16181e] via-[#16181e]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={() => setActiveArtistModal(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Artist details on banner */}
          <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-white/80">
                  Verified Artist
                </span>
                <BadgeCheck size={16} className="text-white fill-white/20" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {artistName}
              </h2>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                <Users size={13} />
                <span>{listeners} monthly listeners</span>
              </div>
            </div>

            {artistTracks.length > 0 && (
              <button
                onClick={() => playTrack(artistTracks[0])}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
              >
                <Play size={14} className="fill-black" />
                <span>Play Discography</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content: Bio & Popular Tracks */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
              About the Artist
            </h3>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
              {bio}
            </p>
          </div>

          {/* Popular Tracks */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
              Popular Tracks
            </h3>
            <div className="space-y-1.5">
              {artistTracks.length === 0 ? (
                <p className="text-xs text-white/40 italic">No catalog tracks available.</p>
              ) : (
                artistTracks.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group"
                    onClick={() => playTrack(t)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-white/40 w-4 text-center">
                        {idx + 1}
                      </span>
                      <img
                        src={t.cover_url || t.cover}
                        alt={t.title}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-white/50 truncate">{t.genre || 'Single'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(t);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                      >
                        + Queue
                      </button>
                      <span className="text-xs font-mono text-white/40">{t.duration || '3:30'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
