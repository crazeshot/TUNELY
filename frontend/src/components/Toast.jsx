import { usePlayer } from '../context/usePlayer';
import { CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toastMessage } = usePlayer();

  if (!toastMessage) return null;

  return (
    <div key={toastMessage} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl text-xs font-medium text-white border border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(224, 82, 154, 0.9), rgba(138, 61, 136, 0.9))',
        }}
      >
        <CheckCircle2 size={14} className="text-white shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
