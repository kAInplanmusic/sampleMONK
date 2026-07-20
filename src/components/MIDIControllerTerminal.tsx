import React, { useState } from 'react';
import { Keyboard, Activity, Link2, RefreshCw, Cpu, Layers } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';

export function MIDIControllerTerminal() {
  const [activeProfile, setActiveProfile] = useState('APC40');
  const [isConnected, setIsConnected] = useState(true);
  const [padMappings, setPadMappings] = useState<Record<number, AudioSample>>({});
  
  const profiles = [
    { id: 'APC40', name: 'AKAI APC40 MKII', type: 'Clip Launcher' },
    { id: 'PUSH2', name: 'ABLETON PUSH 2', type: 'Production Controller' },
    { id: 'LAUNCHPAD', name: 'NOVATION LAUNCHPAD', type: 'Grid Controller' },
    { id: 'KOMPLETE', name: 'NI KOMPLETE KONTROL', type: 'Keyboard' },
  ];

  const handleSampleDrop = (sample: AudioSample, padIndex: number) => {
    setPadMappings(prev => ({ ...prev, [padIndex]: sample }));
    console.log(`Sample ${sample.name} mapped to pad ${padIndex + 1}`);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl relative">
      
      {/* ... (Existing Header) */}

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left: Profiles */}
        <div className="w-1/3 flex flex-col gap-4">
           {/* ... (Existing Hardware Selector) */}
        </div>
        
        {/* Right: Hardware Mirror */}
        <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 shadow-inner flex flex-col relative overflow-hidden">
           
           {/* ... (Existing status) */}
           
           {activeProfile === 'APC40' && (
             <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in duration-500">
                <div className="flex justify-between px-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                      {/* Encoder */}
                      <div className="w-10 h-10 rounded-full border-4 border-[#111] bg-neutral-800 relative shadow-lg">
                        <div className={`absolute top-1 left-1/2 w-1 h-2 -translate-x-1/2 rounded-full ${i === 2 ? 'bg-pink-400' : 'bg-neutral-500'}`}></div>
                      </div>
                      {/* Grid Buttons as DropTargets */}
                      <div className="flex flex-col gap-1">
                        {[...Array(5)].map((_, j) => {
                          const padIndex = i * 5 + j;
                          return (
                            <DropTarget 
                                key={j}
                                label=""
                                onDrop={(sample) => handleSampleDrop(sample, padIndex)}
                                className={`w-8 h-4 rounded border ${padMappings[padIndex] ? 'bg-pink-500 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-[#111] border-neutral-800'}`}
                            >
                                <div className="text-[6px] text-center truncate">{padMappings[padIndex]?.name}</div>
                            </DropTarget>
                          );
                        })}
                      </div>
                      {/* Fader */}
                      <div className="h-32 w-4 bg-black rounded-full border-2 border-neutral-800 flex justify-center relative p-0.5">
                        <div className="w-6 h-8 bg-[#333] border border-neutral-700 rounded absolute shadow-md" style={{ bottom: `${Math.random() * 80 + 10}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {/* ... (Master Fader) */}
                </div>
             </div>
           )}
           
           {/* ... (Empty state) */}
        </div>

      </div>
    </div>
  );
}
