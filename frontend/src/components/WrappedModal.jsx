import { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, Flame, Disc, Share2, Play } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { usePlayer } from '../context/usePlayer';
import { api } from '../services/api';

export default function WrappedModal() {
  const { isWrappedOpen, setIsWrappedOpen } = useAuth();
  const { playTrack, showToast } = usePlayer();
  const [wrappedData, setWrappedData] = useState(null);

  useEffect(() => {
    if (isWrappedOpen) {
      api.getWrapped().then((data) => {
        if (data) setWrappedData(data);
      });
    }
  }, [isWrappedOpen]);

  if (!isWrappedOpen || !wrappedData) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in text-white"
      onClick={() => setIsWrappedOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, #2b0938 0%, #150624 50%, #080314 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-pink-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-pink-400">
                Annual Retrospective
              </span>
              <h2 className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
                Your Tunely Wrapped 2026
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsWrappedOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
          {/* Top Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Minutes Streamed</span>
              <p className="text-2xl font-extrabold text-pink-300 font-mono">
                {wrappedData.total_minutes_streamed?.toLocaleString() || '4,820'}
              </p>
              <span className="text-[10px] text-white/40">Top 5% of listeners</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Listening Streak</span>
              <div className="flex items-center gap-1.5">
                <Flame size={18} className="text-amber-400 fill-amber-400" />
                <p className="text-2xl font-extrabold text-amber-300 font-mono">
                  {wrappedData.listening_streak_days || 42} days
                </p>
              </div>
              <span className="text-[10px] text-white/40">Daily active streak</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/50 block mb-1">Sonic Archetype</span>
              <p className="text-sm font-bold text-purple-300">
                {wrappedData.music_personality?.title || 'Atmospheric Voyager'}
              </p>
              <span className="text-[10px] text-white/40">Audiophile rating: S+</span>
            </div>
          </div>

          {/* Personality Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-black/40 border border-white/15">
            <div className="flex items-center gap-2 text-xs uppercase font-bold text-pink-400 mb-1">
              <Sparkles size={14} />
              <span>Music Personality</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              {wrappedData.music_personality?.title}
            </h3>
            <p className="text-xs text-white/75 leading-relaxed font-light">
              {wrappedData.music_personality?.desc}
            </p>
          </div>

          {/* Top 5 Tracks */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-white/50 mb-3">
              Your Top Tracks of the Year
            </h4>
            <div className="space-y-2">
              {(wrappedData.top_tracks || []).slice(0, 5).map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => {
                    playTrack(t);
                    setIsWrappedOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-pink-400 w-4 text-center">
                      #{idx + 1}
                    </span>
                    <img
                      src={t.cover_url || t.cover}
                      alt={t.title}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">{t.title}</p>
                      <p className="text-[11px] text-white/50 truncate">{t.artist_name || t.artist}</p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-pink-500 flex items-center justify-center transition-all">
                    <Play size={12} className="fill-white ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Share Action */}
        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between z-10">
          <span className="text-xs text-white/40">Tunely Audio 2026</span>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                showToast('Wrapped card link copied to clipboard!');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            <Share2 size={13} />
            <span>Share My Wrapped</span>
          </button>
        </div>
      </div>
    </div>
  );
}
