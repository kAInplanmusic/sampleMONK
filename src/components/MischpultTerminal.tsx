import React, { useState } from 'react';
import { Sliders, Volume2, Mic, Headphones, Settings, Disc } from 'lucide-react';

export function MischpultTerminal() {
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');
  const channels = [1, 2, 3, 4, 5];

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Sliders className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Mischpult <span className="text-[10px] font-mono text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-sm">PRO-MIX 9000</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">10-Channel Professional DJ Mixer Engine</p>
          </div>
        </div>

        <div className="flex bg-[#0c0c0e] rounded-md p-1 border border-neutral-800">
          <button 
            onClick={() => setActiveDeck('A')}
            className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${activeDeck === 'A' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            DECK A
          </button>
          <button 
            onClick={() => setActiveDeck('B')}
            className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${activeDeck === 'B' ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            DECK B
          </button>
        </div>
      </div>

      {/* Mixer Body */}
      <div className="flex-1 p-6 flex gap-4 overflow-x-auto bg-[#111]">
        
        {/* Master Section Left */}
        <div className="w-24 flex flex-col gap-4 border-r border-neutral-800 pr-4">
          <div className="text-center">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-2">Mic / Aux</span>
            <div className="w-12 h-12 rounded-full border-4 border-neutral-800 bg-neutral-900 mx-auto relative cursor-pointer group">
              <div className="absolute top-2 left-1/2 w-1 h-3 bg-white -translate-x-1/2 rounded-full group-hover:bg-blue-400 transition-colors"></div>
            </div>
          </div>
          <div className="flex-1 flex justify-center py-4">
            <div className="w-8 bg-[#0a0a0a] rounded-sm border border-neutral-800 flex justify-center p-1 relative shadow-inner">
               <div className="w-6 h-12 bg-neutral-800 rounded-sm absolute top-4 border-t-2 border-white shadow-lg cursor-ns-resize"></div>
            </div>
          </div>
        </div>

        {/* Channels */}
        {channels.map((ch) => (
          <div key={ch} className="flex-1 min-w-[80px] max-w-[120px] flex flex-col bg-[#161616] rounded-md border border-neutral-800/50 p-2 relative">
            <div className="text-center pb-2 border-b border-neutral-800/50 mb-3">
              <span className="text-[10px] font-black text-neutral-600">CH {ch}</span>
            </div>

            {/* EQ Section */}
            <div className="flex flex-col gap-5 items-center mb-6">
              {['HI', 'MID', 'LOW'].map(eq => (
                <div key={eq} className="flex flex-col items-center">
                  <span className="text-[8px] font-bold text-neutral-500 mb-1">{eq}</span>
                  <div className="w-10 h-10 rounded-full border-[3px] border-neutral-800 bg-neutral-900 relative cursor-pointer group shadow-sm">
                    <div className="absolute top-1 left-1/2 w-0.5 h-2 bg-neutral-300 -translate-x-1/2 rounded-full group-hover:bg-white transition-colors"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Color FX */}
            <div className="flex flex-col items-center mb-6">
              <span className="text-[8px] font-bold text-blue-500/80 mb-1 tracking-widest">COLOR</span>
              <div className="w-12 h-12 rounded-full border-[3px] border-blue-900/30 bg-neutral-900 relative cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                <div className="absolute top-1.5 left-1/2 w-0.5 h-2.5 bg-blue-500 -translate-x-1/2 rounded-full"></div>
              </div>
            </div>

            {/* Cue Button */}
            <button className="w-full py-1.5 mb-4 rounded bg-neutral-800/50 border border-neutral-700 text-[9px] font-bold text-neutral-500 hover:bg-neutral-700 hover:text-white transition-colors">
              CUE
            </button>

            {/* Volume Fader */}
            <div className="flex-1 min-h-[150px] flex justify-center py-2 relative">
              <div className="w-8 h-full bg-[#080808] rounded-sm border border-neutral-900 flex justify-center p-1 relative shadow-inner">
                 {/* Track marks */}
                 <div className="absolute inset-y-0 left-0 w-full flex flex-col justify-between py-2 pointer-events-none px-1">
                   {[1,2,3,4,5,6,7,8,9,10].map(i => (
                     <div key={i} className="w-full flex justify-between">
                       <div className="w-1.5 h-px bg-neutral-800"></div>
                       <div className="w-1.5 h-px bg-neutral-800"></div>
                     </div>
                   ))}
                 </div>
                 {/* Fader Cap */}
                 <div className="w-6 h-10 bg-neutral-800 rounded-sm absolute bottom-4 border-b-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] cursor-ns-resize hover:bg-neutral-700 transition-colors z-10 flex flex-col justify-center items-center gap-0.5">
                   <div className="w-4 h-px bg-neutral-600"></div>
                   <div className="w-4 h-px bg-neutral-600"></div>
                 </div>
              </div>
            </div>
            
            {/* Crossfader Assign */}
            <div className="mt-3 flex justify-between px-2 text-[9px] font-bold text-neutral-600">
              <button className="hover:text-amber-500">A</button>
              <button className="hover:text-neutral-300">THRU</button>
              <button className="hover:text-amber-500">B</button>
            </div>
          </div>
        ))}

        {/* Master Section Right */}
        <div className="w-32 flex flex-col gap-4 border-l border-neutral-800 pl-4">
          <div className="bg-[#0a0a0a] rounded p-2 border border-neutral-800 flex justify-center gap-1">
            {/* VU Meters */}
            <div className="flex gap-1 h-32">
              <div className="w-2 bg-neutral-900 flex flex-col-reverse gap-0.5 overflow-hidden rounded-sm p-0.5">
                {[...Array(15)].map((_, i) => (
                   <div key={i} className={`w-full h-full ${i > 12 ? 'bg-red-500' : i > 9 ? 'bg-amber-500' : 'bg-emerald-500'} opacity-${Math.random() > 0.3 ? '100 shadow-[0_0_5px_currentColor]' : '20'}`}></div>
                ))}
              </div>
              <div className="w-2 bg-neutral-900 flex flex-col-reverse gap-0.5 overflow-hidden rounded-sm p-0.5">
                {[...Array(15)].map((_, i) => (
                   <div key={i} className={`w-full h-full ${i > 12 ? 'bg-red-500' : i > 9 ? 'bg-amber-500' : 'bg-emerald-500'} opacity-${Math.random() > 0.3 ? '100 shadow-[0_0_5px_currentColor]' : '20'}`}></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-2">
            <span className="text-[10px] font-black text-neutral-400 block mb-2 uppercase">Master</span>
            <div className="w-14 h-14 rounded-full border-4 border-neutral-800 bg-neutral-900 mx-auto relative cursor-pointer shadow-xl">
              <div className="absolute top-2 left-1/2 w-1 h-3 bg-white -translate-x-1/2 rounded-full"></div>
            </div>
          </div>
        </div>

      </div>

      {/* Crossfader Section */}
      <div className="h-24 bg-[#161616] border-t border-neutral-800 p-4 flex justify-center items-center">
        <div className="w-2/3 h-10 bg-[#080808] rounded-sm border border-neutral-900 p-1 relative shadow-inner">
           {/* Crossfader Cap */}
           <div className="w-12 h-8 bg-neutral-800 rounded-sm absolute left-1/2 -translate-x-1/2 top-1 border-r-2 border-l-2 border-neutral-600 shadow-[0_4px_10px_rgba(0,0,0,0.5)] cursor-ew-resize hover:bg-neutral-700 transition-colors z-10 flex justify-center items-center gap-1">
              <div className="w-px h-5 bg-white"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
