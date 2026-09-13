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
  const peaksRef = useRef([]);
  const peakHoldRef = useRef([]);
  const vuValuesRef = useRef({ left: 0, right: 0 });
  const particlesRef = useRef([]);
  const rotationRef = useRef(0);

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
      particlesRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
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

      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, h);

      const freq = getFrequencyData ? getFrequencyData() : { spectrum: new Uint8Array(128), bass: 0, mid: 0, treble: 0, average: 0 };
      const spectrum = freq.spectrum || new Uint8Array(128);
      const bassEnergy = freq.bass / 255;
      const now = Date.now();

      // Ensure peaks array is properly sized
      if (peaksRef.current.length !== barCount) {
        peaksRef.current = new Float32Array(barCount);
        peakHoldRef.current = new Int32Array(barCount);
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 1: STUDIO NEON SPECTRUM (BARS)
      // ─────────────────────────────────────────────────────────────
      if (mode === 'bars') {
        const step = Math.max(1, Math.floor(spectrum.length / barCount));
        const totalBarSpace = width / barCount;
        const barWidth = Math.max(2, totalBarSpace * 0.68);
        const gap = totalBarSpace * 0.32;
        const availableHeight = showReflection ? h * 0.72 : h * 0.92;
        const baseline = availableHeight;

        for (let i = 0; i < barCount; i++) {
          let val = spectrum[i * step] || 0;
          if (!isPlaying) {
            val = Math.sin(now * 0.003 + i * 0.3) * 16 + 22;
          }

          // Perceptual boost for higher frequencies
          const freqBoost = 1 + (i / barCount) * 0.7;
          const targetHeight = Math.max(4, (Math.min(255, val * freqBoost) / 255) * availableHeight);

          // Update peak hold with gravity falloff
          if (targetHeight >= peaksRef.current[i]) {
            peaksRef.current[i] = targetHeight;
            peakHoldRef.current[i] = 16; // Hold for 16 frames
          } else {
            if (peakHoldRef.current[i] > 0) {
              peakHoldRef.current[i]--;
            } else {
              peaksRef.current[i] = Math.max(4, peaksRef.current[i] - 1.8);
            }
          }

          const x = i * (barWidth + gap) + gap / 2;
          const y = baseline - targetHeight;

          // Main vertical gradient bar
          const grad = ctx.createLinearGradient(0, y, 0, baseline);
          grad.addColorStop(0, activeTheme.accent);
          grad.addColorStop(1, activeTheme.secondary);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, targetHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Floating Peak Cap
          if (showPeaks) {
            const peakY = Math.max(0, baseline - peaksRef.current[i] - 3);
            ctx.fillStyle = activeTheme.peak;
            ctx.shadowColor = activeTheme.glow;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.roundRect(x, peakY, barWidth, 2, [1.5, 1.5, 1.5, 1.5]);
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          // Mirror glass reflection underneath baseline
          if (showReflection) {
            const reflectionHeight = targetHeight * 0.38;
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
      // MODE 2: HARMONIC OSCILLOSCOPE (SMOOTH WAVES)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'wave') {
        const midY = h * 0.5;
        const amplitude = h * 0.42;
        const points = 48;
        const slice = width / (points - 1);

        // Layer 1: Ambient Sub-Bass Glow Fill
        ctx.beginPath();
        ctx.moveTo(0, midY);
        for (let i = 0; i < points; i++) {
          const specIdx = Math.floor((i / points) * (spectrum.length * 0.4));
          const val = spectrum[specIdx] || (isPlaying ? Math.sin(now * 0.005 + i * 0.3) * 35 + 128 : 128);
          const norm = (val - 128) / 128;
          const y = midY + norm * amplitude * 0.85;
          const x = i * slice;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevSpecIdx = Math.floor(((i - 1) / points) * (spectrum.length * 0.4));
            const prevVal = spectrum[prevSpecIdx] || 128;
            const prevNorm = (prevVal - 128) / 128;
            const prevY = midY + prevNorm * amplitude * 0.85;
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

        // Layer 2: Main Smooth Luminous Oscilloscope Curve
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const specIdx = Math.floor((i / points) * spectrum.length);
          const val = spectrum[specIdx] || (isPlaying ? Math.sin(now * 0.004 + i * 0.25) * 40 + 128 : 128);
          const norm = (val - 128) / 128;
          const y = midY + norm * amplitude;
          const x = i * slice;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * slice;
            const prevSpecIdx = Math.floor(((i - 1) / points) * spectrum.length);
            const prevVal = spectrum[prevSpecIdx] || 128;
            const prevNorm = (prevVal - 128) / 128;
            const prevY = midY + prevNorm * amplitude;
            const cpX = (prevX + x) / 2;
            ctx.quadraticCurveTo(cpX, prevY, x, y);
          }
        }

        ctx.strokeStyle = activeTheme.accent;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = activeTheme.glow;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Layer 3: High-Frequency Shimmer Harmonic
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const specIdx = Math.floor(spectrum.length * 0.5 + (i / points) * (spectrum.length * 0.5));
          const val = spectrum[specIdx] || (isPlaying ? Math.cos(now * 0.008 + i * 0.4) * 20 + 128 : 128);
          const norm = (val - 128) / 128;
          const y = midY + norm * amplitude * 0.4;
          const x = i * slice;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = activeTheme.secondary;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 3: AUDIO HALO (360° CIRCULAR RADIAL)
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'radial') {
        const cx = width / 2;
        const cy = h / 2;
        const minDim = Math.min(width, h);
        const innerRadius = Math.max(25, minDim * 0.22 * (1 + bassEnergy * 0.15));
        const maxBarHeight = minDim * 0.28;
        const rays = 64;

        rotationRef.current += isPlaying ? 0.003 : 0.001;

        // Central Pulsing Glow Core
        const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius * 1.5);
        coreGlow.addColorStop(0, activeTheme.glow);
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 360-degree radiating frequency bars
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2 + rotationRef.current;
          const specIdx = Math.floor((i < rays / 2 ? i : rays - i) * (spectrum.length / (rays / 2)));
          let val = spectrum[specIdx] || (isPlaying ? Math.sin(now * 0.005 + i * 0.3) * 25 + 40 : 12);
          const rayLen = Math.max(4, (val / 255) * maxBarHeight);

          const x1 = cx + Math.cos(angle) * innerRadius;
          const y1 = cy + Math.sin(angle) * innerRadius;
          const x2 = cx + Math.cos(angle) * (innerRadius + rayLen);
          const y2 = cy + Math.sin(angle) * (innerRadius + rayLen);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? activeTheme.accent : activeTheme.secondary;
          ctx.lineWidth = Math.max(1.8, (Math.PI * 2 * innerRadius) / rays * 0.6);
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        // Inner glowing ring
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
        const speedMultiplier = isPlaying ? 1 + bassEnergy * 3.5 : 0.6;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx * speedMultiplier;
          p.y += p.vy * speedMultiplier;

          // Wrap edges
          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
          if (p.y < 0) p.y = 1;
          if (p.y > 1) p.y = 0;

          const px = p.x * width;
          const py = p.y * h;
          const size = p.baseSize * (1 + bassEnergy * 1.5);

          // Draw Star
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = i % 3 === 0 ? activeTheme.accent : activeTheme.secondary;
          ctx.shadowColor = activeTheme.glow;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Connect neighboring particles with translucent constellation filaments
          for (let j = i + 1; j < Math.min(particles.length, i + 8); j++) {
            const p2 = particles[j];
            const p2x = p2.x * width;
            const p2y = p2.y * h;
            const dist = Math.hypot(p2x - px, p2y - py);
            if (dist < 65) {
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(p2x, p2y);
              ctx.strokeStyle = activeTheme.accent;
              ctx.globalAlpha = (1 - dist / 65) * 0.25;
              ctx.lineWidth = 0.8;
              ctx.stroke();
              ctx.globalAlpha = 1.0;
            }
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 5: VINTAGE ANALOGUE VU METERS
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'vu-meter') {
        const meterW = Math.min(220, (width - 30) / 2);
        const meterH = Math.min(110, h * 0.88);
        const startY = (h - meterH) / 2;

        const drawSingleVUMeter = (x, y, label, channelVal) => {
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

          // Arc markings
          const pivotX = x + meterW / 2;
          const pivotY = y + meterH * 0.88;
          const needleLen = meterH * 0.72;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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

          // Needle deflection with inertia damping
          const targetAngle = -Math.PI * 0.75 + (channelVal / 255) * (Math.PI * 0.5);
          const needleX = pivotX + Math.cos(targetAngle) * needleLen;
          const needleY = pivotY + Math.sin(targetAngle) * needleLen;

          // Needle shadow
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pivotX + 2, pivotY + 2);
          ctx.lineTo(needleX + 2, needleY + 2);
          ctx.stroke();

          // Needle
          ctx.strokeStyle = channelVal > 220 ? '#ef4444' : activeTheme.accent;
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

        const leftTarget = isPlaying ? freq.bass : 15;
        const rightTarget = isPlaying ? freq.mid : 15;

        vuValuesRef.current.left += (leftTarget - vuValuesRef.current.left) * 0.22;
        vuValuesRef.current.right += (rightTarget - vuValuesRef.current.right) * 0.22;

        const leftX = width / 2 - meterW - 8;
        const rightX = width / 2 + 8;

        drawSingleVUMeter(leftX, startY, 'CH-1 (LEFT)', vuValuesRef.current.left);
        drawSingleVUMeter(rightX, startY, 'CH-2 (RIGHT)', vuValuesRef.current.right);
      }

      // ─────────────────────────────────────────────────────────────
      // MODE 6: CYBER LED BAR MATRIX
      // ─────────────────────────────────────────────────────────────
      else if (mode === 'matrix') {
        const cols = Math.min(32, barCount);
        const rows = 16;
        const colWidth = (width / cols) * 0.78;
        const colGap = (width / cols) * 0.22;
        const cellHeight = (h / rows) * 0.72;
        const cellGap = (h / rows) * 0.28;

        for (let c = 0; c < cols; c++) {
          const specIdx = Math.floor((c / cols) * spectrum.length);
          const val = spectrum[specIdx] || (isPlaying ? Math.sin(now * 0.004 + c * 0.3) * 30 + 40 : 10);
          const activeRows = Math.floor((val / 255) * rows);
          const x = c * (colWidth + colGap);

          for (let r = 0; r < rows; r++) {
            const y = h - (r + 1) * (cellHeight + cellGap);
            const isLit = r < activeRows;

            if (isLit) {
              if (r > rows - 3) ctx.fillStyle = '#ef4444'; // Overload top
              else if (r > rows - 6) ctx.fillStyle = '#f59e0b'; // Amber warn
              else ctx.fillStyle = activeTheme.accent;
              ctx.shadowColor = activeTheme.glow;
              ctx.shadowBlur = 4;
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
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

      // Loop animation
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
