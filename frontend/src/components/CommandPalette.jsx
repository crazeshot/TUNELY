import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import { allTracks } from '../data/musicData';

export default function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    playTrack,
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
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCommandPaletteOpen]);

  const actions = [
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
      id: 'act-slowed',
      title: 'Toggle Slowed + Reverb Mode',
      category: 'Audio Mode',
      icon: Sparkles,
      run: () => toggleSlowedReverb(),
    },
    {
      id: 'act-nightcore',
      title: 'Toggle Nightcore High-Energy Mode',
      category: 'Audio Mode',
      icon: Zap,
      run: () => toggleNightcore(),
    },
    {
      id: 'act-sleep',
      title: 'Set Sleep Timer',
      category: 'Utility',
      icon: Moon,
      run: () => setIsSleepTimerOpen(true),
    },
    {
      id: 'act-home',
      title: 'Go to Explore / Home',
      category: 'Navigation',
      icon: Home,
      run: () => setActiveTab('home'),
    },
    {
      id: 'act-lib',
      title: 'Go to Your Library',
      category: 'Navigation',
      icon: LayoutGrid,
      run: () => setActiveTab('library'),
    },
    {
      id: 'act-clear-q',
      title: 'Clear Now Playing Queue',
      category: 'Queue',
      icon: Trash2,
      run: () => clearQueue(),
    },
  ];

  const filteredTracks = query.trim()
    ? allTracks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(query.toLowerCase()) ||
            (t.artist_name || t.artist).toLowerCase().includes(query.toLowerCase()) ||
            (t.genre || '').toLowerCase().includes(query.toLowerCase())
        )
        .map((t) => ({
          id: `track-${t.id}`,
          title: t.title,
          subtitle: `${t.artist_name || t.artist} • ${t.genre}`,
          category: 'Tracks',
          icon: Play,
          track: t,
          run: () => playTrack(t),
        }))
    : [];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [...filteredTracks, ...filteredActions];

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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden text-white"
        style={{ background: 'rgba(20, 10, 30, 0.95)', backdropFilter: 'blur(30px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search size={18} className="text-pink-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a song, artist, command, or mode... (Esc to exit)"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
          />
          <span className="text-[10px] font-mono text-white/30 bg-white/10 px-2 py-0.5 rounded">
            ESC
          </span>
        </div>

        {/* Results list */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-white/30 text-xs">
              No matching commands or songs found.
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
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-pink-500/30 text-pink-300' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      <ItemIcon size={14} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[10px] text-white/40 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-white/30 shrink-0 ml-2">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
          <span>Navigate with ↑ ↓</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
