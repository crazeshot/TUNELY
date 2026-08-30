import { X, Moon, Clock } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';

export default function SleepTimerModal() {
  const {
    isSleepTimerOpen,
    setIsSleepTimerOpen,
    sleepTimerSeconds,
    setSleepTimer,
    duration,
    currentTime,
  } = usePlayer();

  if (!isSleepTimerOpen) return null;

  const remainingMinutes = sleepTimerSeconds ? Math.ceil(sleepTimerSeconds / 60) : null;
  const remainingInTrack = Math.max(1, Math.ceil((duration - currentTime) / 60));

  const options = [
    { label: '15 Minutes', minutes: 15 },
    { label: '30 Minutes', minutes: 30 },
    { label: '45 Minutes', minutes: 45 },
    { label: '1 Hour', minutes: 60 },
    { label: 'End of Current Song', minutes: remainingInTrack },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white"
      onClick={() => setIsSleepTimerOpen(false)}
    >
      <div
        className="relative w-full max-w-sm p-6 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'rgba(20, 22, 28, 0.98)',
          backdropFilter: 'blur(24px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              <Moon size={16} />
            </div>
            <h3 className="text-sm font-bold tracking-wide" style={{ fontFamily: 'Syne, sans-serif' }}>
              Sleep Timer
            </h3>
          </div>

          <button
            onClick={() => setIsSleepTimerOpen(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Current status if timer is running */}
        {remainingMinutes !== null && (
          <div className="mt-4 p-3 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white">
              <Clock size={14} />
              <span>Stops in ~{remainingMinutes}m</span>
            </div>
            <button
              onClick={() => setSleepTimer(0)}
              className="text-xs text-white/70 hover:text-red-400 font-semibold transition-colors"
            >
              Turn Off
            </button>
          </div>
        )}

        <div className="space-y-2 mt-4">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSleepTimer(opt.minutes)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all text-left"
            >
              <span>{opt.label}</span>
              <span className="text-white/30 text-[10px]">▶</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
