/**
 * SearchBar.jsx
 * Wide pill-shaped search bar matching the screenshot.
 * Light frosted background, sparkle prefix icon.
 */
import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('');

  const handle = (e) => { setQ(e.target.value); onSearch?.(e.target.value); };
  const clear   = ()  => { setQ(''); onSearch?.(''); };

  return (
    <div className="relative w-full">
      <Sparkles size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
      <input
        type="text"
        value={q}
        onChange={handle}
        onKeyDown={e => e.key === 'Escape' && clear()}
        placeholder="Search songs, artists..."
        className="
          w-full pl-10 pr-9 py-3
          rounded-2xl
          text-sm text-white/80 placeholder-white/35
          outline-none
          transition-all duration-200
          focus:ring-1 focus:ring-white/20
        "
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
      {q && (
        <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
