import React, { useState } from 'react';
import { Layers, Zap, Settings } from 'lucide-react';
import { usePluginState } from '../hooks/usePluginState';
import { audioEngine } from '../utils/audioEngine';

export const SamplerTerminal: React.FC = () => {
  const { state, lockStatus, updateState } = usePluginState('sampler', 'ACTIVE');
  const [grainSize, setGrainSize] = useState(50); // ms
  const [density, setDensity] = useState(5); // grains per sec
  const [position, setPosition] = useState(0); // 0-100%

  const updateGrainParams = () => {
    audioEngine.setGranularParams({ grainSize, density, position });
  };

  return (
    <div className={`p-6 bg-[#161616] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-neutral-300 font-mono shadow-2xl`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Sampler MONK
        </h3>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>

      <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500">GRAIN SIZE ({grainSize}ms)</label>
            <input type="range" min="10" max="500" value={grainSize} onChange={e => {setGrainSize(Number(e.target.value)); updateGrainParams()}} className="w-full accent-emerald-500" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500">DENSITY ({density} grains/s)</label>
            <input type="range" min="1" max="20" value={density} onChange={e => {setDensity(Number(e.target.value)); updateGrainParams()}} className="w-full accent-emerald-500" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-neutral-500">POSITION ({position}%)</label>
            <input type="range" min="0" max="100" value={position} onChange={e => {setPosition(Number(e.target.value)); updateGrainParams()}} className="w-full accent-emerald-500" />
          </div>
      </div>
    </div>
  );
};
