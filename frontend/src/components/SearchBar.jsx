import { Sparkles, X } from 'lucide-react';

export default function SearchBar({ value, onChange, onClear, placeholder = 'Search songs, artists, moods...' }) {
  return (
    <div className="relative w-full">
      <Sparkles
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onClear?.()}
        placeholder={placeholder}
        className="
          w-full pl-11 pr-10 py-3.5
          rounded-2xl
          text-sm text-white placeholder-white/40
          outline-none
          transition-all duration-300
          border border-white/10
          focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20
          shadow-lg
        "
        style={{
          background: 'rgba(255, 255, 255, 0.07)',
          backdropFilter: 'blur(16px)',
        }}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
