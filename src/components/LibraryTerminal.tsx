import React, { useState } from 'react';
import { Database, Play, Download, Clipboard, GripVertical } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { SemanticSampleSearch } from './SemanticSampleSearch';
import { Scratchpad } from './Scratchpad';

export function LibraryTerminal() {
  const { samples, addSample } = useSamples();
  const [category, setCategory] = useState<string>('all');

  const filteredSamples = samples.filter(sample => {
    const matchesCategory = category === 'all' || sample.category === category;
    return matchesCategory;
  });

  const handleCopy = (sample: AudioSample) => {
    navigator.clipboard.writeText(JSON.stringify(sample));
  };

  const handleDragStart = (e: React.DragEvent, sample: AudioSample) => {
    e.dataTransfer.setData('application/json', JSON.stringify(sample));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#111] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-fuchsia-900/20 to-[#111] border-b border-fuchsia-900/30 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/50 shadow-[0_0_15px_rgba(192,38,211,0.3)]">
            <Database className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase">Sample Library</h2>
        </div>
        
        <div className="flex items-center gap-2 flex-1 max-w-sm">
            <SemanticSampleSearch onSelect={addSample} />
            <Scratchpad />
        </div>

        <select 
            className="bg-[#1a1a1a] border border-neutral-800 rounded-lg px-4 py-2 text-sm focus:outline-none"
            onChange={(e) => setCategory(e.target.value)}
        >
            <option value="all">All Categories</option>
            <option value="bass">Bass</option>
            <option value="mids">Mids</option>
            <option value="highs">Highs</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSamples.map((sample: AudioSample) => (
            <div 
              key={sample.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, sample)}
              className="bg-[#161616] border border-neutral-800 rounded-lg p-4 flex flex-col gap-2 hover:border-fuchsia-500/50 transition-colors group cursor-grab active:cursor-grabbing"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-neutral-700 group-hover:text-fuchsia-500" />
                  <div>
                    <h4 className="font-bold text-sm text-neutral-200">{sample.name}</h4>
                    <span className="text-[10px] font-mono text-fuchsia-400 uppercase">{sample.type}</span>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center hover:bg-fuchsia-600 transition-colors">
                  <Play className="w-4 h-4 text-neutral-400 hover:text-white fill-current" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono line-clamp-2">{sample.description}</p>
              <div className="mt-auto pt-4 flex justify-between items-center">
                <span className="text-[9px] font-mono text-neutral-600 bg-black px-2 py-1 rounded">ID: {sample.id}</span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleCopy(sample)}
                        className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-fuchsia-300"
                    >
                        <Clipboard className="w-3 h-3" /> COPY
                    </button>
                    <button className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-white">
                        <Download className="w-3 h-3" /> ADD
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
