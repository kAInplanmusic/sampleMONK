import React, { useState, useEffect } from 'react';
import { Sliders, Monitor, Headphones } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

// ... (RoutingEntry)

interface RoutingEntry {
  channel: number;
  source: string;
  type: string;
  color: string;
  volume: number; // 0 to 1
  pan: number; // -1 to 1 (Stereo)
}

export function MischpultTerminal() {
  const { setSelectedSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('mischpult', 'ACTIVE');
  const [channels, setChannels] = useState<RoutingEntry[]>(
    Array.from({ length: 10 }, (_, i) => ({
      channel: i,
      source: `CH ${i + 1}`,
      type: 'Input',
      color: 'bg-blue-500',
      volume: 0.8,
      pan: 0
    }))
  );

  const updateChannel = (channel: number, updates: Partial<RoutingEntry>) => {
    setChannels(prev => prev.map(ch => ch.channel === channel ? { ...ch, ...updates } : ch));
  };

  // ... (channelSamples logic)

  // Header update to show state
  return (
    <div className={`w-full h-full flex flex-col bg-[#1a1a1a] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-black tracking-widest uppercase">PRO-MIX 9000</h2>
        </div>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>
      // ... (rest of the component)

      {/* Mixer Matrix */}
      <div className="flex-1 p-6 flex gap-4 bg-[#111]">
        {channels.map((ch: RoutingEntry) => (
          <div 
            key={ch.channel} 
            className="flex-1 flex flex-col bg-[#161616] rounded-md border border-neutral-800 p-2"
          >
            <div className={`w-full h-2 ${ch.color} rounded-t-sm mb-2`} />
            <span className="text-[9px] font-black text-neutral-400 text-center uppercase truncate">{ch.source}</span>
            
            {/* Fader */}
            <div className="flex-1 flex justify-center bg-[#080808] rounded-sm border border-neutral-900 relative my-2">
                <input 
                    type="range" 
                    orient="vertical" 
                    min="0" max="1" step="0.01" 
                    value={ch.volume}
                    onChange={(e) => updateChannel(ch.channel, { volume: parseFloat(e.target.value) })}
                    className="w-2 appearance-none h-full bg-neutral-800 rounded-sm accent-blue-500" 
                />
            </div>
            
            {/* Pan */}
            <input 
                type="range" 
                min="-1" max="1" step="0.1" 
                value={ch.pan}
                onChange={(e) => updateChannel(ch.channel, { pan: parseFloat(e.target.value) })}
                className="w-full accent-neutral-500 h-1" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
