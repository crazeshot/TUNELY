import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  Power,
  Volume2,
  Sparkles,
  Headphones,
  Zap,
  Check,
  Flame,
  Info,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import {
  EQ_FREQUENCIES,
  EQ_BAND_INFO,
  EQ_PRESETS,
  EQ_PRESET_CATEGORIES,
} from '../services/audioEngine';

export default function EqualizerModal() {
  const {
    isEqualizerOpen,
    setIsEqualizerOpen,
    eqPreset,
    eqBands,
    setEqualizerPreset,
    setEqualizerBand,
    isEqBypassed,
    toggleEqBypass,
    preampGain,
    setPreampGain,
    isSpatialAudio,
    toggleSpatialAudio,
    isSlowedReverb,
    toggleSlowedReverb,
    isNightcore,
    toggleNightcore,
    getFrequencyData,
    getEqualizerResponseCurve,
  } = usePlayer();

  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredBand, setHoveredBand] = useState(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const categories = Object.keys(EQ_PRESET_CATEGORIES);
  const currentCategoryPresets = EQ_PRESET_CATEGORIES[activeCategory] || EQ_PRESET_CATEGORIES.All;

  // Real-time Frequency Response Curve + FFT Spectrum Canvas
  useEffect(() => {
    if (!isEqualizerOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isCancelled = false;

    const drawCurve = () => {
      if (isCancelled) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 600;
      const height = rect.height || 110;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const midY = height / 2; // 0 dB line
      const dbScale = (height * 0.42) / 12; // pixels per dB (max ±12dB)

      // 1. Draw Grid Lines (+12dB, +6dB, 0dB, -6dB, -12dB)
      ctx.lineWidth = 1;
      [-12, -6, 0, 6, 12].forEach((db) => {
        const y = midY - db * dbScale;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = db === 0 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)';
        ctx.setLineDash(db === 0 ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // dB axis label
        ctx.fillStyle = db === 0 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${db > 0 ? `+${db}` : db}dB`, width - 6, y + 3);
      });

      // 2. Draw Translucent Real-Time Audio FFT Spectrum Underneath
      const freq = getFrequencyData ? getFrequencyData() : { spectrum: new Uint8Array(64) };
      const spectrum = freq.spectrum || new Uint8Array(64);
      if (spectrum.length > 0) {
        const barCount = 36;
        const barW = width / barCount;
        for (let b = 0; b < barCount; b++) {
          const specIdx = Math.floor((b / barCount) * spectrum.length);
          const rawVal = spectrum[specIdx] || 0;
          const h = (rawVal / 255) * height * 0.75;
          const x = b * barW;
          const y = height - h;

          const specGrad = ctx.createLinearGradient(0, y, 0, height);
          specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
          specGrad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
          ctx.fillStyle = specGrad;
          ctx.fillRect(x + 1, y, barW - 2, h);
        }
      }

      // 3. Compute and Draw Master EQ Filter Curve
      const numPoints = 128;
      const curveData = getEqualizerResponseCurve ? getEqualizerResponseCurve(numPoints) : null;

      ctx.beginPath();
      ctx.moveTo(0, midY);

      if (curveData && curveData.dBs) {
        for (let i = 0; i < numPoints; i++) {
          const x = (i / (numPoints - 1)) * width;
          const db = Math.max(-14, Math.min(14, curveData.dBs[i]));
          const y = midY - db * dbScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        // Fallback cubic Hermite interpolation over the 10 bands
        for (let i = 0; i < EQ_FREQUENCIES.length; i++) {
          const bandGain = isEqBypassed ? 0 : (eqBands[i] || 0);
          const x = ((i + 0.5) / EQ_FREQUENCIES.length) * width;
          const y = midY - bandGain * dbScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }

      // Gradient glow area under the curve
      ctx.save();
      const fillPath = new Path2D(ctx);
      fillPath.lineTo(width, midY);
      fillPath.lineTo(0, midY);
      fillPath.closePath();
      const curveGrad = ctx.createLinearGradient(0, 0, 0, height);
      curveGrad.addColorStop(0, isEqBypassed ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.22)');
      curveGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
      ctx.fillStyle = curveGrad;
      ctx.fill(fillPath);
      ctx.restore();

      // Main Spline Stroke
      ctx.strokeStyle = isEqBypassed ? 'rgba(255, 255, 255, 0.35)' : '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (!isEqBypassed) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 10;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Interactive Band Marker Nodes
      EQ_FREQUENCIES.forEach((freq, i) => {
        const bandGain = isEqBypassed ? 0 : (eqBands[i] || 0);
        const x = ((i + 0.5) / EQ_FREQUENCIES.length) * width;
        const y = midY - bandGain * dbScale;
        const isHovered = hoveredBand === i;

        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#ffffff' : (bandGain !== 0 && !isEqBypassed ? '#38bdf8' : '#e2e8f0');
        ctx.strokeStyle = '#0a0b0f';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(drawCurve);
    };

    drawCurve();

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEqualizerOpen, eqBands, isEqBypassed, hoveredBand, getFrequencyData, getEqualizerResponseCurve]);

  if (!isEqualizerOpen) return null;

  // Macro quick controls
  const handleBassBoostMacro = (amount) => {
    setEqualizerBand(0, Math.min(12, Math.max(-12, (eqBands[0] || 0) + amount)));
    setEqualizerBand(1, Math.min(12, Math.max(-12, (eqBands[1] || 0) + amount * 0.8)));
    setEqualizerBand(2, Math.min(12, Math.max(-12, (eqBands[2] || 0) + amount * 0.5)));
  };

  const handleTrebleAirMacro = (amount) => {
    setEqualizerBand(7, Math.min(12, Math.max(-12, (eqBands[7] || 0) + amount * 0.5)));
    setEqualizerBand(8, Math.min(12, Math.max(-12, (eqBands[8] || 0) + amount * 0.8)));
    setEqualizerBand(9, Math.min(12, Math.max(-12, (eqBands[9] || 0) + amount)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl animate-fade-in text-white"
      onClick={() => setIsEqualizerOpen(false)}
    >
      <div
        className="relative w-full max-w-4xl p-5 sm:p-7 rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col gap-4 max-h-[95vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 22, 28, 0.98) 0%, rgba(10, 11, 15, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic ambient studio glow */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700"
          style={{ background: isEqBypassed ? 'rgba(255, 255, 255, 0.02)' : 'rgba(56, 189, 248, 0.08)' }}
        />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide" style={{ fontFamily: "'gg sans', sans-serif" }}>
                  Studio Graphic Equalizer
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono text-white/70 border border-white/10">
                  10-BAND DSP
                </span>
              </div>
              <p className="text-xs text-white/50">Audiophile Web Audio DSP with real-time response curve</p>
            </div>
          </div>

          {/* Bypass & Close buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEqBypass}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                isEqBypassed
                  ? 'bg-neutral-800 border-neutral-700 text-white/40 hover:text-white'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
              title="A/B Test: Toggle EQ active vs bypassed flat sound"
            >
              <Power size={12} className={isEqBypassed ? 'text-white/40' : 'text-emerald-400'} />
              <span>{isEqBypassed ? 'Bypassed' : 'Active'}</span>
            </button>

            <button
              onClick={() => setIsEqualizerOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── REAL-TIME RESPONSE CURVE CANVAS ── */}
        <div className="relative w-full h-28 sm:h-32 bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden p-2">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-2 left-3 flex items-center gap-2 text-[10px] font-mono text-white/40 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Response Spline</span>
            <span className="w-2 h-2 rounded-full bg-white/40 ml-2" />
            <span>Live FFT</span>
          </div>
        </div>

        {/* ── MASTER SECTION: PREAMP, MACROS & RESET ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
          {/* Preamp Slider */}
          <div className="flex flex-col justify-center space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60 font-medium flex items-center gap-1.5">
                <Volume2 size={13} className="text-white/40" />
                Preamp Gain
              </span>
              <span className={`font-mono text-[11px] font-bold ${preampGain > 0 ? 'text-emerald-400' : preampGain < 0 ? 'text-amber-400' : 'text-white/70'}`}>
                {preampGain > 0 ? `+${preampGain}` : preampGain} dB
              </span>
            </div>
            <input
              type="range"
              min={-12}
              max={12}
              step={0.5}
              value={preampGain}
              onChange={(e) => setPreampGain(Number(e.target.value))}
              className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Quick Macros: Bass & Treble */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleBassBoostMacro(2)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-95"
              title="Boost Sub and Low-End by 2dB"
            >
              <Flame size={13} className="text-amber-400" />
              <span>+Bass Punch</span>
            </button>
            <button
              onClick={() => handleTrebleAirMacro(2)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all active:scale-95"
              title="Boost Brilliance and Air by 2dB"
            >
              <Sparkles size={13} className="text-cyan-400" />
              <span>+Air & Sparkle</span>
            </button>
          </div>

          {/* Reset Action */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setEqualizerPreset('Flat');
                setPreampGain(0);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all"
            >
              <RotateCcw size={12} />
              <span>Reset to Flat (0 dB)</span>
            </button>
          </div>
        </div>

        {/* ── 10-BAND PRECISION STUDIO FADERS ── */}
        <div className="grid grid-cols-10 gap-1.5 sm:gap-3 py-5 px-2 sm:px-4 bg-white/[0.02] border border-white/10 rounded-2xl relative">
          {EQ_BAND_INFO.map((band, i) => {
            const gain = eqBands[i] || 0;
            const isBoost = gain > 0;
            const isCut = gain < 0;

            return (
              <div
                key={band.freq}
                className="flex flex-col items-center gap-2.5 group select-none"
                onMouseEnter={() => setHoveredBand(i)}
                onMouseLeave={() => setHoveredBand(null)}
              >
                {/* dB Readout Tag with Click-to-Reset */}
                <button
                  onClick={() => setEqualizerBand(i, 0)}
                  title="Double-click to reset band to 0dB"
                  className={`text-[10px] font-mono font-bold px-1 py-0.5 rounded transition-all ${
                    isBoost
                      ? 'text-cyan-300 bg-cyan-500/10'
                      : isCut
                      ? 'text-amber-300 bg-amber-500/10'
                      : 'text-white/40 group-hover:text-white/70'
                  }`}
                >
                  {isBoost ? `+${gain}` : `${gain}`}
                </button>

                {/* Vertical Fader Container with 0dB Center Detent Line */}
                <div className="relative h-40 flex items-center justify-center w-full">
                  {/* Center Unity Line (0dB marker) */}
                  <div className="absolute w-6 h-[1px] bg-white/20 pointer-events-none z-0" />

                  {/* Vertical Range Slider */}
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={1}
                    value={gain}
                    disabled={isEqBypassed}
                    onChange={(e) => setEqualizerBand(i, Number(e.target.value))}
                    onDoubleClick={() => setEqualizerBand(i, 0)}
                    className="w-36 h-1.5 cursor-pointer -rotate-90 origin-center accent-white disabled:opacity-40"
                  />
                </div>

                {/* Frequency & Human-friendly Name */}
                <div className="text-center">
                  <span className="block text-[11px] font-mono font-bold text-white/80 group-hover:text-white transition-colors">
                    {band.label}
                  </span>
                  <span className="block text-[8px] font-medium text-white/40 uppercase tracking-tight truncate max-w-[42px]">
                    {band.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PRESETS CHIPS & CATEGORY SELECTOR ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-white/40 font-mono hidden sm:inline">
              Active: <strong className="text-white">{eqPreset}</strong>
            </span>
          </div>

          {/* Preset Pill Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {currentCategoryPresets.map((p) => {
              const isActive = eqPreset === p;
              return (
                <button
                  key={p}
                  onClick={() => setEqualizerPreset(p)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-102'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  {isActive && <Check size={11} className="stroke-[3]" />}
                  <span>{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SOUNDSTAGE QUICK TOGGLES FOOTER ── */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpatialAudio}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isSpatialAudio
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Headphones size={12} />
              <span>3D Spatial</span>
            </button>

            <button
              onClick={toggleSlowedReverb}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isSlowedReverb
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Sparkles size={12} />
              <span>Slowed + Reverb</span>
            </button>

            <button
              onClick={toggleNightcore}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isNightcore
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <Zap size={12} />
              <span>Nightcore</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <Info size={12} />
            <span>Double click any fader to reset to 0 dB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
