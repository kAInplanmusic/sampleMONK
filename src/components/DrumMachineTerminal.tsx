import React, { useState } from 'react';
import { Speaker, Volume2, Settings, ListMusic, Power, Play } from 'lucide-react';

export function DrumMachineTerminal() {
  const [activeTab, setActiveTab] = useState<'808' | 'M8'>('808');

  return (
    <div className="w-full h-full flex flex-col bg-[#121212] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-yellow-900/20 to-[#121212] border-b border-yellow-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <Speaker className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Drum-Machines <span className="text-[10px] font-mono text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-sm">JUNKET</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">Analog & Digital Hardware Emulation</p>
          </div>
        </div>
        
        <div className="flex bg-[#0c0c0e] rounded-md p-1 border border-neutral-800">
          <button 
            onClick={() => setActiveTab('808')}
            className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${activeTab === '808' ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            TR-808
          </button>
          <button 
            onClick={() => setActiveTab('M8')}
            className={`px-6 py-1.5 rounded text-sm font-bold transition-all ${activeTab === 'M8' ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            DIRTYWAVE M8
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 relative overflow-hidden bg-[#111]">
        {activeTab === '808' && (
           <div className="absolute inset-0 bg-[#151515] p-6 flex flex-col">
             {/* 808 Style Panel */}
             <div className="flex-1 bg-[#222] rounded-xl border border-neutral-700 shadow-inner p-8 flex flex-col">
               <div className="flex justify-between items-start border-b-2 border-orange-600/30 pb-4 mb-8">
                 <div>
                   <h3 className="text-3xl font-black text-white italic tracking-tighter">Rhythm Composer</h3>
                   <span className="text-orange-500 font-bold text-sm tracking-widest uppercase">TR-808 Computer Controlled</span>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-[#111] bg-[#2a2a2a] shadow-xl relative">
                       <div className="absolute top-2 left-1/2 w-1 h-3 bg-white -translate-x-1/2 rounded-full"></div>
                       <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-neutral-400">TEMPO</span>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-[#111] bg-[#2a2a2a] shadow-xl relative">
                       <div className="absolute top-2 left-1/2 w-1 h-3 bg-orange-500 -translate-x-1/2 rounded-full"></div>
                       <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-neutral-400">VOLUME</span>
                    </div>
                 </div>
               </div>
               
               {/* Instruments Knobs */}
               <div className="flex justify-between mb-12">
                 {['BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CB', 'CY', 'OH', 'CH'].map((inst, i) => (
                   <div key={i} className="flex flex-col items-center gap-2">
                     <span className="text-[10px] font-bold text-neutral-400">{inst}</span>
                     <div className="w-10 h-10 rounded-full border-[3px] border-[#111] bg-[#2a2a2a] shadow-sm relative cursor-pointer hover:border-orange-500/50 transition-colors">
                       <div className="absolute top-1 left-1/2 w-0.5 h-2.5 bg-white -translate-x-1/2 rounded-full"></div>
                     </div>
                     <div className="w-8 h-8 rounded-full border-[3px] border-[#111] bg-[#2a2a2a] shadow-sm relative mt-2 cursor-pointer hover:border-orange-500/50 transition-colors">
                       <div className="absolute top-1 left-1/2 w-0.5 h-2 bg-neutral-400 -translate-x-1/2 rounded-full"></div>
                     </div>
                   </div>
                 ))}
               </div>
               
               {/* 16 Step Buttons */}
               <div className="flex justify-between mt-auto">
                 {[...Array(16)].map((_, i) => (
                   <div key={i} className="flex flex-col items-center gap-2">
                     <div className={`w-10 h-12 rounded flex flex-col justify-between p-1 border-b-4 cursor-pointer hover:brightness-125 transition-all
                       ${i < 4 ? 'bg-red-600 border-red-800' : 
                         i < 8 ? 'bg-orange-500 border-orange-700' : 
                         i < 12 ? 'bg-yellow-400 border-yellow-600' : 'bg-white border-neutral-300'}`}
                     >
                       <div className="w-full h-2 bg-black/20 rounded-sm"></div>
                     </div>
                     <span className="text-[10px] font-bold text-neutral-500">{i + 1}</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}
        
        {activeTab === 'M8' && (
           <div className="absolute inset-0 bg-[#0c0c0e] p-6 flex items-center justify-center">
             {/* M8 Tracker Style */}
             <div className="w-[800px] h-[500px] bg-[#1a1a1a] rounded-3xl border-8 border-neutral-800 flex shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
               {/* Screen */}
               <div className="w-[500px] h-full bg-black p-4 font-mono">
                 <div className="w-full h-full border border-emerald-900/30 flex flex-col">
                   <div className="bg-emerald-900/20 text-emerald-500 text-xs py-1 px-2 flex justify-between border-b border-emerald-900/30">
                     <span>SONG 01</span>
                     <span>120 BPM</span>
                     <span>v2.0.4</span>
                   </div>
                   <div className="flex-1 p-2 flex text-sm">
                     <div className="w-12 text-neutral-600 border-r border-neutral-800">
                       {[...Array(16)].map((_, i) => <div key={i}>{i.toString(16).padStart(2, '0').toUpperCase()}</div>)}
                     </div>
                     <div className="flex-1 flex gap-2 pl-2 text-emerald-400">
                        {/* Tracks */}
                        {[1,2,3,4,5,6,7,8].map(track => (
                          <div key={track} className="flex-1 text-center border-r border-neutral-900 last:border-0">
                            <div className="text-emerald-700 font-bold mb-1 border-b border-emerald-900/30">T{track}</div>
                            {[...Array(16)].map((_, i) => (
                              <div key={i} className={i % 4 === 0 ? 'text-emerald-300' : 'text-emerald-600/50'}>
                                {track === 1 && i % 4 === 0 ? 'KIK' : 
                                 track === 2 && i % 4 === 2 ? 'SNA' : 
                                 track === 3 && i % 2 === 0 ? 'HAT' : '---'}
                              </div>
                            ))}
                          </div>
                        ))}
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Controls */}
               <div className="flex-1 p-8 flex flex-col justify-between relative bg-gradient-to-br from-[#222] to-[#111]">
                 <div className="flex justify-end gap-2">
                   <div className="w-8 h-4 rounded-full bg-red-500/20 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                   <div className="w-8 h-4 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
                 </div>
                 
                 <div className="flex justify-center mt-12 relative">
                    <div className="w-24 h-24 rounded-full bg-neutral-800 border-4 border-neutral-900 shadow-inner relative flex items-center justify-center">
                       <div className="absolute top-1 w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 cursor-pointer shadow-md"></div>
                       <div className="absolute bottom-1 w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 cursor-pointer shadow-md"></div>
                       <div className="absolute left-1 w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 cursor-pointer shadow-md"></div>
                       <div className="absolute right-1 w-6 h-6 rounded bg-neutral-700 hover:bg-neutral-600 cursor-pointer shadow-md"></div>
                       <div className="w-8 h-8 rounded-full bg-neutral-900 shadow-lg cursor-pointer z-10 border border-neutral-700"></div>
                    </div>
                 </div>
                 
                 <div className="flex justify-between mt-auto px-4">
                   <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-full bg-[#1a1a2e] border-2 border-[#2a2a4e] text-blue-400 flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-[#2a2a4e] transition-colors shadow-lg">OPT</div>
                     <div className="w-12 h-12 rounded-full bg-[#1a1a2e] border-2 border-[#2a2a4e] text-blue-400 flex items-center justify-center font-bold text-[10px] cursor-pointer hover:bg-[#2a2a4e] transition-colors shadow-lg">EDIT</div>
                   </div>
                   <div className="flex gap-4">
                     <div className="w-12 h-12 rounded-full bg-[#2e1a1a] border-2 border-[#4e2a2a] text-red-400 flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-[#4e2a2a] transition-colors shadow-lg">B</div>
                     <div className="w-12 h-12 rounded-full bg-[#1a2e1a] border-2 border-[#2a4e2a] text-emerald-400 flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-[#2a4e2a] transition-colors shadow-lg">A</div>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}
