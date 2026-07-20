import React, { useState, useEffect } from 'react';
import { Sliders, Monitor, Headphones } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

// ... (RoutingEntry)

export function MischpultTerminal() {
  const { setSelectedSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('ACTIVE');
  const [channels, setChannels] = useState<RoutingEntry[]>([]);
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
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, ch.channel)}
            className="flex-1 flex flex-col bg-[#161616] rounded-md border border-neutral-800 p-2"
          >
            <div className={`w-full h-2 ${ch.color} rounded-t-sm mb-2`} />
            <span className="text-[9px] font-black text-neutral-400 text-center uppercase truncate">{ch.source}</span>
            <span className="text-[8px] text-neutral-600 text-center mb-1 h-3 truncate">
                {channelSamples[ch.channel]?.name || ch.type}
            </span>
            
            {/* Fader */}
            <div className="flex-1 flex justify-center bg-[#080808] rounded-sm border border-neutral-900 relative">
                <input type="range" orient="vertical" className="w-2 appearance-none h-full bg-neutral-800 rounded-sm accent-blue-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
