import { X, Sliders, RotateCcw } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../services/audioEngine';

export default function EqualizerModal() {
  const {
    isEqualizerOpen,
    setIsEqualizerOpen,
    eqPreset,
    eqBands,
    setEqualizerPreset,
    setEqualizerBand,
  } = usePlayer();

  if (!isEqualizerOpen) return null;

  const presets = Object.keys(EQ_PRESETS);

  const formatFreq = (freq) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in text-white"
      onClick={() => setIsEqualizerOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(28, 12, 40, 0.96) 0%, rgba(12, 6, 22, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sliders size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                10-Band Graphic Equalizer
              </h2>
              <p className="text-xs text-white/50">Audiophile Web Audio DSP tuning</p>
            </div>
          </div>

          <button
            onClick={() => setIsEqualizerOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Presets pill list */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Presets</span>
            <button
              onClick={() => setEqualizerPreset('Flat')}
              className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset to Flat</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setEqualizerPreset(p)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  eqPreset === p
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Slider Grid */}
        <div className="grid grid-cols-10 gap-2 sm:gap-4 py-6 bg-white/[0.02] border border-white/10 rounded-2xl px-3 sm:px-6">
          {EQ_FREQUENCIES.map((freq, i) => {
            const gain = eqBands[i] || 0;
            return (
              <div key={freq} className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-mono text-pink-300/80">
                  {gain > 0 ? `+${gain}` : `${gain}`}
                </span>

                {/* Vertical Range Slider */}
                <div className="h-36 flex items-center justify-center">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    onChange={(e) => setEqualizerBand(i, Number(e.target.value))}
                    className="w-32 h-1 cursor-pointer -rotate-90 origin-center"
                  />
                </div>

                <span className="text-[10px] font-mono text-white/40">
                  {formatFreq(freq)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Decibel scale info */}
        <div className="pt-4 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <span>-12 dB (Cut)</span>
          <span>0 dB (Unity)</span>
          <span>+12 dB (Boost)</span>
        </div>
      </div>
    </div>
  );
}
