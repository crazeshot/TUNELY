import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Play,
  Sliders,
  Moon,
  Sparkles,
  Zap,
  Maximize2,
  Trash2,
  Home,
  LayoutGrid,
  Settings,
  User,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import { api } from '../services/api';

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    playTrack,
    likedTracks,
    history,
    toggleSlowedReverb,
    toggleNightcore,
    setIsEqualizerOpen,
    setIsSleepTimerOpen,
    setIsVisualizerOpen,
    setActiveTab,
    clearQueue,
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [ytmResults, setYtmResults] = useState([]);
  const [isYtmLoading, setIsYtmLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      setYtmResults([]);
    }
  }, [isCommandPaletteOpen]);

  // Debounced search on YouTube Music
  const searchYtmLive = useCallback(async (text) => {
    if (!text.trim()) {
      setYtmResults([]);
      return;
    }
    setIsYtmLoading(true);
    try {
      const searchFn = api.searchYTM || api.searchYtm;
      if (typeof searchFn === 'function') {
        const res = await searchFn.call(api, text.trim(), 8);
        setYtmResults(res || []);
      }
    } catch {
      setYtmResults([]);
    } finally {
      setIsYtmLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchYtmLive(query);
      } else {
        setYtmResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, searchYtmLive]);

  const actions = useMemo(() => [
    {
      id: 'act-search-page',
      title: query ? `Search for "${query}" on Tunely` : 'Open Search Page',
      category: 'Search',
      icon: Search,
      run: () => setActiveTab('search'),
    },
    {
      id: 'act-vis',
      title: 'Open Studio Visualizer & Lyrics',
      category: 'Audio Experience',
      icon: Maximize2,
      run: () => setIsVisualizerOpen(true),
    },
    {
      id: 'act-eq',
      title: 'Open 10-Band Graphic Equalizer',
      category: 'Audio Experience',
      icon: Sliders,
      run: () => setIsEqualizerOpen(true),
    },
    {
      id: 'act-slow',
      title: 'Toggle Slowed + Reverb Audio DSP',
      category: 'Audio Effects',
      icon: Sparkles,
      run: () => toggleSlowedReverb(),
    },
    {
      id: 'act-night',
      title: 'Toggle Nightcore Speed Pitch',
      category: 'Audio Effects',
      icon: Zap,
      run: () => toggleNightcore(),
    },
    {
      id: 'act-sleep',
      title: 'Set Sleep Timer',
      category: 'Playback Tools',
      icon: Moon,
      run: () => setIsSleepTimerOpen(true),
    },
    {
      id: 'act-home',
      title: 'Navigate to Explore Music (Home)',
      category: 'Navigation',
      icon: Home,
      run: () => setActiveTab('home'),
    },
    {
      id: 'act-library',
      title: 'Navigate to Your Library',
      category: 'Navigation',
      icon: LayoutGrid,
      run: () => setActiveTab('library'),
    },
    {
      id: 'act-settings',
      title: 'Open Settings & Preferences',
      category: 'Navigation',
      icon: Settings,
      run: () => setActiveTab('settings'),
    },
    {
      id: 'act-profile',
      title: 'Open Profile & Account',
      category: 'Navigation',
      icon: User,
      run: () => setActiveTab('profile'),
    },
    {
      id: 'act-clear-q',
      title: 'Clear Current Next Queue',
      category: 'Queue Management',
      icon: Trash2,
      run: () => clearQueue(),
    },
  ], [query, setActiveTab, setIsVisualizerOpen, setIsEqualizerOpen, toggleSlowedReverb, toggleNightcore, setIsSleepTimerOpen, clearQueue]);

  // User library tracks match (Liked songs & recent history)
  const filteredLibraryTracks = useMemo(() => {
    if (!query.trim()) return [];
    const pool = [...(likedTracks || []), ...(history || [])];
    const seen = new Set();
    const matches = [];

    pool.forEach((t) => {
      if (!t) return;
      const key = t.videoId || t.id;
      if (seen.has(key)) return;
      seen.add(key);

      const titleMatch = t.title?.toLowerCase().includes(query.toLowerCase());
      const artistMatch = (t.artist_name || t.artist || '').toLowerCase().includes(query.toLowerCase());
      if (titleMatch || artistMatch) {
        matches.push({
          id: `lib-${key}`,
          title: t.title,
          subtitle: `${t.artist_name || t.artist} • Your Library`,
          category: 'Library',
          icon: Play,
          cover: t.cover_url || t.cover,
          track: t,
          run: () => playTrack(t),
        });
      }
    });
    return matches.slice(0, 5);
  }, [query, likedTracks, history, playTrack]);

  // YouTube Music search results formatted
  const formattedYtmTracks = useMemo(() => {
    return (ytmResults || []).map((t) => ({
      id: `ytm-${t.id || t.videoId}`,
      title: t.title,
      subtitle: `${t.artist_name || t.artist} • ${t.duration || 'Song'}`,
      category: 'Tunely',
      icon: Radio,
      cover: t.cover_url || t.cover,
      track: t,
      run: () => playTrack(t),
    }));
  }, [ytmResults, playTrack]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    return actions.filter((a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, actions]);

  const allItems = useMemo(() => {
    if (!query.trim()) {
      return actions;
    }
    return [...formattedYtmTracks, ...filteredLibraryTracks, ...filteredActions];
  }, [query, formattedYtmTracks, filteredLibraryTracks, filteredActions, actions]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault();
      allItems[selectedIndex].run();
      setIsCommandPaletteOpen(false);
    } else if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/80 backdrop-blur-md animate-fade-in text-white"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{ background: 'rgba(16, 18, 24, 0.98)', backdropFilter: 'blur(30px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search size={18} className="text-white/70 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search Tunely, songs, artists, or audio effects..."
            className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
          />
          {isYtmLoading && (
            <span className="text-[10px] text-white/50 animate-pulse font-mono shrink-0">
              Searching...
            </span>
          )}
          <span className="text-[10px] font-mono text-white/50 bg-white/10 px-2 py-0.5 rounded shrink-0">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-xs">
              No matching songs or commands found for &quot;{query}&quot;.
            </div>
          ) : (
            allItems.map((item, idx) => {
              const ItemIcon = item.icon;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    setIsCommandPaletteOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected ? 'bg-white/15 text-white shadow-md' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.cover ? (
                      <img
                        src={item.cover}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="w-8 h-8 rounded-lg object-cover shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        <ItemIcon size={14} />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[10px] text-white/40 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase text-white/40 shrink-0 ml-2 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-3">
            <span>↑ ↓ to navigate</span>
            <span>↵ to select & play</span>
          </div>
          <button
            onClick={() => {
              setActiveTab('search');
              setIsCommandPaletteOpen(false);
            }}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <span>Open Full Search</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
