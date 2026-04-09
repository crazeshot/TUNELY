/**
 * MainContent.jsx
 * Centre scrollable area:
 *  - SearchBar (full-width pill at top)
 *  - "Recommended" section with 4-column portrait card grid
 *  - "Recently Played" section with 4-column portrait card grid
 *  - BottomNav floating pill pinned to bottom
 *
 * Cards use 3:4 aspect ratio to match the screenshot's tall card style.
 */
import { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import AlbumCard from './AlbumCard';
import BottomNav from './BottomNav';
import { recommended, recentlyPlayed } from '../data/musicData';

export default function MainContent() {
  const [query, setQuery] = useState('');
  const [tab, setTab]     = useState('home');

  const filter = (arr) => {
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  };

  const recList    = useMemo(() => filter(recommended),    [query]);
  const recentList = useMemo(() => filter(recentlyPlayed), [query]);

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-3 space-y-6">

        {/* Search */}
        <SearchBar onSearch={setQuery} />

        {/* Recommended */}
        {recList.length > 0 && (
          <section>
            <SectionTitle>Recommended</SectionTitle>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {recList.map((t, i) => <AlbumCard key={t.id} track={t} delay={i * 60} />)}
            </div>
          </section>
        )}

        {/* Recently Played */}
        {recentList.length > 0 && (
          <section>
            <SectionTitle>Recently Played</SectionTitle>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {recentList.map((t, i) => <AlbumCard key={t.id} track={t} delay={i * 60 + 240} />)}
            </div>
          </section>
        )}

        {/* Empty state */}
        {recList.length === 0 && recentList.length === 0 && (
          <div className="flex flex-col items-center justify-center h-52 text-white/25">
            <span className="text-5xl mb-3">♪</span>
            <p className="text-sm">No results for "{query}"</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="py-3">
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </main>
  );
}

function SectionTitle({ children }) {
  return (
    <h2
      className="text-white font-bold text-xl"
      style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.3px' }}
    >
      {children}
    </h2>
  );
}
