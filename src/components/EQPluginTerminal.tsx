import {  useState, useEffect, useRef  } from 'react';
import { Waves, Power } from 'lucide-react';
import { usePluginState } from '../hooks/usePluginState';
import { audioEngine } from '../utils/audioEngine';

export function EQPluginTerminal() {
  const { state, lockStatus, updateState } = usePluginState('eq', 'PRO');
  const [power, setPower] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const bands = [
    { freq: '30Hz', type: 'LOW CUT', val: 0 },
    { freq: '60Hz', type: 'LOW', val: 2 },
    { freq: '120Hz', type: 'LOW MID', val: 5 },
    { freq: '250Hz', type: 'MID', val: -3 },
    { freq: '1kHz', type: 'MID HIGH', val: -1 },
    { freq: '4kHz', type: 'HIGH', val: 4 },
    { freq: '8kHz', type: 'PRESENCE', val: 6 },
    { freq: '16kHz', type: 'AIR', val: 2 },
  ];

  const [gainValues, setGainValues] = useState(bands.map(b => b.val));

  // Löst Frequenz-Label (z.B. '1kHz', '30Hz', '4kHz') sauber in Hertz auf.
  const freqHz = (label: string): number => {
    const m = label.match(/([\d.]+)\s*([kM]?)[Hh]z/);
    if (!m) return 0;
    const num = parseFloat(m[1]);
    if (!Number.isFinite(num)) return 0;
    const unit = (m[2] || '').toLowerCase();
    return unit === 'k' ? Math.round(num * 1000) : unit === 'm' ? Math.round(num * 1000000) : Math.round(num);
  };

  const handleGainChange = (idx: number, gain: number) => {
    const newGains = [...gainValues];
    newGains[idx] = gain;
    setGainValues(newGains);

    // Update audioEngine (P9): echte Weiterleitung an eqProcessor + Tone-Kette.
    audioEngine.updateToneShiftEQ({
      bands: bands.map((b, i) => ({ freq: freqHz(b.freq), gain: newGains[i], q: 1 }))
    });
  };

  // Frequency response curve visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let phase = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      for(let i=1; i<8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (w/8), 0);
        ctx.lineTo(i * (w/8), h);
        ctx.stroke();
      }
      for(let i=1; i<4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * (h/4));
        ctx.lineTo(w, i * (h/4));
        ctx.stroke();
      }

      if (power) {
        // Draw Curve
        ctx.beginPath();
        ctx.moveTo(0, h/2);
        
        // Spline through points
        for(let i=0; i<w; i++) {
          let y = h/2;
          
          // Influence from bands
          bands.forEach((_b, idx) => {
            const bandX = (idx + 0.5) * (w / 8);
            const dist = Math.abs(i - bandX);
            const influence = Math.max(0, 1 - (dist / (w/4))); // simple bell
            y -= gainValues[idx] * influence * 10;
          });
          
          // Add some real-time jitter for spectrum analyzer feel
          const jitter = Math.sin(i * 0.1 + phase) * Math.random() * 5;
          
          ctx.lineTo(i, y + jitter);
        }
        
        ctx.strokeStyle = '#14b8a6'; // teal-500
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Fill gradient
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(20, 184, 166, 0.2)');
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        phase += 0.2;
      }
      
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(frameId);
  }, [power, gainValues]);

  return (
    <div className={`w-full h-full flex flex-col bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-teal-900/20 to-[#111] border-b border-teal-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Waves className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Equalizer <span className="text-[10px] font-mono text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-sm">PARA-EQ</span>
            </h2>
          </div>
        </div>
        
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AUTO_AI">AI</option>
            <option value="PRO">ACTIVE</option>
        </select>
        
        <button 
          onClick={() => setPower(!power)}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${power ? 'bg-teal-500 border-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.6)]' : 'bg-[#222] border-[#333] text-neutral-500 hover:bg-[#333]'}`}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      <div className={`flex-1 flex flex-col p-6 gap-6 overflow-hidden transition-opacity duration-1000 ${power ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
        
        {/* Visualizer */}
        <div className="h-48 bg-black rounded-xl border-4 border-neutral-800 shadow-inner p-2 relative overflow-hidden">
           <canvas ref={canvasRef} width={800} height={200} className="w-full h-full opacity-80" />
           <div className="absolute top-2 left-3 bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-teal-500 border border-teal-500/30">
             SPECTRUM ANALYZER
           </div>
        </div>
        
        {/* Band Controls */}
        <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex items-center justify-between shadow-inner">
           {bands.map((band, idx) => (
             <div key={idx} className="flex flex-col items-center gap-4 flex-1">
               <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">{band.type}</div>
               
               {/* Fader */}
               <div className="h-40 w-8 bg-black rounded-full border-4 border-neutral-800 flex justify-center relative p-1 shadow-inner">
                  <input 
                    type="range"
                    min="-12" max="12" step="0.1"
                    value={gainValues[idx]}
                    onChange={(e) => handleGainChange(idx, parseFloat(e.target.value))}
                    className="absolute w-2 h-40 opacity-0 cursor-ns-resize"
                  />
                  <div 
                    className="w-10 h-6 bg-[#2a2a2a] rounded-sm border border-neutral-700 shadow-xl pointer-events-none absolute flex items-center justify-center flex-col gap-0.5"
                    style={{ 
                      bottom: `${((gainValues[idx] + 12) / 24) * 100}%`, 
                      transform: 'translateY(50%)' 
                    }}
                  >
                     <div className="w-6 h-0.5 bg-teal-500 shadow-[0_0_5px_rgba(20,184,166,0.8)]"></div>
                  </div>
               </div>
               
               <div className="text-center">
                 <div className="text-sm font-black text-teal-400 font-mono">
                   {gainValues[idx] > 0 ? '+' : ''}{gainValues[idx].toFixed(1)}
                 </div>
                 <div className="text-[9px] text-neutral-600 font-mono mt-1">{band.freq}</div>
               </div>
               
               {/* Q Knob */}
               <div className="mt-2 w-8 h-8 rounded-full border-2 border-[#111] bg-neutral-800 relative cursor-pointer hover:border-neutral-700 transition-colors">
                  <div className="absolute top-1 left-1/2 w-0.5 h-2 bg-neutral-500 -translate-x-1/2 rounded-full"></div>
               </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
