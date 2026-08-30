import { X, Check, Copy, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { usePlayer } from '../context/usePlayer';

export default function ShareModal() {
  const { shareTrackModal, setShareTrackModal, showToast } = usePlayer();
  const [copied, setCopied] = useState(false);

  if (!shareTrackModal) return null;

  const track = shareTrackModal;
  const shareUrl = `${window.location.origin}?track=${track.id}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in text-white"
      onClick={() => setShareTrackModal(null)}
    >
      <div
        className="relative w-full max-w-md p-6 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(24, 12, 34, 0.96)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-400" />
            <h3 className="text-sm font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Share Track
            </h3>
          </div>
          <button
            onClick={() => setShareTrackModal(null)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Aesthetic Share Preview Card */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-black/60 border border-white/15 flex items-center gap-4 shadow-xl">
          <img
            src={track.cover_url || track.cover}
            alt={track.title}
            className="w-16 h-16 rounded-xl object-cover shadow-lg"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-semibold text-pink-400">Tunely Audio</span>
            <p className="text-sm font-bold text-white truncate">{track.title}</p>
            <p className="text-xs text-white/60 truncate">{track.artist_name || track.artist}</p>
          </div>
        </div>

        {/* Copy Link input */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-white/70">Shareable URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white/80 select-all outline-none font-mono"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
