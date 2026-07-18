import React, { useState, useEffect, useRef } from 'react';
import { Activity, Power, Settings, Cpu, Zap, Sliders } from 'lucide-react';

export function DSPTerminal() {
  const [power, setPower] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let phase = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(17, 17, 17, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (power) {
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const y = canvas.height / 2 + 
                    Math.sin(i * 0.05 + phase) * 20 + 
                    Math.cos(i * 0.1 + phase * 1.5) * 10;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.strokeStyle = '#8b5cf6'; // violet-500
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw corrected phase line
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const y = canvas.height / 2 + Math.sin(i * 0.05 + phase) * 20;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'; // emerald-500
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      phase -= 0.1;
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(frameId);
  }, [power]);

  const modules = [
    { name: 'PHASE CORRECTION', active: true, value: 'LINEAR' },
    { name: 'DYNAMIC FILTER', active: true, value: 'MULTI-BAND' },
    { name: 'RESONANCE SUPPRESSION', active: false, value: 'OFF' },
    { name: 'SURGICAL SHAPING', active: true, value: 'ACTIVE' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#111] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl relative">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-900/20 to-[#111] border-b border-violet-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Activity className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Digital Signal Processor <span className="text-[10px] font-mono text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-sm">ZERO JITTER</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">High-End Realtime Signal Manipulation Inlay</p>
          </div>
        </div>
        
        <button 
          onClick={() => setPower(!power)}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${power ? 'bg-violet-500 border-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'bg-[#222] border-[#333] text-neutral-500 hover:bg-[#333]'}`}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      <div className={`flex-1 p-6 grid grid-cols-12 gap-6 transition-opacity duration-1000 ${power ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
        {/* Left Col: DSP Modules */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-4 shadow-inner flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-widest text-neutral-500 flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" /> CORE PROCESSING
            </h3>
            {modules.map(mod => (
              <div key={mod.name} className={`p-3 rounded-lg border ${mod.active ? 'bg-violet-900/10 border-violet-500/30' : 'bg-[#111] border-neutral-800'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${mod.active ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'bg-neutral-700'}`}></div>
                  <span className={`text-[10px] font-bold tracking-wider ${mod.active ? 'text-neutral-200' : 'text-neutral-500'}`}>{mod.name}</span>
                </div>
                <span className={`text-[9px] font-mono ${mod.active ? 'text-violet-400' : 'text-neutral-600'}`}>{mod.value}</span>
              </div>
            ))}
          </div>
          
          <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-4 shadow-inner">
            <h3 className="text-xs font-bold tracking-widest text-neutral-500 flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4" /> LATENCY & JITTER
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>INTERNAL BUFFER</span>
                  <span className="text-emerald-400">0.02ms</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[5%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                  <span>JITTER VARIANCE</span>
                  <span className="text-emerald-400">0.00ms</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded overflow-hidden"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Visualization & Settings */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="h-48 bg-black rounded-xl border-4 border-neutral-800 shadow-inner p-2 relative overflow-hidden">
             <canvas ref={canvasRef} width={600} height={200} className="w-full h-full" />
             <div className="absolute top-2 left-3 bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-violet-500 border border-violet-500/30">
               REALTIME PHASE MONITOR
             </div>
          </div>
          
          <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 shadow-inner grid grid-cols-4 gap-6">
            {['OVERSAMPLING', 'LOOKAHEAD', 'TRANSIENT DETECT', 'STEREO LINK'].map((param, i) => (
              <div key={param} className="flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-[#111] bg-neutral-800 relative cursor-pointer hover:border-violet-900 transition-colors shadow-lg">
                   <div className="absolute top-1 left-1/2 w-1 h-3 bg-violet-400 -translate-x-1/2 rounded-full shadow-[0_0_5px_rgba(139,92,246,0.8)]"></div>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-mono font-bold text-neutral-500">{param}</span>
                  <div className="text-xs font-black text-violet-400 mt-1">{['8x', '1.5ms', 'FAST', '100%'][i]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
