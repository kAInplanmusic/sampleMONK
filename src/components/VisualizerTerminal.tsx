import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { usePluginState } from '../hooks/usePluginState';
import { audioEngine } from '../utils/audioEngine';

export const VisualizerTerminal: React.FC = React.memo(() => {
  const { state, lockStatus, updateState } = usePluginState('visualizer', 'ACTIVE');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    
    const draw = () => {
        const waveform = audioEngine.sharedWaveformBuffer;
        if (waveform) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.strokeStyle = '#14b8a6';
            ctx.lineWidth = 2;
            
            for (let i = 0; i < waveform.length; i++) {
                const x = (i / waveform.length) * canvas.width;
                const y = (waveform[i] * canvas.height / 2) + (canvas.height / 2);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        animationId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={`p-6 bg-[#161616] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-neutral-300 font-mono shadow-2xl`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" /> VISUALIZER
        </h3>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>
      <canvas ref={canvasRef} width={400} height={150} className="w-full bg-black rounded" />
    </div>
  );
});
