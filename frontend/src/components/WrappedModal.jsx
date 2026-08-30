import { useMemo } from 'react';
import { X, Sparkles, Trophy, Flame, Share2, Play, Volume2, Music, Heart } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { usePlayer } from '../context/usePlayer';
import { getCoverUrl, handleCoverError } from '../utils/coverUrl';

export default function WrappedModal() {
  const { isWrappedOpen, setIsWrappedOpen, user } = useAuth();
  const {
    playTrack,
    currentTrack,
    isPlaying,
    history,
    likedTracks,
    playCounts,
    totalListeningSeconds,
    showToast,
  } = usePlayer();

  // Exact real-time minutes streamed by the active user
  const liveMinutes = useMemo(() => {
    return Math.floor((totalListeningSeconds || 0) / 60);
  }, [totalListeningSeconds]);

  // Exact top tracks sorted by real play counts
  const liveTopTracks = useMemo(() => {
    const combined = [];
    const seenKeys = new Set();

    const addTrack = (t) => {
      if (!t) return;
      const key = t.videoId || (t.id !== undefined && t.id !== null ? String(t.id) : t.title);
      if (!key || seenKeys.has(key)) return;
      seenKeys.add(key);
      const plays = playCounts?.[key] || 1;
      combined.push({ ...t, _plays: plays });
    };

    if (currentTrack) addTrack(currentTrack);
    (history || []).forEach(addTrack);
    (likedTracks || []).forEach(addTrack);

    return combined.sort((a, b) => b._plays - a._plays).slice(0, 5);
  }, [currentTrack, history, likedTracks, playCounts]);

  // Top artist based on actual listening history
  const topArtist = useMemo(() => {
    const artistCounts = {};
    [...(history || []), ...(likedTracks || [])].forEach((t) => {
      const name = t?.artist_name || t?.artist;
      if (name) {
        artistCounts[name] = (artistCounts[name] || 0) + (playCounts?.[t.videoId || t.id] || 1);
      }
    });
    const sorted = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : (liveTopTracks[0]?.artist_name || liveTopTracks[0]?.artist || 'Discovering...');
  }, [history, likedTracks, playCounts, liveTopTracks]);

  // Real-time Sonic Personality Archetype derived from actual track genres/titles
  const livePersonality = useMemo(() => {
    const genres = {};
    for (const t of liveTopTracks) {
      const g = (t.genre || t.title || 'Electronic').toLowerCase();
      genres[g] = (genres[g] || 0) + 1;
    }

    const topGenre = Object.keys(genres).sort((a, b) => genres[b] - genres[a])[0] || 'audiophile';

    if (topGenre.includes('synth') || topGenre.includes('electronic') || topGenre.includes('wave') || topGenre.includes('dance')) {
      return {
        title: 'Atmospheric Voyager',
        desc: 'You dwell in ethereal soundscapes, electronic pulses, and late-night synths.',
        badge: 'Audiophile rating: S+',
      };
    } else if (topGenre.includes('rock') || topGenre.includes('indie') || topGenre.includes('alt')) {
      return {
        title: 'Sonic Rebel & Explorer',
        desc: 'Raw analog distortion, punchy drums, and authentic indie narratives define your listening.',
        badge: 'Audiophile rating: S',
      };
    } else if (topGenre.includes('soul') || topGenre.includes('r&b') || topGenre.includes('hip')) {
      return {
        title: 'Velvet Groove Connoisseur',
        desc: 'Silky smooth vocal runs, acoustic depth, and deep bass foundations are your signature.',
        badge: 'Audiophile rating: S+',
      };
    } else if (topGenre.includes('chill') || topGenre.includes('ambient') || topGenre.includes('lo-fi') || topGenre.includes('folk')) {
      return {
        title: 'Midnight Focus Dreamer',
        desc: 'Downtempo resonance, tranquil ambient spaces, and acoustic warmth guide your flow.',
        badge: 'Audiophile rating: S',
      };
    }

    return {
      title: 'High-Res Audio Explorer',
      desc: 'You seek dynamic fidelity, expansive soundstages, and genuine musical discoveries.',
      badge: 'Audiophile rating: S+',
    };
  }, [liveTopTracks]);

  if (!isWrappedOpen) return null;

  const totalPlayedCount = (history || []).length;
  const totalLikedCount = (likedTracks || []).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in text-white"
      onClick={() => setIsWrappedOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.98) 0%, rgba(10, 11, 15, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] shrink-0">
              <Trophy size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                  {user?.username ? `${user.username}'s Retrospective` : 'Your Retrospective'}
                </span>
                <span className="flex items-center gap-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight" style={{ fontFamily: "'gg sans', sans-serif" }}>
                Tunely Wrapped 2026
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsWrappedOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
          {/* Top Stats Grid with Live Real-time Updating */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Minutes Streamed</span>
              <p className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {liveMinutes.toLocaleString()}
              </p>
              <span className="text-[10px] text-white/40">{totalListeningSeconds}s exact audio time</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Top Artist</span>
              <div className="flex items-center gap-1.5">
                <Flame size={16} className="text-amber-400 fill-amber-400 shrink-0" />
                <p className="text-base font-bold text-white truncate">
                  {topArtist}
                </p>
              </div>
              <span className="text-[10px] text-white/40">Most played in library</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Library Activity</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/90 flex items-center gap-1">
                  <Music size={12} className="text-white/60" /> {totalPlayedCount} played
                </span>
                <span className="text-xs font-mono text-white/90 flex items-center gap-1">
                  <Heart size={12} className="text-white/60" /> {totalLikedCount} liked
                </span>
              </div>
              <span className="text-[10px] text-white/40">{livePersonality.badge}</span>
            </div>
          </div>

          {/* Personality Card */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/15">
            <div className="flex items-center gap-2 text-xs uppercase font-bold text-white/80 mb-1">
              <Sparkles size={14} className="text-white" />
              <span>Real-Time Sonic Archetype</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2" style={{ fontFamily: "'gg sans', sans-serif" }}>
              {livePersonality.title}
            </h3>
            <p className="text-xs text-white/75 leading-relaxed font-light">
              {livePersonality.desc}
            </p>
          </div>

          {/* Top 5 Tracks dynamically rendered */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-white/60">
                Your Top Tracks
              </h4>
              <span className="text-[10px] font-mono text-white/40">
                Ranked by your play count
              </span>
            </div>

            {liveTopTracks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
                <Music size={28} className="mx-auto text-white/30 mb-2" />
                <p className="text-sm font-semibold text-white/80">No listening history yet</p>
                <p className="text-xs text-white/50 mt-1">Play songs from Search or Explore to generate your personal Wrapped rankings.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {liveTopTracks.map((t, idx) => {
                  const trackKey = t.videoId || t.id;
                  const isCurrentlyPlaying = (currentTrack?.videoId === t.videoId || (currentTrack?.id && currentTrack?.id === t.id)) && isPlaying;
                  return (
                    <div
                      key={`${trackKey}-${idx}`}
                      onClick={() => playTrack(t)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                        isCurrentlyPlaying
                          ? 'bg-white/15 border-white text-white shadow-lg'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-xs font-mono font-extrabold text-white bg-white/10 px-2 py-0.5 rounded-full w-8 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <img
                          src={getCoverUrl(t)}
                          alt={t.title}
                          onError={(e) => handleCoverError(e, t)}
                          className="w-11 h-11 rounded-xl object-cover shadow-md shrink-0"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          <p className="text-[11px] text-white/50 truncate">
                            {t.artist_name || t.artist} {t._plays > 1 ? `• ${t._plays} plays` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {isCurrentlyPlaying ? (
                          <div className="flex items-center gap-1 text-white text-xs font-bold px-2 py-1 rounded-full bg-white/20">
                            <Volume2 size={13} className="animate-pulse" />
                            <span>Playing</span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playTrack(t);
                            }}
                            className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black text-white flex items-center justify-center transition-all shadow-md"
                          >
                            <Play size={13} className="fill-current ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Share Action */}
        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between z-10">
          <span className="text-xs text-white/40">Tunely Audio • High-Res Lossless</span>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                showToast('Wrapped stats card link copied to clipboard!');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
          >
            <Share2 size={13} />
            <span>Share My Wrapped</span>
          </button>
        </div>
      </div>
    </div>
  );
}
