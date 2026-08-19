import React, { useState, useMemo, useEffect } from 'react';
import { Database, Play, Download, Clipboard, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { MUSIC_LIBRARY, MusicTrack } from '../data/musicLibrary';
import { audioEngine } from '../utils/audioEngine';
import { analyzeMusic } from '../utils/audioAnalyzer';
import { SemanticSampleSearch } from './SemanticSampleSearch';
import { Scratchpad } from './Scratchpad';

const ITEMS_PER_PAGE = 9;

export function LibraryTerminal() {
  const { samples, addSample } = useSamples();
  const [category, setCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredSamples = useMemo(() => 
    samples.filter(sample => category === 'all' || sample.category === category),
    [samples, category]
  );

  const totalPages = Math.max(1, Math.ceil(filteredSamples.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSamples = filteredSamples.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handleCopy = (sample: AudioSample) => {
    navigator.clipboard.writeText(JSON.stringify(sample, null, 2));
  };

  const handleDragStart = (e: React.DragEvent, sample: AudioSample) => {
    e.dataTransfer.setData('application/json', JSON.stringify(sample));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // --- Automatische Musik-Analyse (BPM/Key, offline) ---
  const [analysis, setAnalysis] = useState<Record<string, { bpm?: number; key?: string }>>({});
  useEffect(() => {
    if (category !== 'music') return;
    let cancelled = false;
    MUSIC_LIBRARY.forEach((t) => {
      analyzeMusic(t.url).then((a) => {
        if (cancelled || !a) return;
        setAnalysis((prev) => ({ ...prev, [t.url]: { bpm: a.bpm, key: a.key } }));
      });
    });
    return () => { cancelled = true; };
  }, [category]);

  return (
    <div className="w-full h-full flex flex-col bg-[#111] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-fuchsia-900/20 to-[#111] border-b border-fuchsia-900/30 gap-4">
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
            onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
            }}
        >
            <option value="all">All Categories</option>
            <option value="bass">Bass</option>
            <option value="mids">Mids</option>
            <option value="highs">Highs</option>
            <option value="music">🎵 Musik</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {category === 'music' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MUSIC_LIBRARY.map((t: MusicTrack) => (
              <div key={t.id} className="bg-[#161616] border border-neutral-800 rounded-lg p-4 flex flex-col gap-2 hover:border-amber-500/50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                    <div>
                      <h4 className="font-bold text-sm text-neutral-200 line-clamp-1">{t.name}</h4>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">{t.artist}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => audioEngine.previewSample('channel5', undefined, t.url)}
                    className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center hover:bg-amber-600 transition-colors"
                  >
                    <Play className="w-4 h-4 text-neutral-400 hover:text-white fill-current" />
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 font-mono">Track aus deiner Musik-Bibliothek</p>
                <div className="flex gap-3 text-[9px] font-mono">
                  <span className="flex items-center gap-1"><span className="text-amber-500">BPM</span>
                    {analysis[t.url]?.bpm ?? <span className="text-neutral-600 animate-pulse">…</span>}
                  </span>
                  <span className="flex items-center gap-1"><span className="text-amber-500">KEY</span>
                    {analysis[t.url]?.key ?? <span className="text-neutral-600">--</span>}
                  </span>
                </div>
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="text-[9px] font-mono text-neutral-600 bg-black px-2 py-1 rounded truncate">{t.url}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => audioEngine.previewSample('channel5', undefined, t.url)}
                      className="text-[10px] font-bold text-neutral-400 hover:text-white"
                    >LOAD</button>
                    <button
                      title="In Mischpult-Kanal legen (Kanal 1)"
                      className="text-[10px] font-bold text-neutral-400 hover:text-amber-300"
                    >ADD</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedSamples.map((sample: AudioSample) => (
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
        )}
      </div>

      {/* Pagination Controls */}
      <div className="px-6 py-4 bg-[#111] border-t border-neutral-800 flex justify-between items-center">
        <div className="text-[10px] text-neutral-500 font-mono">
            {category === 'music'
              ? `SHOWING ${MUSIC_LIBRARY.length} MUSIC TRACKS`
              : `SHOWING ${paginatedSamples.length} OF ${filteredSamples.length} SAMPLES`}
        </div>
        <div className="flex items-center gap-4">
            {category !== 'music' && (<>
            <button 
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1 rounded ${currentPage === 1 ? 'text-neutral-700' : 'text-fuchsia-400 hover:bg-fuchsia-900/20'}`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold font-mono">
                PAGE <span className="text-fuchsia-400">{currentPage}</span> / {totalPages}
            </span>
            <button 
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1 rounded ${currentPage === totalPages ? 'text-neutral-700' : 'text-fuchsia-400 hover:bg-fuchsia-900/20'}`}
            >
                <ChevronRight className="w-5 h-5" />
            </button>
            </>)}
        </div>
      </div>
    </div>
  );
}
