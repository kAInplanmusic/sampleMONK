import React, { useState, useEffect } from 'react';
import { Music, Piano, Guitar, Layers, Loader2 } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

// --- WAM2 / Instrument Standards ---
type InstrumentType = 'sampler' | 'synth' | 'soundfont';

interface Instrument {
  id: number;
  name: string;
  category: string;
  type: InstrumentType;
}

const INSTRUMENT_CATEGORIES = [
  { name: 'Tasteninstrumente', icon: Piano },
  { name: 'Streichinstrumente', icon: Music },
  { name: 'Zupfinstrumente', icon: Guitar },
  { name: 'Blasinstrumente', icon: Music },
  { name: 'Weltmusik & Chor', icon: Layers }
];

export function InstrumentsTerminal() {
  const { state, lockStatus, updateState } = usePluginState('instruments', 'ACTIVE');
  const [activeCategory, setActiveCategory] = useState('Tasteninstrumente');
  const [search, setSearch] = useState('');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [masterEngine, setMasterEngine] = useState<any>(null);

  // New state to hold dropped sample
  const [droppedSample, setDroppedSample] = useState<AudioSample | null>(null);

  const handleSampleDrop = (sample: AudioSample) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setDroppedSample(sample);
    console.log('Sample assigned to instrument slot:', sample.name);
    // Add logic to load sample into engine
  };

  useEffect(() => {
    fetch('/data/instruments.json')
      .then(res => res.json())
      .then(async data => {
        setInstruments(data.instruments);
        setActiveInstrument(data.instruments[0]);
        
        // Master-Engine dynamisch laden
        const { default: Engine } = await import(data.masterEngineUrl);
        setMasterEngine(new Engine(new AudioContext()));
      })
      .catch(err => console.error("Failed to load instruments registry", err));
  }, []);

  const loadInstrument = async (inst: Instrument) => {
    if (!masterEngine) return;
    setIsLoading(true);
    setActiveInstrument(inst);
    
    try {
      await masterEngine.loadInstrument(inst.id);
      console.log('Instrument loaded successfully via MasterEngine:', inst.name);
    } catch (error) {
      console.error(`Failed to load instrument: ${inst.name}`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = instruments.filter(inst => {
    if (activeCategory !== 'Tasteninstrumente' && inst.category !== activeCategory) return false;
    if (search && !inst.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className={`w-full h-full flex flex-col bg-[#161616] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} text-neutral-300 font-sans shadow-2xl ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-900/20 to-[#161616] border-b border-purple-900/30">
        <h2 className="text-xl font-black uppercase flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          Instruments <span className="text-[10px] font-mono text-purple-400 border border-purple-500/30 px-2 rounded">WAM 2.0</span>
        </h2>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r border-neutral-800 bg-[#111] p-4 flex flex-col">
            <input 
                placeholder="Search..." 
                className="w-full bg-[#1a1a1a] border border-neutral-800 rounded p-2 text-sm mb-4"
                onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2 mb-4">
                {INSTRUMENT_CATEGORIES.map(cat => (
                    <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className={`p-2 rounded border text-xs ${activeCategory === cat.name ? 'bg-purple-900/40 border-purple-500' : 'bg-[#1a1a1a] border-neutral-800'}`}>
                        {cat.name}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto">
                {filtered.map(inst => (
                    <button key={inst.id} onClick={() => loadInstrument(inst)} className={`w-full p-2 text-left text-sm ${activeInstrument?.id === inst.id ? 'text-purple-300 bg-purple-900/20' : ''}`}>
                        {inst.name}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex-1 p-8 flex flex-col items-center justify-center gap-4">
            <DropTarget 
                label="Drop Sample to Slot"
                onDrop={handleSampleDrop}
                className="w-full h-64 flex flex-col items-center justify-center"
            >
                {isLoading ? <Loader2 className="w-12 h-12 animate-spin text-purple-500" /> : 
                <div className="text-center font-black">
                    {droppedSample ? `${droppedSample.name} LOADED` : 'DROP SAMPLE HERE'}
                </div>}
            </DropTarget>
        </div>
      </div>
    </div>
  );
}
