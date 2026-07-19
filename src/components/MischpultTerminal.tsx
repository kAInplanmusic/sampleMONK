import React, { useState, useEffect } from 'react';
import { Sliders, Volume2, Monitor, Headphones } from 'lucide-react';

// Zentrale Audio-Konfiguration für Web Audio API
interface MixerChannel {
  id: number;
  gainNode: GainNode;
  monitorNode: GainNode; // Routing zu Monitor-Kopfhörern
  isMonitoring: boolean;
}

interface RoutingEntry {
  source: string;
  channel: number;
  color: string;
  type: string;
}

export function MischpultTerminal() {
  const [monitorMode, setMonitorMode] = useState<'master' | 'monitor'>('master');
  const [channels, setChannels] = useState<any[]>([]);

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
      {/* ... Header bleibt ... */}
      
      {/* Mixer Matrix */}
      <div className="flex-1 p-6 flex gap-4 bg-[#111]">
        {channels.map((ch: RoutingEntry) => (
          <div key={ch.channel} className="flex-1 flex flex-col bg-[#161616] rounded-md border border-neutral-800 p-2">
            <div className={`w-full h-2 ${ch.color} rounded-t-sm mb-2`} />
            <span className="text-[9px] font-black text-neutral-400 text-center uppercase truncate">{ch.source}</span>
            <span className="text-[8px] text-neutral-600 text-center mb-2">{ch.type}</span>
            
            {/* ... Fader/Controls ... */}
          </div>
        ))}
      </div>
    </div>
  );
}
