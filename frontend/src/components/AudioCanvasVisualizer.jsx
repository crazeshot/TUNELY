import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/usePlayer';

export default function AudioCanvasVisualizer({
  mode = 'bars', // 'bars' | 'wave' | 'radial'
  height = 80,
  barCount = 32,
  accentColor = '#e0529a',
  secondaryColor = '#5227FF',
}) {
  const { isPlaying, getFrequencyData } = usePlayer();
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      const freq = getFrequencyData ? getFrequencyData() : { spectrum: new Uint8Array(64) };
      const spectrum = freq.spectrum;

      if (mode === 'bars') {
        const step = Math.floor(spectrum.length / barCount) || 1;
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
          const val = spectrum[i * step] || (isPlaying ? Math.sin(Date.now() * 0.005 + i * 0.4) * 30 + 40 : 8);
          const barHeight = Math.max(4, (val / 255) * h * 0.9);
          const x = i * (barWidth + gap);
          const y = h - barHeight;

          // Gradient fill
          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, secondaryColor);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Subtle glow cap
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, 2, [2, 2, 2, 2]);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;

        const slice = width / spectrum.length;
        for (let i = 0; i < spectrum.length; i++) {
          const val = spectrum[i] || (isPlaying ? Math.sin(Date.now() * 0.006 + i * 0.2) * 25 + 128 : 128);
          const y = (val / 255) * h;
          const x = i * slice;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (isPlaying) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, mode, barCount, accentColor, secondaryColor, getFrequencyData]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className="w-full h-full block pointer-events-none"
    />
  );
}
