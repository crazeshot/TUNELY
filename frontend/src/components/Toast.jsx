import { usePlayer } from '../context/usePlayer';
import { Sparkles } from 'lucide-react';

export default function Toast() {
  const { toastMessage } = usePlayer();

  if (!toastMessage) return null;

  return (
    <div key={toastMessage} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-2xl text-xs font-semibold text-white border border-white/20"
        style={{
          background: 'rgba(22, 24, 30, 0.96)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        }}
      >
        <Sparkles size={14} className="text-white shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
