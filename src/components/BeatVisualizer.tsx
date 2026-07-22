import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface BeatVisualizerProps {
  isPlaying: boolean;
}

export const BeatVisualizer: React.FC<BeatVisualizerProps> = React.memo(({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Resize using ResizeObserver
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Drawing Loop
    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Draw subtle background grid
      ctx.fillStyle = 'rgba(15, 15, 20, 0.2)';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(38, 38, 55, 0.1)';
      ctx.lineWidth = 1;
      
      // vertical lines
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      
      // horizontal lines
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      if (audioEngine.initialized && audioEngine.analyser) {
        const values = audioEngine.analyser.getValue() as Float32Array;
        
        ctx.beginPath();
        ctx.lineWidth = 3;
        
        // Dynamic gradient for techno vibe (medium blue to indigo)
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#3b82f6'); // Blue-500
        gradient.addColorStop(0.5, '#0ea5e9'); // Sky-500
        gradient.addColorStop(1, '#6366f1'); // Indigo-500
        
        ctx.strokeStyle = gradient;
        ctx.shadowBlur = isPlaying ? 12 : 2;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';

        const sliceWidth = width / values.length;
        let x = 0;

        for (let i = 0; i < values.length; i++) {
          const v = values[i];
          // Standardise wave scaling
          const y = (v + 1) * (height / 2);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      } else {
        // Flatline idle wave with elegant breathing pulse
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

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div id="visualizer-container" ref={containerRef} className="w-full h-28 bg-[#09090b] rounded-xl overflow-hidden border border-neutral-800/80 relative">
      <canvas
        id="audio-visual-canvas"
        ref={canvasRef}
        className="w-full h-full block"
      />
      <div className="absolute top-2 left-3 bg-black/60 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 border border-neutral-800 tracking-wider uppercase select-none">
        {isPlaying ? 'FREQUENCY WAVEFORM // LIVE' : 'STATION IDLE'}
      </div>
    </div>
  );
});
