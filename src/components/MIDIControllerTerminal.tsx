import React, { useState } from 'react';
import { Keyboard, Activity, Link2, RefreshCw, Cpu, Layers } from 'lucide-react';

export function MIDIControllerTerminal() {
  const [activeProfile, setActiveProfile] = useState('APC40');
  const [isConnected, setIsConnected] = useState(true);
  
  const profiles = [
    { id: 'APC40', name: 'AKAI APC40 MKII', type: 'Clip Launcher' },
    { id: 'PUSH2', name: 'ABLETON PUSH 2', type: 'Production Controller' },
    { id: 'LAUNCHPAD', name: 'NOVATION LAUNCHPAD', type: 'Grid Controller' },
    { id: 'KOMPLETE', name: 'NI KOMPLETE KONTROL', type: 'Keyboard' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#111] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-900/20 to-[#111] border-b border-pink-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Keyboard className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              MIDI Control <span className="text-[10px] font-mono text-pink-400 border border-pink-500/30 px-2 py-0.5 rounded-sm">HARDWARE LINK</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">Plug & Play Surface Mirroring</p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded border flex items-center gap-2 text-xs font-bold tracking-widest ${isConnected ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400' : 'bg-red-900/20 border-red-500/50 text-red-400'}`}>
          {isConnected ? <Link2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          {isConnected ? 'USB SYNCED' : 'DISCONNECTED'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left: Profiles */}
        <div className="w-1/3 flex flex-col gap-4">
           <h3 className="font-bold text-sm tracking-widest uppercase text-neutral-400 flex items-center gap-2">
             <Cpu className="w-4 h-4 text-pink-500" /> MAPPED HARDWARE
           </h3>
           
           <div className="flex flex-col gap-3">
             {profiles.map(p => (
               <button
                 key={p.id}
                 onClick={() => setActiveProfile(p.id)}
                 className={`p-4 rounded-xl border flex flex-col items-start transition-all ${activeProfile === p.id ? 'bg-pink-900/20 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'bg-[#1a1a1a] border-neutral-800 hover:bg-[#222]'}`}
               >
                 <span className={`text-sm font-black tracking-widest ${activeProfile === p.id ? 'text-pink-400' : 'text-neutral-300'}`}>{p.name}</span>
                 <span className="text-[10px] font-mono text-neutral-500 mt-1 uppercase">{p.type}</span>
               </button>
             ))}
           </div>
           
           <div className="mt-auto">
             <button className="w-full py-3 bg-[#222] hover:bg-[#333] border border-neutral-700 rounded text-xs font-bold tracking-widest text-neutral-400 flex items-center justify-center gap-2 transition-colors">
               <RefreshCw className="w-4 h-4" /> RESCAN USB PORTS
             </button>
           </div>
        </div>
        
        {/* Right: Hardware Mirror */}
        <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 shadow-inner flex flex-col relative overflow-hidden">
           
           <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
              <span className="text-[10px] font-mono text-pink-500">MIDI IN/OUT RX/TX</span>
           </div>
           
           {activeProfile === 'APC40' && (
             <div className="flex-1 flex flex-col justify-center gap-6 animate-in fade-in duration-500">
                {/* 8 Channels of encoders + faders */}
                <div className="flex justify-between px-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-4">
                      {/* Encoder */}
                      <div className="w-10 h-10 rounded-full border-4 border-[#111] bg-neutral-800 relative shadow-lg">
                        <div className={`absolute top-1 left-1/2 w-1 h-2 -translate-x-1/2 rounded-full ${i === 2 ? 'bg-pink-400' : 'bg-neutral-500'}`}></div>
                      </div>
                      {/* Grid Buttons */}
                      <div className="flex flex-col gap-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className={`w-8 h-4 rounded border ${Math.random() > 0.7 ? 'bg-pink-500 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : Math.random() > 0.5 ? 'bg-amber-500 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-[#111] border-neutral-800'}`}></div>
                        ))}
                      </div>
                      {/* Fader */}
                      <div className="h-32 w-4 bg-black rounded-full border-2 border-neutral-800 flex justify-center relative p-0.5">
                        <div className="w-6 h-8 bg-[#333] border border-neutral-700 rounded absolute shadow-md" style={{ bottom: `${Math.random() * 80 + 10}%` }}></div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Master Fader */}
                  <div className="flex flex-col items-center gap-4 border-l border-neutral-800 pl-8 ml-4">
                     <div className="w-10 h-10"></div>
                     <div className="flex flex-col gap-1">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="w-8 h-4 rounded border bg-[#111] border-neutral-800 opacity-50"></div>
                        ))}
                     </div>
                     <div className="h-32 w-4 bg-black rounded-full border-2 border-neutral-800 flex justify-center relative p-0.5">
                        <div className="w-6 h-8 bg-red-900 border border-red-500 rounded absolute shadow-md" style={{ bottom: '80%' }}></div>
                     </div>
                  </div>
                </div>
             </div>
           )}
           
           {activeProfile !== 'APC40' && (
             <div className="flex-1 flex flex-col items-center justify-center opacity-30 animate-in fade-in duration-500">
               <Layers className="w-24 h-24 mb-6 text-neutral-600" />
               <p className="text-lg font-black tracking-widest text-neutral-400">HARDWARE TEMPLATE LOADING</p>
               <p className="text-xs font-mono text-neutral-500 mt-2">Syncing parameter feedback...</p>
             </div>
           )}

        </div>

      </div>
    </div>
  );
}
