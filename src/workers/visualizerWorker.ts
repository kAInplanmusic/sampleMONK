// src/workers/visualizerWorker.ts

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let canvasWidth = 0;
let canvasHeight = 0;

self.onmessage = (event) => {
  const { type, canvas, data, isPlaying, width, height } = event.data;

  if (type === 'init') {
    const offscreen = canvas as OffscreenCanvas;
    ctx = offscreen.getContext('2d');
    canvasWidth = width;
    canvasHeight = height;
  } else if (type === 'draw') {
    if (!ctx) return;

    // Drawing logic from BeatVisualizer.tsx
    const width = canvasWidth;
    const height = canvasHeight;

    // Draw subtle background grid
    ctx.fillStyle = 'rgba(15, 15, 20, 0.2)';
    ctx.fillRect(0, 0, width, height);

    // ... (rest of the grid drawing logic) ...
    ctx.strokeStyle = 'rgba(38, 38, 55, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    if (data && data.length > 0) {
        // ... (rest of the waveform drawing logic) ...
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#0ea5e9');
        gradient.addColorStop(1, '#6366f1');
        
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = isPlaying ? 12 : 2;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';

        const sliceWidth = width / data.length;
        let x = 0;

        ctx.beginPath();
        ctx.lineWidth = 3;
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          const y = (v + 1) * (height / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    } else {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(74, 85, 104, 0.4)';
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        const pulseFrequency = 0.005;
        const amplitude = 5 * Math.sin(Date.now() * pulseFrequency);
        for (let x = 0; x < width; x++) {
          const y = height / 2 + amplitude * Math.sin(x * 0.05);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
  }
};
