/**
 * colorExtractor.js
 * High-performance client-side image color extraction for ambient lighting.
 */

const DEFAULT_THEME = {
  primary: '#ffffff',
  secondary: '#94a3b8',
  glow: 'rgba(255, 255, 255, 0.35)',
  gradient: ['#0f172a', '#475569', '#f8fafc'],
};

const cache = new Map();

export async function extractColorsFromImage(imageUrl) {
  if (!imageUrl) return DEFAULT_THEME;
  if (cache.has(imageUrl)) return cache.get(imageUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const sampleSize = 32;
        canvas.width = sampleSize;
        canvas.height = sampleSize;

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

        let r = 0, g = 0, b = 0, count = 0;
        let maxBright = 0;
        let brightColor = { r: 224, g: 82, b: 154 };

        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const bright = (pr * 299 + pg * 587 + pb * 114) / 1000;

          if (bright > 20 && bright < 240) {
            r += pr;
            g += pg;
            b += pb;
            count++;
            if (bright > maxBright) {
              maxBright = bright;
              brightColor = { r: pr, g: pg, b: pb };
            }
          }
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
        } else {
          r = 138; g = 61; b = 136;
        }

        const primaryHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        const accentHex = `#${((1 << 24) + (brightColor.r << 16) + (brightColor.g << 8) + brightColor.b).toString(16).slice(1)}`;

        const theme = {
          primary: primaryHex,
          secondary: accentHex,
          glow: `rgba(${r}, ${g}, ${b}, 0.45)`,
          gradient: [primaryHex, accentHex, '#5227FF'],
        };

        cache.set(imageUrl, theme);
        resolve(theme);
      } catch {
        resolve(DEFAULT_THEME);
      }
    };

    img.onerror = () => resolve(DEFAULT_THEME);
  });
}
