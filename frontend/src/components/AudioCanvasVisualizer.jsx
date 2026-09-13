import { useEffect, useRef, useMemo } from 'react';
import { usePlayer } from '../context/usePlayer';

export const VISUALIZER_THEMES = {
  silver: {
    name: 'Liquid Silver',
    accent: '#ffffff',
    secondary: '#71717a',
    glow: 'rgba(255, 255, 255, 0.45)',
    peak: '#ffffff',
    bgGlow: 'rgba(255, 255, 255, 0.08)',
  },
  cyberpunk: {
    name: 'Neon Cyberpunk',
    accent: '#06b6d4',
    secondary: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.6)',
    peak: '#f43f5e',
    bgGlow: 'rgba(6, 182, 212, 0.12)',
  },
  aurora: {
    name: 'Emerald Aurora',
    accent: '#10b981',
    secondary: '#06b6d4',
    glow: 'rgba(16, 185, 129, 0.6)',
    peak: '#34d399',
    bgGlow: 'rgba(16, 185, 129, 0.12)',
  },
  sunset: {
    name: 'Sunset Amber',
    accent: '#f59e0b',
    secondary: '#ef4444',
    glow: 'rgba(245, 158, 11, 0.6)',
    peak: '#fbbf24',
    bgGlow: 'rgba(239, 68, 68, 0.12)',
  },
  midnight: {
    name: 'Midnight Electric',
    accent: '#6366f1',
    secondary: '#8b5cf6',
    glow: 'rgba(99, 102, 241, 0.6)',
    peak: '#a78bfa',
    bgGlow: 'rgba(99, 102, 241, 0.12)',
  },
};

// ── PSYCHOACOUSTIC LOGARITHMIC FREQUENCY SAMPLING ─────────────────────────────
// Maps bar indices across the human hearing range (24Hz to 16.5kHz) with
// perceptual tilt compensation, eliminating the dead-tail flat line on treble.
function getLogFrequency(index, totalBars, minFreq = 24, maxFreq = 16500) {
  return minFreq * Math.pow(maxFreq / minFreq, index / Math.max(1, totalBars - 1));
}

function sampleLogEnergy(spectrum, barIndex, totalBars, sampleRate = 44100) {
  const binCount = spectrum.length;
  if (!binCount) return 0;
  const nyquist = sampleRate / 2;
  const fLow = getLogFrequency(barIndex, totalBars);
  const fHigh = getLogFrequency(barIndex + 1, totalBars);

  const binLow = (fLow / nyquist) * binCount;
  const binHigh = (fHigh / nyquist) * binCount;

  let energy = 0;
  if (binHigh - binLow < 1.0) {
    // Low bass frequencies where 1 bin covers multiple bars: interpolate smoothly
    const idx0 = Math.max(0, Math.min(binCount - 1, Math.floor(binLow)));
    const idx1 = Math.max(0, Math.min(binCount - 1, idx0 + 1));
    const frac = binLow - idx0;
    energy = (spectrum[idx0] || 0) * (1 - frac) + (spectrum[idx1] || 0) * frac;
  } else {
    // Mid to treble frequencies where each bar spans multiple bins:
    // Blend band average (for warmth & body) with band peak (for crisp snare & hi-hat transients)
    let sum = 0;
    let count = 0;
    let peak = 0;
    const startBin = Math.max(0, Math.floor(binLow));
    const endBin = Math.min(binCount - 1, Math.ceil(binHigh));
    for (let b = startBin; b <= endBin; b++) {
      const v = spectrum[b] || 0;
      sum += v;
      if (v > peak) peak = v;
      count++;
    }
    energy = count > 0 ? (sum / count) * 0.4 + peak * 0.6 : 0;
  }

  // Perceptual Equal-Loudness Treble Compensation:
  // Music naturally exhibits pink-noise slope (~ -3dB to -4.5dB/octave).
  // Applying an octave-scaled compensation ensures upper frequencies dance with the same energy as bass.
  const normIndex = barIndex / Math.max(1, totalBars - 1);
  const tilt = 0.85 + Math.pow(normIndex, 0.5) * 1.6;
  return Math.min(255, energy * tilt);
}

export default function AudioCanvasVisualizer({
  mode = 'bars', // 'bars' | 'wave' | 'radial' | 'particles' | 'vu-meter' | 'matrix'
  height = 120,
  barCount = 48,
  theme = 'silver',
  accentColor,
  secondaryColor,
  interactive = false,
  showPeaks = true,
  showReflection = true,
}) {
  const { isPlaying, getFrequencyData, visualizerTheme } = usePlayer();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Smooth temporal state
  const smoothedBarsRef = useRef(new Float32Array(barCount));
  const peaksRef = useRef(new Float32Array(barCount));
  const peakHoldRef = useRef(new Int32Array(barCount));
  const peakSpeedRef = useRef(new Float32Array(barCount));

  // VU meter physics state (needle positions and velocities)
  const vuStateRef = useRef({
    leftPos: 0,
    leftVel: 0,
    rightPos: 0,
    rightVel: 0,
  });

  // Particles state
  const particlesRef = useRef([]);
  const rotationRef = useRef(0);
  const waveTimeRef = useRef(0);

  const activeTheme = useMemo(() => {
    const key = visualizerTheme || theme || 'silver';
    const base = VISUALIZER_THEMES[key] || VISUALIZER_THEMES.silver;
    return {
      ...base,
      accent: accentColor || base.accent,
      secondary: secondaryColor || base.secondary,
    };
  }, [visualizerTheme, theme, accentColor, secondaryColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles for 'particles' mode
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 65 }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0025,
        vy: (Math.random() - 0.5) * 0.0025,
        size: Math.random() * 2.5 + 1.2,
        baseSize: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      }));
    }

    let isCancelled = false;

    const render = () => {
      if (isCancelled) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || canvas.parentElement?.clientWidth || 400;
      const h = height || rect.height || 120;

      // Ensure crisp high-DPI scaling
      const targetCanvasW = Math.round(width * dpr);
      const targetCanvasH = Math.round(h * dpr);
      if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
        canvas.width = targetCanvasW;
        canvas.height = targetCanvasH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      const freq = getFrequencyData ? getFrequencyData() : {
        spectrum: new Uint8Array(512),
        timeDomain: new Uint8Array(512),
        bass: 0,
        mid: 0,
        treble: 0,
        average: 0,
        sampleRate: 44100,
      };

      const spectrum = freq.spectrum || new Uint8Array(512);
      const timeDomain = freq.timeDomain || new Uint8Array(512);
      const sampleRate = freq.sampleRate || 44100;
      const bassEnergy = (freq.bass || 0) / 255;
      const now = Date.now();
      waveTimeRef.current += 0.03;

      // Ensure state arrays match bar count
      if (smoothedBarsRef.current.length !== barCount) {
        smoothedBarsRef.current = new Float32Array(barCount);
        peaksRef.current = new Float32Array(barCount);
        peakHoldRef.current = new Int32Array(barCount);
        peakSpeedRef.current = new Float32Array(barCount);
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 1: STUDIO SPECTRUM (LOGARITHMIC BARS & GRAVITY PEAKS)
      // ─────────────────────────────────────────────────────────────
      if (mode === 'bars') {
        const totalBarSpace = width / barCount;
        const barWidth = Math.max(2, totalBarSpace * 0.70);
        const gap = totalBarSpace * 0.30;
        const availableHeight = showReflection ? h * 0.70 : h * 0.90;
        const baseline = availableHeight;

        for (let i = 0; i < barCount; i++) {
          let targetEnergy = 0;
          if (isPlaying) {
            targetEnergy = sampleLogEnergy(spectrum, i, barCount, sampleRate);
          } else {
            // Idle organic breathing wave
            targetEnergy = (Math.sin(now * 0.003 + i * 0.25) * 0.5 + 0.5) * 28 + 8;
          }

          const targetHeight = Math.max(3, (targetEnergy / 255) * availableHeight);

          // ── DUAL-RATE EXPONENTIAL TEMPORAL SMOOTHING ──
          // Fast attack (0.42) for punchy transient responsiveness
          // Silky decay (0.16) for liquid, stutter-free bar motion
          const currentH = smoothedBarsRef.current[i];
          if (targetHeight > currentH) {
            smoothedBarsRef.current[i] = currentH + (targetHeight - currentH) * 0.42;
          } else {
            smoothedBarsRef.current[i] = currentH + (targetHeight - currentH) * 0.16;
          }

          const finalBarH = smoothedBarsRef.current[i];

          // ── PHYSICAL PEAK HOLD & GRAVITY FALLOFF ──
          if (finalBarH >= peaksRef.current[i]) {
            peaksRef.current[i] = finalBarH;
            peakHoldRef.current[i] = 12; // Hold 12 frames
            peakSpeedRef.current[i] = 0;
          } else {
            if (peakHoldRef.current[i] > 0) {
              peakHoldRef.current[i]--;
            } else {
              peakSpeedRef.current[i] += 0.20; // Gravity acceleration
              peaksRef.current[i] = Math.max(3, peaksRef.current[i] - peakSpeedRef.current[i]);
            }
          }

          const x = i * (barWidth + gap) + gap / 2;
          const y = baseline - finalBarH;

          // Main vertical gradient bar
          const grad = ctx.createLinearGradient(0, y, 0, baseline);
          grad.addColorStop(0, activeTheme.accent);
          grad.addColorStop(0.7, activeTheme.secondary);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, finalBarH, [3, 3, 0, 0]);
          ctx.fill();

          // Floating Peak Cap
          if (showPeaks) {
            const peakY = Math.max(0, baseline - peaksRef.current[i] - 3);
            ctx.fillStyle = activeTheme.peak;
            ctx.shadowColor = activeTheme.glow;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.roundRect(x, peakY, barWidth, 2, [1, 1, 1, 1]);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Mirror glass reflection underneath baseline
          if (showReflection) {
            const reflectionHeight = finalBarH * 0.38;
            const refGrad = ctx.createLinearGradient(0, baseline, 0, baseline + reflectionHeight);
            refGrad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
            refGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = refGrad;
            ctx.beginPath();
            ctx.roundRect(x, baseline + 2, barWidth, reflectionHeight, [0, 0, 2, 2]);
            ctx.fill();
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 2: HARMONIC OSCILLOSCOPE (BUTTERY TIME-DOMAIN WAVES)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'wave') {
        const midY = h * 0.5;
        const amplitude = h * 0.44;
        const numPoints = 64;
        const slice = width / (numPoints - 1);
        const tdLen = timeDomain.length || 512;
        const tdStep = Math.max(1, Math.floor(tdLen / numPoints));

        // Layer 1: Ambient soft luminous under-fill
        ctx.beginPath();
        ctx.moveTo(0, midY);
        for (let i = 0; i < numPoints; i++) {
          const byteVal = isPlaying
            ? timeDomain[i * tdStep] ?? 128
            : 128 + Math.sin(waveTimeRef.current + i * 0.2) * 20;
          const norm = (byteVal - 128) / 128;
          const y = midY + norm * amplitude * 0.75;
          const x = i * slice;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevByte = isPlaying
              ? timeDomain[(i - 1) * tdStep] ?? 128
              : 128 + Math.sin(waveTimeRef.current + (i - 1) * 0.2) * 20;
            const prevNorm = (prevByte - 128) / 128;
            const prevY = midY + prevNorm * amplitude * 0.75;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, x, y);
          }
        }
        ctx.lineTo(width, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const waveFill = ctx.createLinearGradient(0, 0, 0, h);
        waveFill.addColorStop(0, activeTheme.bgGlow);
        waveFill.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = waveFill;
        ctx.fill();

        // Layer 2: Main crisp neon oscilloscope wave
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const byteVal = isPlaying
            ? timeDomain[i * tdStep] ?? 128
            : 128 + Math.sin(waveTimeRef.current + i * 0.2) * 25;
          const norm = (byteVal - 128) / 128;
          const y = midY + norm * amplitude;
          const x = i * slice;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevByte = isPlaying
              ? timeDomain[(i - 1) * tdStep] ?? 128
              : 128 + Math.sin(waveTimeRef.current + (i - 1) * 0.2) * 25;
            const prevNorm = (prevByte - 128) / 128;
            const prevY = midY + prevNorm * amplitude;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, x, y);
          }
        }

        ctx.strokeStyle = activeTheme.accent;
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.shadowColor = activeTheme.glow;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Layer 3: Secondary subtle harmonic shimmer wave
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const byteVal = isPlaying
            ? timeDomain[Math.min(tdLen - 1, i * tdStep + 8)] ?? 128
            : 128 + Math.cos(waveTimeRef.current * 1.5 + i * 0.3) * 15;
          const norm = (byteVal - 128) / 128;
          const y = midY - norm * amplitude * 0.45;
          const x = i * slice;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevByte = isPlaying
              ? timeDomain[Math.min(tdLen - 1, (i - 1) * tdStep + 8)] ?? 128
              : 128 + Math.cos(waveTimeRef.current * 1.5 + (i - 1) * 0.3) * 15;
            const prevNorm = (prevByte - 128) / 128;
            const prevY = midY - prevNorm * amplitude * 0.45;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, x, y);
          }
        }
        ctx.strokeStyle = activeTheme.secondary;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 3: AUDIO HALO (360° CIRCULAR RADIAL PULSE)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'radial') {
        const cx = width / 2;
        const cy = h / 2;
        const minDim = Math.min(width, h);
        const innerRadius = Math.max(26, minDim * 0.22 * (1 + bassEnergy * 0.18));
        const maxBarHeight = minDim * 0.27;
        const rays = 64;

        rotationRef.current += isPlaying ? 0.003 : 0.001;

        // Central Pulsing Glow Core
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius * 1.6);
        coreGlow.addColorStop(0, activeTheme.glow);
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 360-degree radiating frequency rays with log sampling
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2 + rotationRef.current;
          const symmetricIdx = i < rays / 2 ? i : rays - 1 - (i - rays / 2);
          const energy = isPlaying
            ? sampleLogEnergy(spectrum, symmetricIdx, Math.floor(rays / 2), sampleRate)
            : (Math.sin(now * 0.004 + i * 0.3) * 0.5 + 0.5) * 30 + 10;

          const rayLen = Math.max(4, (energy / 255) * maxBarHeight);

          const x1 = cx + Math.cos(angle) * innerRadius;
          const y1 = cy + Math.sin(angle) * innerRadius;
          const x2 = cx + Math.cos(angle) * (innerRadius + rayLen);
          const y2 = cy + Math.sin(angle) * (innerRadius + rayLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? activeTheme.accent : activeTheme.secondary;
          ctx.lineWidth = Math.max(1.8, (Math.PI * 2 * innerRadius) / rays * 0.65);
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Inner luminous ring
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = activeTheme.accent;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = activeTheme.glow;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 4: QUANTUM PARTICLES (COSMIC STARFIELD)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'particles') {
        const particles = particlesRef.current;
        const speedMultiplier = isPlaying ? 1 + bassEnergy * 3.2 : 0.6;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          // Wrap edges smoothly
          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
          if (p.y < 0) p.y = 1;
          if (p.y > 1) p.y = 0;

          const px = p.x * width;
          const py = p.y * h;
          const size = p.baseSize * (1 + bassEnergy * 1.6);

          // Draw Star
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = i % 3 === 0 ? activeTheme.accent : activeTheme.secondary;
          ctx.shadowColor = activeTheme.glow;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Connect neighboring particles with translucent constellation filaments
          for (let j = i + 1; j < Math.min(particles.length, i + 7); j++) {
            const p2 = particles[j];
            const p2x = p2.x * width;
            const p2y = p2.y * h;
            const dist = Math.hypot(p2x - px, p2y - py);
            if (dist < 70) {
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(p2x, p2y);
              ctx.strokeStyle = activeTheme.accent;
              ctx.globalAlpha = (1 - dist / 70) * 0.28;
              ctx.lineWidth = 0.85;
              ctx.stroke();
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 5: VINTAGE ANALOGUE VU METERS (BALLISTIC NEEDLE PHYSICS)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'vu-meter') {
        const meterW = Math.min(230, (width - 32) / 2);
        const meterH = Math.min(115, h * 0.88);
        const startY = (h - meterH) / 2;

        const drawSingleVUMeter = (x, y, label, channelPos) => {
          // Outer meter casing
          ctx.fillStyle = '#12141a';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, y, meterW, meterH, 12);
          ctx.fill();
          ctx.stroke();

          // Dial face background
          const dialGrad = ctx.createLinearGradient(x, y, x, y + meterH);
          dialGrad.addColorStop(0, '#1c1f28');
          dialGrad.addColorStop(1, '#0e1015');
          ctx.fillStyle = dialGrad;
          ctx.beginPath();
          ctx.roundRect(x + 4, y + 4, meterW - 8, meterH - 8, 8);
          ctx.fill();

          // Arc scale
          const pivotX = x + meterW / 2;
          const pivotY = y + meterH * 0.88;
          const needleLen = meterH * 0.72;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, needleLen, -Math.PI * 0.75, -Math.PI * 0.25);
          ctx.stroke();

          // Scale Ticks (-20dB to +3dB)
          for (let deg = -135; deg <= -45; deg += 18) {
            const rad = (deg * Math.PI) / 180;
            const x1 = pivotX + Math.cos(rad) * (needleLen - 6);
            const y1 = pivotY + Math.sin(rad) * (needleLen - 6);
            const x2 = pivotX + Math.cos(rad) * needleLen;
            const y2 = pivotY + Math.sin(rad) * needleLen;

            ctx.strokeStyle = deg > -65 ? '#ef4444' : 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = deg > -65 ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }

          // Needle deflection with mechanical inertia
          const angle = -Math.PI * 0.75 + (channelPos / 255) * (Math.PI * 0.5);
          const needleX = pivotX + Math.cos(angle) * needleLen;
          const needleY = pivotY + Math.sin(angle) * needleLen;

          // Needle shadow
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pivotX + 2, pivotY + 2);
          ctx.lineTo(needleX + 2, needleY + 2);
          ctx.stroke();

          // Needle body
          ctx.strokeStyle = channelPos > 215 ? '#ef4444' : activeTheme.accent;
          ctx.shadowColor = activeTheme.glow;
          ctx.shadowBlur = 6;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(needleX, needleY);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Pivot cap
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Channel Label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, pivotX, y + meterH * 0.95);
        };

        // Mechanical 2nd-order ballistic needle damping:
        // Standard VU meter has ~300ms rise time with 1% overshoot
        const leftTarget = isPlaying ? (freq.bass * 0.7 + freq.average * 0.3) : 15;
        const rightTarget = isPlaying ? (freq.mid * 0.6 + freq.treble * 0.4) : 15;

        const vs = vuStateRef.current;
        vs.leftVel += (leftTarget - vs.leftPos) * 0.16 - vs.leftVel * 0.22;
        vs.leftPos = Math.max(0, Math.min(255, vs.leftPos + vs.leftVel));

        vs.rightVel += (rightTarget - vs.rightPos) * 0.16 - vs.rightVel * 0.22;
        vs.rightPos = Math.max(0, Math.min(255, vs.rightPos + vs.rightVel));

        const leftX = width / 2 - meterW - 8;
        const rightX = width / 2 + 8;

        drawSingleVUMeter(leftX, startY, 'CH-1 (LEFT)', vs.leftPos);
        drawSingleVUMeter(rightX, startY, 'CH-2 (RIGHT)', vs.rightPos);
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 6: CYBER LED BAR MATRIX
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'matrix') {
        const cols = Math.min(32, barCount);
        const rows = 16;
        const colWidth = (width / cols) * 0.76;
        const colGap = (width / cols) * 0.24;
        const cellHeight = (h / rows) * 0.72;
        const cellGap = (h / rows) * 0.28;

        for (let c = 0; c < cols; c++) {
          const energy = isPlaying
            ? sampleLogEnergy(spectrum, c, cols, sampleRate)
            : (Math.sin(now * 0.003 + c * 0.3) * 0.5 + 0.5) * 35 + 10;

          const activeRows = Math.floor((energy / 255) * rows);
          const x = c * (colWidth + colGap);

          for (let r = 0; r < rows; r++) {
            const y = h - (r + 1) * (cellHeight + cellGap);
            const isLit = r < activeRows;

            if (isLit) {
              if (r >= rows - 2) ctx.fillStyle = '#ef4444'; // Red peak overload
              else if (r >= rows - 5) ctx.fillStyle = '#f59e0b'; // Amber warn
              else ctx.fillStyle = activeTheme.accent;
              ctx.shadowColor = activeTheme.glow;
              ctx.shadowBlur = 4;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
              ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(x, y, colWidth, cellHeight, 1.5);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, height, barCount, isPlaying, activeTheme, showPeaks, showReflection, getFrequencyData]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none transition-opacity duration-300"
      style={{ height: `${height}px` }}
    />
  );
}
