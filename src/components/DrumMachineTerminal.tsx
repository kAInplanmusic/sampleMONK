import React, { useState } from 'react';
import { useSamples } from '../context/SampleContext';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';

export const DrumMachineTerminal: React.FC = () => {
  const { samples } = useSamples();
  const [padSamples, setPadSamples] = useState<Record<number, AudioSample>>({});

  const handleSampleDrop = (sample: AudioSample, index: number) => {
    setPadSamples(prev => ({ ...prev, [index]: sample }));
  };

  return (
    <div className="drum-machine-ui p-6 bg-[#1a1a1a] rounded-xl border border-neutral-800 text-white">
      <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Drum Pad Mapper</h3>
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
