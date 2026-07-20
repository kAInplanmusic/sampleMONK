import React, { useState, useRef } from 'react';
import { Layers, Upload, Download, Play, Square, Scissors, Database, Loader2, Music, Mic, AudioWaveform, Zap } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

export function StemExtractorTerminal() {
  const { addSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('stem_extractor', 'ACTIVE');
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtracted(false);
    }
  };

  const startExtraction = async () => {
    if (!file || (lockStatus.active && lockStatus.lockedBy !== 'localUser')) return;
    setIsExtracting(true);
    setProgress(0);
    
    try {
      // In a real app, you would upload the file first and get a path.
      // For this implementation, we trigger the endpoint.
      const response = await fetch('http://localhost:8000/api/separate-stems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: file.name }), // This needs proper path handling
      });
      
      const data = await response.json();
      console.log("Stem extraction task triggered:", data.task_id);
      
      // Simulate progress for the UI while Celery processes in background
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setIsExtracting(false);
            setExtracted(true);
            
            // Add extracted stems to library
            ['vocals', 'melody', 'highs', 'mids', 'lows'].forEach(stem => {
                const newSample: AudioSample = {
                    id: `stem-${Date.now()}-${stem}`,
                    name: `${file!.name.split('.')[0]}_${stem}`,
                    category: 'mids',
                    type: 'Stem',
                    description: `Extracted stem from ${file!.name}`,
                    parameters: {}
                };
                addSample(newSample);
            });
            return 100;
          }
          return Math.min(99, p + 2);
        });
      }, 500);
      
    } catch (error) {
      console.error("Extraction failed:", error);
      setIsExtracting(false);
    }
  };

  const stems = [
    { id: 'vocals', name: 'VOCALS', color: 'text-fuchsia-400', bg: 'bg-fuchsia-900/40', border: 'border-fuchsia-500', icon: Mic },
    { id: 'melody', name: 'MELODY', color: 'text-cyan-400', bg: 'bg-cyan-900/40', border: 'border-cyan-500', icon: Music },
    { id: 'highs', name: 'HIGHS', color: 'text-emerald-400', bg: 'bg-emerald-900/40', border: 'border-emerald-500', icon: AudioWaveform },
    { id: 'mids', name: 'MIDS', color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-500', icon: AudioWaveform },
    { id: 'lows', name: 'LOWS / BASS', color: 'text-rose-400', bg: 'bg-rose-900/40', border: 'border-rose-500', icon: Zap },
  ];

  return (
    <div className={`w-full h-full flex flex-col bg-[#111] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-900/20 to-[#111] border-b border-red-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <Layers className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Remix Extractor <span className="text-[10px] font-mono text-red-400 border border-red-500/30 px-2 py-0.5 rounded-sm">AI 5-STEM</span>
            </h2>
          </div>
        </div>
        
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
        
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-[#222] hover:bg-[#333] border border-neutral-700 rounded-md text-xs font-bold transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" /> LOAD TRACK
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleUpload} />
        </div>
      </div>

      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        
        {/* Left Panel: Source File & Extraction Trigger */}
        <div className="w-1/3 flex flex-col gap-4">
           <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
             
             {!file ? (
               <div className="text-center flex flex-col items-center opacity-50">
                 <Upload className="w-16 h-16 text-neutral-600 mb-4" />
                 <p className="text-sm font-bold text-neutral-400 tracking-widest">DRAG & DROP AUDIO</p>
                 <p className="text-xs text-neutral-600 mt-2 font-mono">WAV / MP3 / FLAC</p>
               </div>
             ) : (
               <div className="w-full flex flex-col h-full">
                 <div className="flex items-start gap-4 border-b border-neutral-800 pb-4 mb-4">
                   <div className="w-12 h-12 bg-red-900/30 rounded flex items-center justify-center border border-red-500/30">
                     <Music className="w-6 h-6 text-red-400" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <h4 className="font-bold text-sm truncate text-neutral-200">{file.name}</h4>
                     <p className="text-[10px] text-neutral-500 font-mono mt-1">{(file.size / (1024*1024)).toFixed(2)} MB</p>
                   </div>
                 </div>
                 
                 <div className="flex-1 w-full bg-[#111] rounded border border-neutral-800 relative flex items-center justify-center overflow-hidden p-2">
                    {/* Fake waveform */}
                    <div className="w-full flex items-center gap-[1px] h-12 opacity-30">
                       {[...Array(60)].map((_, i) => (
                         <div key={i} className="flex-1 bg-red-500 rounded-full" style={{ height: `${Math.random() * 100}%` }}></div>
                       ))}
                    </div>
                 </div>
                 
                 <button 
                   onClick={startExtraction}
                   disabled={isExtracting || extracted}
                   className={`mt-6 w-full py-4 rounded-lg font-black tracking-widest flex justify-center items-center gap-3 transition-all ${isExtracting ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : extracted ? 'bg-emerald-900/40 text-emerald-500 border border-emerald-500/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}
                 >
                   {isExtracting ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> EXTRACTING...</>
                   ) : extracted ? (
                     <><Scissors className="w-5 h-5" /> EXTRACTION COMPLETE</>
                   ) : (
                     <><Scissors className="w-5 h-5" /> SPLIT STEMS</>
                   )}
                 </button>
               </div>
             )}
             
             {/* Progress Overlay */}
             {isExtracting && (
               <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-8 backdrop-blur-sm z-10">
                 <div className="text-5xl font-black text-red-500 mb-4 font-mono">{Math.floor(progress)}%</div>
                 <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                   <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" style={{ width: `${progress}%` }}></div>
                 </div>
                 <p className="text-[10px] text-neutral-400 font-mono mt-4 tracking-widest text-center">
                   {progress < 20 ? 'ANALYZING AUDIO...' : progress < 40 ? 'SEPARATING VOCALS...' : progress < 60 ? 'ISOLATING LOW END...' : progress < 80 ? 'EXTRACTING DRUMS...' : 'FINALIZING & AUTO-WARPING...'}
                 </p>
               </div>
             )}
           </div>
           
           <div className="bg-[#1a1a1a] rounded-xl border border-neutral-800 p-4">
             <div className="flex justify-between text-xs text-neutral-500 font-mono mb-2">
               <span>PROJECT BPM:</span>
               <span className="text-red-400">120</span>
             </div>
             <div className="flex justify-between text-xs text-neutral-500 font-mono">
               <span>AUTO-WARP:</span>
               <span className="text-emerald-400">ENABLED</span>
             </div>
           </div>
        </div>
        
        {/* Right Panel: Stems Result */}
        <div className="w-2/3 bg-[#1a1a1a] rounded-xl border border-neutral-800 p-6 flex flex-col relative">
           <h3 className="font-bold text-sm tracking-widest uppercase text-neutral-400 mb-6 flex items-center gap-2">
             <Database className="w-4 h-4 text-neutral-500" /> EXTRACTED CHANNELS
           </h3>
           
           {!extracted ? (
             <div className="flex-1 flex flex-col items-center justify-center opacity-20">
               <Layers className="w-24 h-24 text-neutral-600 mb-4" />
               <p className="font-bold tracking-widest">WAITING FOR AUDIO</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-3">
               {stems.map((stem, i) => (
                 <div key={stem.id} className={`flex-1 ${stem.bg} border ${stem.border} rounded-lg flex items-center px-4 animate-in fade-in slide-in-from-right-8 duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
                   
                   <div className="flex items-center gap-4 w-40 border-r border-neutral-800/50 pr-4">
                     <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors">
                       <Play className={`w-4 h-4 ${stem.color} fill-current ml-0.5`} />
                     </button>
                     <div>
                       <div className={`text-xs font-bold tracking-widest ${stem.color}`}>{stem.name}</div>
                       <div className="text-[9px] text-neutral-500 font-mono">READY</div>
                     </div>
                   </div>
                   
                   <div className="flex-1 px-4 flex items-center">
                      <div className="w-full flex items-center gap-[1px] h-8 opacity-70">
                         {[...Array(80)].map((_, j) => (
                           <div key={j} className={`flex-1 ${stem.color.replace('text-', 'bg-')} rounded-full`} style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="w-32 flex justify-end gap-2 pl-4 border-l border-neutral-800/50">
                     <button className="px-3 py-1.5 bg-black/40 hover:bg-black/60 rounded text-[10px] font-bold text-neutral-300 transition-colors">
                       M
                     </button>
                     <button className="px-3 py-1.5 bg-black/40 hover:bg-black/60 rounded text-[10px] font-bold text-neutral-300 transition-colors">
                       S
                     </button>
                     <button className="px-3 py-1.5 bg-black/40 hover:bg-black/60 rounded text-[10px] font-bold text-neutral-300 flex items-center gap-1 transition-colors">
                       <Download className="w-3 h-3" /> LIB
                     </button>
                   </div>
                   
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
