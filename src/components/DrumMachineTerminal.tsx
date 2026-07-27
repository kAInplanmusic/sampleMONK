import React, { useState } from 'react';
import { useSamples } from '../context/SampleContext';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';
import { audioEngine } from '../utils/audioEngine';
import { SampleModuleWrapper } from './SampleModuleWrapper';

export const DrumMachineTerminal: React.FC = React.memo(() => {
  const { addSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('drum', 'ACTIVE');
  const [padSamples, setPadSamples] = useState<Record<number, AudioSample>>({});
  const [activeKit, setActiveKit] = useState('TR-808');

  const kits = ['TR-909', 'TR-8', 'MPC-60', '808-Classic', 'Elektro-Box', 'BoomBap-HipHop', 'Lo-Fi M8'];

  const handleKitChange = React.useCallback((kit: string) => {
    setActiveKit(kit);
    audioEngine.setDrumKit(kit);
    // console.log(`Loaded Drum Engine: ${kit}`);
  }, []);

  const handleSampleDrop = React.useCallback((sample: AudioSample, index: number) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setPadSamples(prev => ({ ...prev, [index]: sample }));
  }, [lockStatus.active, lockStatus.lockedBy]);

  return (
    <SampleModuleWrapper onSelect={addSample}>
      <div className={`drum-machine-ui p-6 bg-[#1a1a1a] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-white ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
        <div className="flex justify-between items-center mb-6 gap-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Drum Engine: {activeKit}</h3>
          
          <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
              <option value="OFF">OFF</option>
              <option value="AI_CONTROLLED">AI</option>
              <option value="ACTIVE">ACTIVE</option>
          </select>
        </div>

        <div className="flex gap-2 mb-6">
          {kits.map(kit => (
              <button key={kit} onClick={() => handleKitChange(kit)} className={`px-4 py-2 rounded text-xs font-bold ${activeKit === kit ? 'bg-fuchsia-600' : 'bg-neutral-800'}`}>
                  {kit}
              </button>
          ))}
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
    </SampleModuleWrapper>
  );
});
