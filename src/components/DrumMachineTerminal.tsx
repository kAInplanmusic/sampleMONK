import React, { useState } from 'react';
import { useSamples } from '../context/SampleContext';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

export const DrumMachineTerminal: React.FC = () => {
  const { samples } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('drum_machines', 'ACTIVE');
  const [padSamples, setPadSamples] = useState<Record<number, AudioSample>>({});

  const handleSampleDrop = (sample: AudioSample, index: number) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setPadSamples(prev => ({ ...prev, [index]: sample }));
  };

  return (
    <div className={`drum-machine-ui p-6 bg-[#1a1a1a] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-white ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Drum Pad Mapper</h3>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(16)].map((_, i) => (
          <DropTarget 
            key={i} 
            onDrop={(sample) => handleSampleDrop(sample, i)}
            className="aspect-square bg-[#111] border border-neutral-700 rounded-lg flex items-center justify-center text-[10px] text-neutral-600 hover:border-fuchsia-500"
          >
            <div className="text-center truncate p-2">
                {padSamples[i]?.name || `PAD ${i + 1}`}
            </div>
          </DropTarget>
        ))}
      </div>
    </div>
  );
};
