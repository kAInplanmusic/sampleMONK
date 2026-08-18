import React, { useState, useEffect } from 'react';
import { Music, Piano, Guitar, Layers, Loader2 } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';
import { audioEngine } from '../utils/audioEngine';

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

const PRESET_INSTRUMENTS: Instrument[] = [
  { id: 1, name: 'Grand Piano', category: 'Tasteninstrumente', type: 'soundfont' },
  { id: 2, name: 'Electric Piano (Rhodes)', category: 'Tasteninstrumente', type: 'sampler' },
  { id: 3, name: 'Organ (Hammond B3)', category: 'Tasteninstrumente', type: 'synth' },
  { id: 4, name: 'Harpsichord', category: 'Tasteninstrumente', type: 'soundfont' },
  { id: 5, name: 'Celesta', category: 'Tasteninstrumente', type: 'soundfont' },
  { id: 6, name: 'Accordion', category: 'Tasteninstrumente', type: 'sampler' },
  { id: 7, name: 'Clavinet', category: 'Tasteninstrumente', type: 'sampler' },
  { id: 8, name: 'Marimba', category: 'Tasteninstrumente', type: 'soundfont' },
  { id: 9, name: 'Vibraphone', category: 'Tasteninstrumente', type: 'soundfont' },
  { id: 10, name: 'Glockenspiel', category: 'Tasteninstrumente', type: 'soundfont' },
  { id: 11, name: 'Violin', category: 'Streichinstrumente', type: 'soundfont' },
  { id: 12, name: 'Viola', category: 'Streichinstrumente', type: 'soundfont' },
  { id: 13, name: 'Cello', category: 'Streichinstrumente', type: 'soundfont' },
  { id: 14, name: 'Contrabass', category: 'Streichinstrumente', type: 'soundfont' },
  { id: 15, name: 'String Ensemble', category: 'Streichinstrumente', type: 'soundfont' },
  { id: 16, name: 'Harp', category: 'Streichinstrumente', type: 'soundfont' },
  { id: 17, name: 'Acoustic Guitar (Nylon)', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 18, name: 'Acoustic Guitar (Steel)', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 19, name: 'Electric Guitar (Clean)', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 20, name: 'Electric Guitar (Overdrive)', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 21, name: 'Electric Bass', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 22, name: 'Banjo', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 23, name: 'Ukulele', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 24, name: 'Mandolin', category: 'Zupfinstrumente', type: 'sampler' },
  { id: 25, name: 'Sitar', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 26, name: 'Trumpet', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 27, name: 'Trombone', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 28, name: 'French Horn', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 29, name: 'Tuba', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 30, name: 'Saxophone (Alto)', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 31, name: 'Saxophone (Tenor)', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 32, name: 'Clarinet', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 33, name: 'Oboe', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 34, name: 'Flute', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 35, name: 'Piccolo', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 36, name: 'Bassoon', category: 'Blasinstrumente', type: 'soundfont' },
  { id: 37, name: 'Harmonica', category: 'Blasinstrumente', type: 'sampler' },
  { id: 38, name: 'Pan Flute', category: 'Weltmusik & Chor', type: 'soundfont' },
  { id: 39, name: 'Shakuhachi', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 40, name: 'Kalimba', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 41, name: 'Didgeridoo', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 42, name: 'Koto', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 43, name: 'Erhu', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 44, name: 'Steel Drum', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 45, name: 'Choir (Aah)', category: 'Weltmusik & Chor', type: 'soundfont' },
  { id: 46, name: 'Choir (Ooh)', category: 'Weltmusik & Chor', type: 'soundfont' },
  { id: 47, name: 'Theremin', category: 'Weltmusik & Chor', type: 'synth' },
  { id: 48, name: 'Bagpipe', category: 'Weltmusik & Chor', type: 'sampler' },
  { id: 49, name: 'Timpani', category: 'Weltmusik & Chor', type: 'soundfont' },
  { id: 50, name: 'Tubular Bells', category: 'Weltmusik & Chor', type: 'soundfont' },
];

export function InstrumentsTerminal() {
  const { state, lockStatus, updateState } = usePluginState('instruments', 'PRO');
  const [activeCategory, setActiveCategory] = useState('Tasteninstrumente');
  const [search, setSearch] = useState('');
  const [instruments] = useState<Instrument[]>(PRESET_INSTRUMENTS);
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [droppedSample, setDroppedSample] = useState<AudioSample | null>(null);

  const handleSampleDrop = (sample: AudioSample) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    setDroppedSample(sample);
    // Tell audioEngine to map this sample to the active instrument slot
    if (sample.url) {
        audioEngine.loadTrackSample('channel1', sample.url); 
    }
  };

  const loadInstrument = async (inst: Instrument) => {
    setIsLoading(true);
    setActiveInstrument(inst);
    
    try {
      await audioEngine.loadInstrument(inst.id);
      // console.log('Routing through instrument:', inst.name);
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
            <option value="AUTO_AI">AI</option>
            <option value="PRO">ACTIVE</option>
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
                className="w-full h-40 flex flex-col items-center justify-center"
            >
                {isLoading ? <Loader2 className="w-12 h-12 animate-spin text-purple-500" /> : 
                <div className="text-center font-black">
                    {droppedSample ? `${droppedSample.name} LOADED` : 'DROP SAMPLE HERE'}
                </div>}
            </DropTarget>

            {/* Physikalisches Instrument-Vorschau-Keyboard (additive Synthese) */}
            <div className="w-full bg-black/40 rounded-lg border border-neutral-800 p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">Vorschau-Keyboard</span>
                    <span className="text-[10px] text-neutral-500 truncate max-w-[60%]">
                        {activeInstrument ? activeInstrument.name : 'kein Instrument'}
                    </span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                    {['C4','D4','E4','F4','G4','A4','B4','C5'].map(note => (
                        <button
                            key={note}
                            onMouseDown={(e) => { e.preventDefault(); audioEngine.instrumentNote(note); }}
                            onMouseUp={() => audioEngine.instrumentRelease()}
                            onMouseLeave={() => audioEngine.instrumentRelease()}
                            className="flex-1 min-w-[28px] h-16 rounded shadow-inner bg-gradient-to-b from-neutral-300 to-neutral-400 text-neutral-900 text-xs font-bold hover:from-neutral-200 active:from-purple-300"
                        >
                            {note}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
