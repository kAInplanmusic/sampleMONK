import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface BeatVisualizerProps {
  isPlaying: boolean;
}

export const BeatVisualizer: React.FC<BeatVisualizerProps> = React.memo(({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/visualizerWorker.ts', import.meta.url));

    // Transfer control to worker
    const offscreen = canvas.transferControlToOffscreen();
    workerRef.current.postMessage({ 
        type: 'init', 
        canvas: offscreen, 
        width: canvas.width, 
        height: canvas.height 
    }, [offscreen]);

    // Animation Loop on Main Thread to feed data
    const update = () => {
      let data: Float32Array = new Float32Array(0);
      if (audioEngine.initialized && audioEngine.analyser) {
        data = audioEngine.analyser.getValue() as Float32Array;
      }
      
      workerRef.current?.postMessage({ 
          type: 'draw', 
          data, 
          isPlaying 
      });
      animationRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      workerRef.current?.terminate();
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
