import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Activity, Power, Sliders, AudioLines, Radio, Flame, Cpu } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

export function FXEngineTerminal() {
  const { state, lockStatus, updateState } = usePluginState('dj_fx', 'ACTIVE');
  const [power, setPower] = useState(true);
  const [activeFx, setActiveFx] = useState('REVERB');
  const [wetDry, setWetDry] = useState(50);
  const [sourceSample, setSourceSample] = useState<AudioSample | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Connect to Backend API
  const applyFx = async (fx: string, dryWet: number, sampleId?: string) => {
    try {
      await fetch('http://localhost:8000/api/apply-fx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fx_type: fx, 
          settings: { wetDry: dryWet },
          sample_id: sampleId
        }),
      });
      console.log(`FX ${fx} applied to ${sampleId || 'global'} with wetDry ${dryWet}%`);
    } catch (e) {
      console.error("FX application failed:", e);
    }
  };

  const handleSampleDrop = (sample: AudioSample) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setSourceSample(sample);
    applyFx(activeFx, wetDry, sample.id);
  };

  const handleFxChange = (fx: string) => {
    setActiveFx(fx);
    applyFx(fx, wetDry, sourceSample?.id);
  };
  
  const fxList = [
    { id: 'DELAY', label: 'TAPE ECHO' },
    { id: 'REVERB', label: 'SPACE HALL' },
    { id: 'FLANGER', label: 'JET FLANGER' },
    { id: 'PHASER', label: 'ANALOG PHASER' },
    { id: 'DISTORTION', label: 'SATURATOR' },
    { id: 'BITCRUSHER', label: 'DECIMATOR' },
    { id: 'CHORUS', label: 'DIMENSION D' },
    { id: 'FILTER', label: 'VCF CUT' },
  ];

  // Visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let phase = 0;

    const draw = () => {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (power) {
        ctx.beginPath();
        const amplitude = activeFx === 'REVERB' ? 20 : activeFx === 'DELAY' ? 40 : activeFx === 'DISTORTION' ? 60 : 30;
        const frequency = activeFx === 'DISTORTION' ? 0.2 : 0.05;
        
        for (let i = 0; i < canvas.width; i++) {
          const y = canvas.height / 2 + 
                    Math.sin(i * frequency + phase) * amplitude * (wetDry/100) * (Math.random() > 0.8 && activeFx === 'BITCRUSHER' ? 0.5 : 1) + 
                    (activeFx === 'DISTORTION' ? (Math.random() - 0.5) * 10 * (wetDry/100) : 0);
          
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shadow/glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f43f5e';
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      phase -= 0.1;
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(frameId);
  }, [power, activeFx, wetDry]);

  return (
    <div className={`w-full h-full flex flex-col bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-900/20 to-[#111] border-b border-rose-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <Sparkles className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Effektmaschine <span className="text-[10px] font-mono text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-sm">RACK V4</span>
            </h2>
          </div>
        </div>
        
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
        
        <button 
          onClick={() => setPower(!power)}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${power ? 'bg-rose-500 border-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]' : 'bg-[#222] border-[#333] text-neutral-500 hover:bg-[#333]'}`}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      {/* Main Body */}
      <div className={`flex-1 p-8 grid grid-cols-12 gap-8 relative transition-opacity duration-1000 ${power ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
         
         {/* Left Column: Isolator / Routing */}
         <div className="col-span-3 flex flex-col gap-6">
            <DropTarget 
                label="Drop Sample to FX"
                onDrop={handleSampleDrop}
                className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 p-6 flex-1 flex flex-col shadow-inner items-center justify-center"
            >
                <div className="text-center font-bold text-xs truncate">
                    {sourceSample ? sourceSample.name : 'DROP SAMPLE HERE'}
                </div>
            </DropTarget>
            
            <div className="bg-[#1a1a1a] rounded-2xl border border-neutral-800 p-6 flex flex-col shadow-inner">
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-800 pb-4">
                   <Activity className="w-4 h-4 text-rose-500" />
                   <h3 className="font-bold text-sm tracking-widest uppercase text-neutral-400">ISOLATOR</h3>
                </div>
                
                <div className="flex flex-col gap-8 flex-1 justify-center">
                  {['HIGH', 'MID', 'LOW'].map(band => (
                    <div key={band} className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-[6px] border-[#111] bg-neutral-800 flex items-center justify-center relative cursor-pointer hover:border-rose-900 transition-colors shadow-xl">
                        <div className="absolute top-2 left-1/2 w-1.5 h-4 bg-rose-500 -translate-x-1/2 rounded-full shadow-[0_0_5px_rgba(244,63,94,0.8)]"></div>
                      </div>
                      <span className="text-xs font-bold text-neutral-500">{band}</span>
                    </div>
                  ))}
                </div>
             </div>
         </div>
// ...
      </div>
    </div>
  );
}
