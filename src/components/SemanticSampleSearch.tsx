import React, { useState, useMemo } from 'react';
import { Search, Filter, Database } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';

interface SemanticSampleSearchProps {
  onSelect: (sample: AudioSample) => void;
  filterType?: string;
}

export const SemanticSampleSearch: React.FC<SemanticSampleSearchProps> = ({ onSelect, filterType }) => {
  const { samples } = useSamples();
  const [query, setQuery] = useState('');

  const filteredSamples = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return samples.filter(s => 
      (s.name.toLowerCase().includes(q) || 
       s.tags.some(t => t.toLowerCase().includes(q)) ||
       s.type.toLowerCase().includes(q) ||
       s.id.toLowerCase().includes(q)) &&
      (!filterType || s.type === filterType)
    );
  }, [query, samples, filterType]);

  return (
    <div className="relative w-full z-50">
      <div className="flex items-center gap-2 bg-[#1a1a1a] border border-neutral-800 rounded-lg p-2 focus-within:border-fuchsia-500 transition-colors">
        <Search className="w-4 h-4 text-neutral-500" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche: Name, ID, Tag, Typ..."
          className="bg-transparent text-xs text-white placeholder-neutral-600 outline-none w-full font-mono"
        />
        <Filter className="w-3 h-3 text-neutral-600" />
      </div>
      
      {query && (
        <div className="absolute top-full mt-2 w-full bg-[#111] border border-neutral-800 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
          {filteredSamples.length > 0 ? (
            filteredSamples.map(s => (
              <button 
                key={s.id} 
                onClick={() => { onSelect(s); setQuery(''); }}
                className="w-full text-left px-4 py-2 hover:bg-fuchsia-900/20 text-[10px] font-mono text-neutral-300 border-b border-neutral-800 last:border-0"
              >
                <span className="text-fuchsia-400">[{s.type}]</span> {s.name} <span className="text-neutral-600">({s.id})</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-[10px] text-neutral-600 italic">Keine Ergebnisse gefunden...</div>
          )}
        </div>
      )}
    </div>
  );
};
