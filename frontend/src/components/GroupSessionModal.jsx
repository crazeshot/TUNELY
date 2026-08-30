import { useState } from 'react';
import { X, Copy, Check, Radio, Headphones } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import { useAuth } from '../context/useAuth';

export default function GroupSessionModal() {
  const { isGroupSessionOpen, setIsGroupSessionOpen, currentTrack, isPlaying, groupSessionCode, showToast } = usePlayer();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  if (!isGroupSessionOpen) return null;

  const sessionUrl = `${window.location.origin}?session=${groupSessionCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      showToast('Group session link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      showToast(`Joined session ${joinCode.toUpperCase()}`);
      setIsGroupSessionOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white"
      onClick={() => setIsGroupSessionOpen(false)}
    >
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 24, 30, 0.98) 0%, rgba(10, 11, 15, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Radio size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide" style={{ fontFamily: "'gg sans', sans-serif" }}>
                Listen Together
              </h3>
              <p className="text-[11px] text-white/50">Real-time synchronized group playback</p>
            </div>
          </div>

          <button
            onClick={() => setIsGroupSessionOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Live Broadcast Status */}
        <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentTrack.cover_url || currentTrack.cover}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-xl object-cover"
              />
              {isPlaying && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-white/80">
                <Headphones size={11} />
                <span>Broadcasting Live</span>
              </div>
              <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-white/50 truncate">{currentTrack.artist_name || currentTrack.artist}</p>
            </div>
          </div>

          <div className="flex items-center -space-x-2">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt="Host"
              className="w-7 h-7 rounded-full border-2 border-neutral-900 object-cover"
              title={`${user.display_name || user.username} (Host)`}
            />
            <div className="w-7 h-7 rounded-full border-2 border-neutral-900 bg-white text-black flex items-center justify-center text-[10px] font-bold">
              +2
            </div>
          </div>
        </div>

        {/* Share Room Code */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-white/70">Your Session Code</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-xs font-mono font-bold tracking-widest text-white">
              {groupSessionCode}
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Invite'}</span>
            </button>
          </div>
        </div>

        {/* Join another session */}
        <form onSubmit={handleJoin} className="mt-5 pt-4 border-t border-white/10 space-y-2">
          <label className="block text-xs font-medium text-white/70">Join a Friend&apos;s Session</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. TUNELY-1042"
              className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder-white/30 outline-none uppercase focus:border-white focus:ring-1 focus:ring-white/20 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all shrink-0"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
