import React, { useState, useEffect } from 'react';
import { Sliders, Monitor, Headphones } from 'lucide-react';

interface RoutingEntry {
  source: string;
  channel: number;
  color: string;
  type: string;
}

export function MischpultTerminal() {
  const [channels, setChannels] = useState<RoutingEntry[]>([]);

  useEffect(() => {
    fetch('/data/routing.json')
      .then(res => res.json())
      .then(data => {
        setChannels(data.routing);
      })
      .catch(err => console.error("Failed to load routing", err));
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a] rounded-xl border border-neutral-800 text-neutral-300 font-sans shadow-2xl relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-black tracking-widest uppercase">PRO-MIX 9000</h2>
        </div>
      </div>

      {/* Mixer Matrix */}
      <div className="flex-1 p-6 flex gap-4 bg-[#111]">
        {channels.map((ch: RoutingEntry) => (
          <div key={ch.channel} className="flex-1 flex flex-col bg-[#161616] rounded-md border border-neutral-800 p-2">
            <div className={`w-full h-2 ${ch.color} rounded-t-sm mb-2`} />
            <span className="text-[9px] font-black text-neutral-400 text-center uppercase truncate">{ch.source}</span>
            <span className="text-[8px] text-neutral-600 text-center mb-2">{ch.type}</span>
            
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
