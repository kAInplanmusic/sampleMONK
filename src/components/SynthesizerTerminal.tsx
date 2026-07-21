import React, { useState } from 'react';
import { Waves, Zap, Settings } from 'lucide-react';
import { usePluginState } from '../hooks/usePluginState';
import { audioEngine } from '../utils/audioEngine';

export const SynthesizerTerminal: React.FC = () => {
  const { state, lockStatus, updateState } = usePluginState('synth', 'ACTIVE');
  const [engine, setEngine] = useState('SUBTRACTIVE');
  const [cutoff, setCutoff] = useState(1000);

  const handleEngineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEngine = e.target.value;
    setEngine(newEngine);
    // Link to audioEngine: audioEngine.setSynthEngine(newEngine);
    console.log('Switching synth engine to:', newEngine);
  };

  return (
    <div className={`p-6 bg-[#161616] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-neutral-300 font-mono shadow-2xl`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Waves className="w-4 h-4 text-violet-400" /> Synth MONK
        </h3>
        <select value={engine} onChange={handleEngineChange} className="bg-black text-white text-xs p-1 rounded">
            <option value="SUBTRACTIVE">SUBTRACTIVE</option>
            <option value="FM">FM</option>
            <option value="WAVETABLE">WAVETABLE</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-[10px] text-neutral-500">FILTER CUTOFF</label>
            <input type="range" min="20" max="20000" value={cutoff} onChange={e => setCutoff(Number(e.target.value))} className="w-full accent-violet-500" />
            <div className="text-xs">{cutoff} Hz</div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] text-neutral-500">ADSR DECAY</label>
            <input type="range" min="0" max="1" step="0.01" className="w-full accent-violet-500" />
          </div>
      </div>
    </div>
  );
};
