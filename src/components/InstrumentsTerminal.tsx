import React, { useState } from 'react';
import { Music, Search, Play, Sliders, Hash, Square } from 'lucide-react';

const INSTRUMENT_CATEGORIES = ['All', 'Keys', 'Strings', 'Brass', 'Woodwind', 'Percussion', 'Synths'];

const generateInstruments = () => {
  const instruments = [];
  const keys = ['Grand Piano', 'Upright Piano', 'Electric Piano', 'Clavinet', 'Harpsichord', 'Celesta', 'Pipe Organ', 'Tonewheel Organ'];
  const strings = ['Violin', 'Viola', 'Cello', 'Contrabass', 'Acoustic Guitar', 'Electric Guitar', 'Harp', 'Banjo', 'Mandolin', 'Sitar'];
  const brass = ['Trumpet', 'Trombone', 'French Horn', 'Tuba', 'Flugelhorn', 'Cornet'];
  const woodwind = ['Flute', 'Clarinet', 'Oboe', 'Bassoon', 'Saxophone', 'Piccolo', 'English Horn', 'Recorder'];
  const percussion = ['Timpani', 'Marimba', 'Xylophone', 'Vibraphone', 'Glockenspiel', 'Tubular Bells', 'Steel Drum', 'Taiko', 'Congas'];
  const synths = ['Theremin', 'Saw Lead', 'Square Bass', 'FM Pad', 'Wavetable Choirs', 'Analog Strings', 'Sub Bass', 'Acid 303', 'Pluck'];

  let id = 1;
  const addList = (list: string[], cat: string) => {
    list.forEach(name => {
      instruments.push({ id: id++, name, category: cat, polyphony: Math.floor(Math.random() * 32) + 8 });
    });
  };

  addList(keys, 'Keys');
  addList(strings, 'Strings');
  addList(brass, 'Brass');
  addList(woodwind, 'Woodwind');
  addList(percussion, 'Percussion');
  addList(synths, 'Synths');

  return instruments;
};

const MOCK_INSTRUMENTS = generateInstruments();

export function InstrumentsTerminal() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeInstrument, setActiveInstrument] = useState(MOCK_INSTRUMENTS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const filtered = MOCK_INSTRUMENTS.filter(inst => {
    if (activeCategory !== 'All' && inst.category !== activeCategory) return false;
    if (search && !inst.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#161616] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-900/20 to-[#161616] border-b border-purple-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Music className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Instruments <span className="text-[10px] font-mono text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-sm">POOL 50+</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">Acoustically Authentic Sound Generators</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Browser */}
        <div className="w-1/3 border-r border-neutral-800 flex flex-col bg-[#111]">
          <div className="p-4 border-b border-neutral-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search instruments..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-neutral-800 rounded-md py-1.5 pl-9 pr-3 text-sm text-neutral-300 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {INSTRUMENT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                    activeCategory === cat ? 'bg-purple-900/40 border-purple-500/50 text-purple-300' : 'bg-transparent border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-800">
            <div className="flex flex-col gap-1">
              {filtered.map(inst => (
                <button
                  key={inst.id}
                  onClick={() => setActiveInstrument(inst)}
                  className={`flex items-center justify-between p-3 rounded-md transition-all text-left ${
                    activeInstrument.id === inst.id ? 'bg-purple-900/20 border border-purple-500/30' : 'hover:bg-neutral-900 border border-transparent'
                  }`}
                >
                  <div>
                    <div className={`font-bold text-sm ${activeInstrument.id === inst.id ? 'text-purple-300' : 'text-neutral-300'}`}>{inst.name}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest">{inst.category}</div>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded">
                    {inst.polyphony}V
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Content - Instrument UI */}
        <div className="flex-1 flex flex-col p-8 bg-[#161616] relative overflow-hidden">
           
           {/* Decorator */}
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <Hash className="w-96 h-96" />
           </div>

           <div className="flex justify-between items-end mb-12">
             <div>
               <h3 className="text-4xl font-black text-white tracking-tighter mb-2">{activeInstrument.name}</h3>
               <div className="flex items-center gap-4">
                 <span className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-widest rounded">
                   {activeInstrument.category} Engine
                 </span>
                 <span className="text-neutral-500 text-xs font-mono">ACOUSTIC MODEL: V1.4.2</span>
               </div>
             </div>
             
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-95' : 'bg-[#222] border border-neutral-700 text-neutral-400 hover:bg-[#333]'}`}
             >
                {isPlaying ? <Square className="fill-current w-6 h-6" /> : <Play className="fill-current w-6 h-6 ml-1" />}
             </button>
           </div>
           
           {/* Param Controls */}
           <div className="grid grid-cols-4 gap-6 flex-1">
             {/* Envelopes */}
             <div className="col-span-2 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex flex-col">
               <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Amplitude Envelope</h4>
               <div className="flex justify-between flex-1">
                 {['ATTACK', 'DECAY', 'SUSTAIN', 'RELEASE'].map(param => (
                   <div key={param} className="flex flex-col items-center gap-4">
                     <div className="w-12 h-32 bg-[#111] rounded-full border border-neutral-800 p-1 relative flex justify-center shadow-inner">
                        <div className={`w-10 h-10 rounded-full border-2 border-neutral-700 bg-[#222] absolute cursor-ns-resize shadow-md flex items-center justify-center ${param === 'ATTACK' ? 'bottom-2' : param === 'SUSTAIN' ? 'top-10' : 'bottom-12'}`}>
                           <div className="w-4 h-0.5 bg-neutral-500 rounded-full"></div>
                        </div>
                     </div>
                     <span className="text-[10px] font-bold text-neutral-500">{param}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Character */}
             <div className="col-span-2 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex flex-col">
               <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-6">Physical Modeling</h4>
               <div className="flex justify-between flex-1 mt-2">
                 {['TIMBRE', 'TENSION', 'RESONANCE', 'SPACE'].map(param => (
                   <div key={param} className="flex flex-col items-center gap-4">
                     <div className="w-14 h-14 rounded-full border-4 border-[#111] bg-[#222] relative cursor-pointer group shadow-sm">
                        <div className="absolute top-1.5 left-1/2 w-1 h-3 bg-purple-500 -translate-x-1/2 rounded-full group-hover:bg-purple-400 transition-colors"></div>
                     </div>
                     <span className="text-[10px] font-bold text-neutral-500">{param}</span>
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Keyboard visualization */}
             <div className="col-span-4 bg-[#111] rounded-xl border border-neutral-800 h-32 flex p-1 overflow-hidden">
                {[...Array(24)].map((_, i) => {
                  const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
                  return (
                    <div 
                      key={i} 
                      className={`relative flex-1 ${isBlack ? 'bg-neutral-900 border-x border-black h-20 -mx-3 z-10 shadow-lg' : 'bg-neutral-200 border-r border-neutral-300 h-full'}`}
                      style={{ minWidth: isBlack ? '20px' : '30px' }}
                    >
                      {isPlaying && i === 12 && !isBlack && (
                         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                      )}
                    </div>
                  );
                })}
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}
