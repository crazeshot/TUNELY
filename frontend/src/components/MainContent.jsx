import { useState, useMemo, useEffect, useCallback } from 'react';
import { Play, Sparkles, Heart, Clock, Music, Disc, Users, Command, Trophy, Download, Radio, Search } from 'lucide-react';
import SearchBar from './SearchBar';
import AlbumCard from './AlbumCard';
import BottomNav from './BottomNav';
import AudioCanvasVisualizer from './AudioCanvasVisualizer';
import { recommended, recentlyPlayed, allTracks, genresList } from '../data/musicData';
import { usePlayer } from '../context/usePlayer';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import { getAllOfflineTracks } from '../services/offlineStorage';

const MOODS = [
  { id: 'All', label: 'All Moods', emoji: '✨' },
  { id: 'Chill', label: 'Late Night', emoji: '🌙' },
  { id: 'Energy', label: 'High Energy', emoji: '⚡' },
  { id: 'Focus', label: 'Deep Focus', emoji: '☕' },
  { id: 'Melancholy', label: 'Melancholy', emoji: '💔' },
  { id: 'Drive', label: 'Night Drive', emoji: '🚗' },
];

export default function MainContent() {
  const {
    activeTab,
    activeGenre,
    setActiveGenre,
    activeMood,
    setActiveMood,
    playTrack,
    playlists,
    history,
    likedTrackIds,
    downloadedTrackIds,
    dailyMixes,
    addToQueue,
    setActiveArtistModal,
    setIsCommandPaletteOpen,
  } = usePlayer();

  const { setIsWrappedOpen } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState('all'); // 'all' | 'ytm'
  const [dbTracks, setDbTracks] = useState([]);
  const [offlineTrackList, setOfflineTrackList] = useState([]);

  // YouTube Music search state
  const [ytmTracks, setYtmTracks] = useState([]);
  const [ytmTrending, setYtmTrending] = useState([]);
  const [isYtmLoading, setIsYtmLoading] = useState(false);

  // Fetch live tracks from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadTracks() {
      const [data, trending] = await Promise.all([
        api.getTracks(),
        api.getYTMTrending(),
      ]);
      if (isMounted) {
        if (data && data.length > 0) setDbTracks(data);
        if (trending && trending.length > 0) setYtmTrending(trending);
      }
    }
    loadTracks();
    return () => { isMounted = false; };
  }, []);

  // Fetch offline tracks for Library
  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'library') {
      getAllOfflineTracks().then((list) => {
        if (isMounted) setOfflineTrackList(list);
      });
    }
    return () => { isMounted = false; };
  }, [activeTab, downloadedTrackIds]);

  // YouTube Music search effect (fast 180ms debounce + in-memory cache)
  useEffect(() => {
    let isMounted = true;
    if (searchSource === 'ytm' && searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        setIsYtmLoading(true);
        const results = await api.searchYTM(searchQuery.trim(), 16);
        if (isMounted) {
          setYtmTracks(results);
          setIsYtmLoading(false);
        }
      }, 180);
      return () => clearTimeout(timer);
    }
    return () => { isMounted = false; };
  }, [searchSource, searchQuery]);

  const displayedYtmTracks = searchQuery.trim().length >= 2 ? ytmTracks : [];

  const effectiveTracks = useMemo(() => {
    return dbTracks.length > 0 ? dbTracks : allTracks;
  }, [dbTracks]);

  const featuredTrack = effectiveTracks[0] || allTracks[0];

  const filterTracks = useCallback((trackList, query, genre, mood) => {
    let list = trackList;
    if (genre && genre !== 'All') {
      list = list.filter((t) => (t.genre || '').toLowerCase() === genre.toLowerCase());
    }
    if (mood && mood !== 'All') {
      if (mood === 'Chill') list = list.filter((t) => /pop|folk|chill/i.test(t.genre));
      else if (mood === 'Energy') list = list.filter((t) => /rock|disco|synth/i.test(t.genre));
      else if (mood === 'Focus') list = list.filter((t) => /ambient|art|pop/i.test(t.genre));
      else if (mood === 'Melancholy') list = list.filter((t) => /folk|indie|soul/i.test(t.genre));
      else if (mood === 'Drive') list = list.filter((t) => /synth|disco|dream/i.test(t.genre));
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.artist_name || t.artist || '').toLowerCase().includes(q) ||
          (t.genre || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, []);

  const recList = useMemo(() => {
    const base = dbTracks.length > 0 ? dbTracks.slice(0, 8) : recommended;
    return filterTracks(base, searchQuery, activeGenre, activeMood);
  }, [dbTracks, searchQuery, activeGenre, activeMood, filterTracks]);

  const recentList = useMemo(() => {
    const base = dbTracks.length > 0 ? dbTracks.slice(4, 10) : recentlyPlayed;
    return filterTracks(base, searchQuery, activeGenre, activeMood);
  }, [dbTracks, searchQuery, activeGenre, activeMood, filterTracks]);

  const likedTracks = useMemo(() => {
    return effectiveTracks.filter((t) => likedTrackIds.has(t.id));
  }, [effectiveTracks, likedTrackIds]);

  // Extract distinct popular artists
  const popularArtists = useMemo(() => {
    const map = new Map();
    effectiveTracks.forEach((t) => {
      const name = t.artist_name || t.artist;
      if (!map.has(name)) {
        map.set(name, {
          name,
          avatar: t.cover_url || t.cover,
          genre: t.genre,
          monthly_listeners: '21.4M',
        });
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [effectiveTracks]);

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-6">
        {/* Search Bar & Spotlight trigger */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </div>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white/70 hover:text-white transition-all shadow-md shrink-0"
              title="Open Command Palette (Ctrl+K)"
            >
              <Command size={13} className="text-pink-400" />
              <span className="font-mono text-[11px]">Ctrl+K</span>
            </button>
          </div>

          {/* Search Source Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchSource('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                searchSource === 'all'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <Disc size={12} />
              <span>Tunely Catalog</span>
            </button>

            <button
              onClick={() => setSearchSource('ytm')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                searchSource === 'ytm'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <Radio size={12} />
              <span>YouTube Music (Search Millions)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Views based on Search Source & Active Tab */}
        {searchSource === 'ytm' ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Radio size={18} className="text-white" />
                  <SectionTitle>
                    {searchQuery.trim() ? `YouTube Music Results for "${searchQuery}"` : 'Trending on YouTube Music'}
                  </SectionTitle>
                </div>
                {isYtmLoading && <span className="text-xs text-white/70 animate-pulse">Searching catalog...</span>}
              </div>

              {searchQuery.trim() ? (
                displayedYtmTracks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mt-3">
                    {displayedYtmTracks.map((t, i) => (
                      <AlbumCard key={t.id} track={t} delay={i * 30} />
                    ))}
                  </div>
                ) : !isYtmLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-white/40 text-center">
                    <Search size={36} className="mb-2 opacity-40" />
                    <p className="text-sm">Type any artist or song name above to search YouTube Music</p>
                  </div>
                ) : null
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mt-3">
                  {(ytmTrending.length > 0 ? ytmTrending : effectiveTracks).map((t, i) => (
                    <AlbumCard key={t.id} track={t} delay={i * 30} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <>
                {/* Featured Hero Banner */}
                {!searchQuery && (
                  <div
                    className="relative rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-2xl border border-white/15 transition-all duration-700"
                    style={{
                      minHeight: '230px',
                      background: `linear-gradient(135deg, rgba(30, 35, 45, 0.95) 0%, rgba(12, 14, 20, 0.98) 100%)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    {/* Ambient Visualizer waveform inside hero */}
                    <div className="absolute right-4 bottom-4 w-48 h-16 opacity-40 pointer-events-none hidden sm:block">
                      <AudioCanvasVisualizer mode="wave" height={60} />
                    </div>

                    <div className="relative z-10 space-y-2 max-w-lg">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                        <Sparkles size={12} />
                        <span>Featured Track of the Day</span>
                      </div>
                      <h1
                        className="text-white text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        {featuredTrack?.title || 'Midnight City'}
                      </h1>
                      <p
                        className="text-white/80 text-xs sm:text-sm hover:underline cursor-pointer inline-block"
                        onClick={() => setActiveArtistModal(featuredTrack)}
                      >
                        {featuredTrack?.artist_name || featuredTrack?.artist} • {featuredTrack?.genre || 'Dream Pop'}
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => playTrack(featuredTrack)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
                        >
                          <Play size={14} className="fill-black" />
                          <span>Play Now</span>
                        </button>
                        <button
                          onClick={() => addToQueue(featuredTrack)}
                          className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium backdrop-blur-md transition-all"
                        >
                          Add to Queue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tunely Wrapped Mini Teaser Banner */}
                {!searchQuery && (
                  <div
                    onClick={() => setIsWrappedOpen(true)}
                    className="relative rounded-2xl p-4 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-transparent border border-white/15 flex items-center justify-between cursor-pointer hover:scale-101 transition-all shadow-lg group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
                        <Trophy size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white group-hover:text-white/80 transition-colors">
                          Your 2026 Tunely Wrapped is Ready!
                        </h3>
                        <p className="text-[11px] text-white/60">Discover your top tracks, minutes streamed & music personality</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                      View Story →
                    </span>
                  </div>
                )}

                {/* Mood Selector Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMood(m.id)}
                      className={`
                        flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200
                        ${
                          activeMood === m.id
                            ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-105'
                            : 'bg-white/10 hover:bg-white/15 text-white/70 hover:text-white border border-white/10'
                        }
                      `}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Genre Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {genresList.map((g) => (
                    <button
                      key={g.name}
                      onClick={() => setActiveGenre(g.name)}
                      className={`
                        px-3.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-200
                        ${
                          activeGenre === g.name
                            ? 'bg-white text-black font-semibold shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                        }
                      `}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>

                {/* Curated Daily Mixes Section */}
                {dailyMixes.length > 0 && !searchQuery && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <SectionTitle>Made For You: Daily Mixes</SectionTitle>
                      <span className="text-xs text-white/40">{dailyMixes.length} stations</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {dailyMixes.map((mix) => (
                        <div
                          key={mix.id}
                          onClick={() => {
                            if (mix.tracks && mix.tracks.length > 0) playTrack(mix.tracks[0]);
                          }}
                          className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/10 cursor-pointer transition-all hover:scale-102 group flex items-center gap-3.5"
                        >
                          <img
                            src={mix.cover_url}
                            alt={mix.title}
                            className="w-14 h-14 rounded-xl object-cover shadow-md group-hover:ring-2 group-hover:ring-pink-500/70"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{mix.title}</h4>
                            <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5">{mix.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recommended Section */}
                {recList.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <SectionTitle>Recommended For You</SectionTitle>
                      <span className="text-xs text-white/40">{recList.length} tracks</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {recList.map((t, i) => (
                        <AlbumCard key={t.id} track={t} delay={i * 60} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Popular Artists Carousel */}
                {popularArtists.length > 0 && !searchQuery && (
                  <section className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-pink-400" />
                        <SectionTitle>Popular Artists</SectionTitle>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {popularArtists.map((artist) => (
                        <div
                          key={artist.name}
                          onClick={() => setActiveArtistModal(artist)}
                          className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.03] hover:bg-white/10 border border-white/5 cursor-pointer transition-all hover:scale-105 group"
                        >
                          <img
                            src={artist.avatar}
                            alt={artist.name}
                            className="w-16 h-16 rounded-full object-cover shadow-lg mb-2 group-hover:ring-2 group-hover:ring-pink-500/80 transition-all"
                          />
                          <p className="text-xs font-bold text-white truncate max-w-full">{artist.name}</p>
                          <span className="text-[10px] text-white/40">{artist.genre}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recently Played Section */}
                {recentList.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <SectionTitle>Recently Streamed</SectionTitle>
                      <span className="text-xs text-white/40">{recentList.length} tracks</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {recentList.map((t, i) => (
                        <AlbumCard key={t.id} track={t} delay={i * 60 + 200} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty filter state */}
                {recList.length === 0 && recentList.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-52 text-white/30 text-center">
                    <Music size={40} className="mb-3 opacity-40" />
                    <p className="text-sm font-semibold">No tracks match your current filters</p>
                    <p className="text-xs text-white/20 mt-1">Try resetting mood or searching for a different song</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div>
                  <SectionTitle>Browse Genres & Moods</SectionTitle>
                  <p className="text-xs text-white/50 mb-3">Discover music across frequencies</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {genresList.filter(g => g.name !== 'All').map((g) => (
                      <div
                        key={g.name}
                        onClick={() => { setActiveGenre(g.name); }}
                        className={`h-24 rounded-2xl p-4 bg-gradient-to-br ${g.color} cursor-pointer hover:scale-105 transition-all shadow-lg flex flex-col justify-between`}
                      >
                        <Disc size={20} className="text-white/70" />
                        <span className="text-sm font-bold text-white tracking-tight">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Results */}
                <div>
                  <SectionTitle>Search Catalog</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mt-3">
                    {filterTracks(effectiveTracks, searchQuery, activeGenre, activeMood).map((t, i) => (
                      <AlbumCard key={t.id} track={t} delay={i * 40} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-6">
                {/* Liked Songs Hero Card */}
                <div
                  className="rounded-3xl p-6 bg-gradient-to-r from-pink-600/40 via-purple-600/40 to-indigo-600/40 border border-white/15 flex items-center justify-between shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                      <Heart size={28} className="text-white fill-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                        Liked Songs
                      </h2>
                      <p className="text-xs text-white/60">{likedTracks.length} favorite tracks</p>
                    </div>
                  </div>
                  {likedTracks.length > 0 && (
                    <button
                      onClick={() => playTrack(likedTracks[0])}
                      className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-all shadow-xl"
                    >
                      <Play size={18} className="fill-black ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Offline Downloaded Tracks Section */}
                {offlineTrackList.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Download size={16} className="text-green-400" />
                      <SectionTitle>Downloaded Offline ({offlineTrackList.length})</SectionTitle>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {offlineTrackList.map((t, i) => (
                        <AlbumCard key={`offline-${t.id}`} track={t} delay={i * 40} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Liked Tracks Grid */}
                {likedTracks.length > 0 && (
                  <section>
                    <SectionTitle>Your Favorites</SectionTitle>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mt-3">
                      {likedTracks.map((t, i) => (
                        <AlbumCard key={t.id} track={t} delay={i * 50} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Custom Playlists */}
                <section>
                  <SectionTitle>Your Playlists</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-3">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group"
                        onClick={() => {
                          if (pl.tracks && pl.tracks.length > 0) playTrack(pl.tracks[0]);
                        }}
                      >
                        <img
                          src={pl.cover_url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80'}
                          alt={pl.title}
                          className="w-full aspect-video object-cover rounded-xl mb-3 group-hover:scale-102 transition-transform"
                        />
                        <h4 className="text-sm font-bold text-white truncate">{pl.title}</h4>
                        <p className="text-xs text-white/50 truncate mt-0.5">{pl.description || `${(pl.tracks || []).length} songs`}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Listening History */}
                {history.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-pink-400" />
                      <SectionTitle>Listening History</SectionTitle>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {history.slice(0, 4).map((t, i) => (
                        <AlbumCard key={`hist-${t.id}-${i}`} track={t} delay={i * 50} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bottom Nav */}
      <div className="py-2.5 shrink-0">
        <BottomNav />
      </div>
    </main>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      className="text-white font-bold text-lg tracking-tight"
      style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.3px' }}
    >
      {children}
    </h2>
  );
}
