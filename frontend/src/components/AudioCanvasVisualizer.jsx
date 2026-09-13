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

// ── CALIBRATED MUSICAL FREQUENCY DISTRIBUTION ─────────────────────────────────
// Maps bar indices across the active musical spectrum (bins 1 to ~85) with
// power-law distribution. Guarantees every bar is active while never clipping.
function getBarEnergy(spectrum, index, totalBars) {
  if (!spectrum || spectrum.length === 0) return 0;
  const minBin = 1;
  const maxBin = Math.min(spectrum.length - 1, 85); // up to ~15 kHz
  const norm = index / Math.max(1, totalBars - 1);

  // Power scale (1.6) spreads bass, mids, and treble evenly across visual bars
  const p0 = Math.pow(norm, 1.6);
  const p1 = Math.pow((index + 1) / totalBars, 1.6);

  const b0 = Math.max(minBin, Math.floor(minBin + p0 * (maxBin - minBin)));
  const b1 = Math.min(maxBin, Math.max(b0, Math.floor(minBin + p1 * (maxBin - minBin))));

  let sum = 0;
  let count = 0;
  let max = 0;
  for (let b = b0; b <= b1; b++) {
    const val = spectrum[b] || 0;
    sum += val;
    if (val > max) max = val;
    count++;
  }

  // Blend average (70%) and peak (30%) for smooth musical movement
  const avg = count > 0 ? sum / count : 0;
  const blended = avg * 0.7 + max * 0.3;

  // Gentle acoustic treble slope (from 1.0 at bass to 1.35 at top treble)
  const trebleTilt = 1.0 + norm * 0.35;
  return Math.min(255, blended * trebleTilt);
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

  // VU meter physics state
  const vuStateRef = useRef({
    leftPos: 0,
    leftVel: 0,
    rightPos: 0,
    rightVel: 0,
  });

  // Particles & animations state
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

    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        size: Math.random() * 2 + 1,
        baseSize: Math.random() * 1.8 + 0.8,
      }));
    }

    let isCancelled = false;

    const render = () => {
      if (isCancelled) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || canvas.parentElement?.clientWidth || 400;
      const h = height || rect.height || 120;

      // High-DPI canvas sizing
      const targetW = Math.round(width * dpr);
      const targetH = Math.round(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      const freq = getFrequencyData ? getFrequencyData() : {
        spectrum: new Uint8Array(128),
        timeDomain: new Uint8Array(128),
        bass: 0,
        mid: 0,
        treble: 0,
        average: 0,
      };

      const spectrum = freq.spectrum || new Uint8Array(128);
      const timeDomain = freq.timeDomain || new Uint8Array(128);
      const bassEnergy = Math.min(1, (freq.bass || 0) / 255);
      const now = Date.now();
      waveTimeRef.current += 0.025;

      if (smoothedBarsRef.current.length !== barCount) {
        smoothedBarsRef.current = new Float32Array(barCount);
        peaksRef.current = new Float32Array(barCount);
        peakHoldRef.current = new Int32Array(barCount);
        peakSpeedRef.current = new Float32Array(barCount);
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 1: STUDIO SPECTRUM (BARS & PEAK CAPS)
      // ─────────────────────────────────────────────────────────────
      if (mode === 'bars') {
        const totalBarSpace = width / barCount;
        const barWidth = Math.max(2, totalBarSpace * 0.72);
        const gap = totalBarSpace * 0.28;
        const availableHeight = showReflection ? h * 0.68 : h * 0.90;
        const baseline = availableHeight;

        for (let i = 0; i < barCount; i++) {
          let energy = 0;
          if (isPlaying) {
            energy = getBarEnergy(spectrum, i, barCount);
          } else {
            energy = (Math.sin(now * 0.003 + i * 0.25) * 0.5 + 0.5) * 22 + 6;
          }

          // Calibrated target height: scales to 88% of available height max
          const targetH = Math.max(3, (energy / 255) * availableHeight * 0.88);

          // Smooth attack (0.35) and smooth decay (0.16)
          const curH = smoothedBarsRef.current[i];
          if (targetH > curH) {
            smoothedBarsRef.current[i] = curH + (targetH - curH) * 0.35;
          } else {
            smoothedBarsRef.current[i] = curH + (targetH - curH) * 0.16;
          }

          const finalH = smoothedBarsRef.current[i];

          // Gravity peak falloff
          if (finalH >= peaksRef.current[i]) {
            peaksRef.current[i] = finalH;
            peakHoldRef.current[i] = 10;
            peakSpeedRef.current[i] = 0;
          } else {
            if (peakHoldRef.current[i] > 0) {
              peakHoldRef.current[i]--;
            } else {
              peakSpeedRef.current[i] += 0.22;
              peaksRef.current[i] = Math.max(3, peaksRef.current[i] - peakSpeedRef.current[i]);
            }
          }

          const x = i * (barWidth + gap) + gap / 2;
          const y = baseline - finalH;

          // Main vertical gradient bar
          const grad = ctx.createLinearGradient(0, y, 0, baseline);
          grad.addColorStop(0, activeTheme.accent);
          grad.addColorStop(0.7, activeTheme.secondary);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, finalH, [3, 3, 0, 0]);
          ctx.fill();

          // Floating Peak Cap
          if (showPeaks) {
            const peakY = Math.max(0, baseline - peaksRef.current[i] - 3);
            ctx.fillStyle = activeTheme.peak;
            ctx.shadowColor = activeTheme.glow;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.roundRect(x, peakY, barWidth, 2, [1, 1, 1, 1]);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Mirror glass reflection
          if (showReflection) {
            const reflectionHeight = finalH * 0.35;
            const refGrad = ctx.createLinearGradient(0, baseline, 0, baseline + reflectionHeight);
            refGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
            refGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = refGrad;
            ctx.beginPath();
            ctx.roundRect(x, baseline + 2, barWidth, reflectionHeight, [0, 0, 2, 2]);
            ctx.fill();
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 2: HARMONIC OSCILLOSCOPE (SMOOTH TIME-DOMAIN WAVE)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'wave') {
        const midY = h * 0.5;
        const amplitude = h * 0.34;
        const numPoints = 48;
        const slice = width / (numPoints - 1);
        const tdLen = timeDomain.length || 128;
        const step = Math.max(1, Math.floor(tdLen / numPoints));

        // Sample and smooth points with a moving box filter
        const points = [];
        for (let i = 0; i < numPoints; i++) {
          let sum = 0;
          let count = 0;
          const start = i * step;
          for (let k = 0; k < step && start + k < tdLen; k++) {
            sum += timeDomain[start + k];
            count++;
          }
          const avgByte = count > 0 ? sum / count : 128;
          const norm = isPlaying
            ? (avgByte - 128) / 128
            : Math.sin(waveTimeRef.current + i * 0.25) * 0.18;
          points.push(midY + norm * amplitude);
        }

        // Layer 1: Ambient soft luminous under-fill
        ctx.beginPath();
        ctx.moveTo(0, midY);
        for (let i = 0; i < numPoints; i++) {
          const x = i * slice;
          const y = points[i];
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevY = points[i - 1];
            ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
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
          const x = i * slice;
          const y = points[i];
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevY = points[i - 1];
            ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          }
        }
        ctx.strokeStyle = activeTheme.accent;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.shadowColor = activeTheme.glow;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Layer 3: Subtle secondary harmonic
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const x = i * slice;
          const offset = points[numPoints - 1 - i] - midY;
          const y = midY - offset * 0.45;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevOffset = points[numPoints - i] - midY;
            const prevY = midY - prevOffset * 0.45;
            ctx.quadraticCurveTo(prevX, prevY, (prevX + x) / 2, (prevY + y) / 2);
          }
        }
        ctx.strokeStyle = activeTheme.secondary;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.55;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 3: AUDIO HALO (360° SYMMETRIC RADIAL PULSE)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'radial') {
        const cx = width / 2;
        const cy = h / 2;
        const minDim = Math.min(width, h);
        const innerRadius = Math.max(26, minDim * 0.22 * (1 + bassEnergy * 0.14));
        const maxBarHeight = minDim * 0.25;
        const rays = 56;
        const half = Math.floor(rays / 2);

        rotationRef.current += isPlaying ? 0.0025 : 0.001;

        // Central Pulsing Glow Core
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius * 1.5);
        coreGlow.addColorStop(0, activeTheme.glow);
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 360-degree radiating frequency rays (Perfect 100% Mirror Symmetry)
        for (let i = 0; i < rays; i++) {
          const sym = i < half ? i : (rays - 1 - i);
          let energy = 0;
          if (isPlaying) {
            energy = getBarEnergy(spectrum, sym, half);
          } else {
            energy = (Math.sin(now * 0.003 + i * 0.3) * 0.5 + 0.5) * 25 + 8;
          }

          // Strictly bounded: cannot exceed maxBarHeight * 0.82
          const rayLen = Math.max(3, (energy / 255) * maxBarHeight * 0.82);

          const angle = (i / rays) * Math.PI * 2 + rotationRef.current;
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
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 4: QUANTUM PARTICLES (COSMIC STARFIELD)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'particles') {
        const particles = particlesRef.current;
        const speedMultiplier = isPlaying ? 1 + bassEnergy * 2.2 : 0.6;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
          if (p.y < 0) p.y = 1;
          if (p.y > 1) p.y = 0;

          const px = p.x * width;
          const py = p.y * h;
          const size = p.baseSize * (1 + bassEnergy * 1.3);

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = i % 3 === 0 ? activeTheme.accent : activeTheme.secondary;
          ctx.shadowColor = activeTheme.glow;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;

          for (let j = i + 1; j < Math.min(particles.length, i + 6); j++) {
            const p2 = particles[j];
            const p2x = p2.x * width;
            const p2y = p2.y * h;
            const dist = Math.hypot(p2x - px, p2y - py);
            if (dist < 65) {
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(p2x, p2y);
              ctx.strokeStyle = activeTheme.accent;
              ctx.globalAlpha = (1 - dist / 65) * 0.22;
              ctx.lineWidth = 0.8;
              ctx.stroke();
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 5: VINTAGE ANALOGUE VU METERS (CALIBRATED DAMPING)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'vu-meter') {
        const meterW = Math.min(220, (width - 32) / 2);
        const meterH = Math.min(110, h * 0.88);
        const startY = (h - meterH) / 2;

        const drawSingleVUMeter = (x, y, label, channelPos) => {
          // Meter casing
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

          const pivotX = x + meterW / 2;
          const pivotY = y + meterH * 0.88;
          const needleLen = meterH * 0.72;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, needleLen, -Math.PI * 0.75, -Math.PI * 0.25);
          ctx.stroke();

          // Scale Ticks
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

          // Needle angle: strictly -135 deg to -45 deg
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
          ctx.strokeStyle = channelPos > 210 ? '#ef4444' : activeTheme.accent;
          ctx.shadowColor = activeTheme.glow;
          ctx.shadowBlur = 5;
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

          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(label, pivotX, y + meterH * 0.95);
        };

        // Calibrated target (sits comfortably at 40-75% deflection, reaching red only on loud peaks)
        const bassNorm = (freq.bass || 0) / 255;
        const midNorm = (freq.mid || 0) / 255;
        const avgNorm = (freq.average || 0) / 255;

        const leftTarget = isPlaying ? (bassNorm * 0.6 + avgNorm * 0.4) * 195 : 20;
        const rightTarget = isPlaying ? (midNorm * 0.6 + avgNorm * 0.4) * 195 : 20;

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
      // MODE 6: CYBER LED BAR MATRIX (BALANCED ROWS)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'matrix') {
        const cols = Math.min(32, barCount);
        const rows = 14;
        const colWidth = (width / cols) * 0.76;
        const colGap = (width / cols) * 0.24;
        const cellHeight = (h / rows) * 0.72;
        const cellGap = (h / rows) * 0.28;

        for (let c = 0; c < cols; c++) {
          let energy = 0;
          if (isPlaying) {
            energy = getBarEnergy(spectrum, c, cols);
          } else {
            energy = (Math.sin(now * 0.003 + c * 0.3) * 0.5 + 0.5) * 35 + 10;
          }

          // Calibrated: typically 4-10 rows lit, red only on top 2
          const activeRows = Math.min(rows, Math.floor((energy / 255) * (rows - 1)));
          const x = c * (colWidth + colGap);

          for (let r = 0; r < rows; r++) {
            const y = h - (r + 1) * (cellHeight + cellGap);
            const isLit = r <= activeRows;

            if (isLit) {
              if (r >= rows - 2) ctx.fillStyle = '#ef4444';
              else if (r >= rows - 4) ctx.fillStyle = '#f59e0b';
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
