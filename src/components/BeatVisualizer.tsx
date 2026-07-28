import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface BeatVisualizerProps {
  isPlaying: boolean;
}

export const BeatVisualizer: React.FC<BeatVisualizerProps> = React.memo(({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/visualizerWorker.ts', import.meta.url));

    // Transfer control to worker
    const offscreen = canvas.transferControlToOffscreen();
    
    // Get SAB from audioEngine if available
    const sab = audioEngine.initialized && audioEngine.sharedWaveformBuffer 
        ? audioEngine.sharedWaveformBuffer.buffer 
        : null;

    workerRef.current.postMessage({ 
        type: 'init', 
        canvas: offscreen, 
        sab,
        width: 800, // Fixed resolution
        height: 200,
        playing: isPlaying
    }, [offscreen]);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Sync playing state with worker
  useEffect(() => {
    workerRef.current?.postMessage({
        type: 'state',
        playing: isPlaying
    });
  }, [isPlaying]);

  return (
    <div id="visualizer-container" className="w-full h-28 bg-[#09090b] rounded-xl overflow-hidden border border-neutral-800/80 relative">
      <canvas
        id="audio-visual-canvas"
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full block"
      />
      <div className="absolute top-2 left-3 bg-black/60 px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 border border-neutral-800 tracking-wider uppercase select-none">
        {isPlaying ? 'FREQUENCY WAVEFORM // LIVE' : 'STATION IDLE'}
      </div>
    </div>
  );
});
