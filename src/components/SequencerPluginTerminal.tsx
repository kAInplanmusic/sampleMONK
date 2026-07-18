import React, { useState } from 'react';
import { Play, Pause, Square, Power, Settings, Circle, Plus, Minus, Menu, LayoutGrid, Maximize2, MoveDiagonal, ChevronRight, ChevronLeft, Hexagon } from 'lucide-react';
import { TrackType, TrackPreset } from '../types';

interface SequencerProps {
  isPlaying: boolean;
  currentStep: number;
  tracks: TrackPreset['patterns'];
  synthNotes: number[];
  onToggleStep: (track: TrackType, stepIndex: number) => void;
  onSynthNoteChange: (stepIndex: number, noteIndex: number) => void;
  bpm: number;
  setBpm: (b: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

export function SequencerPluginTerminal(props: SequencerProps) {
  const [activeModel, setActiveModel] = useState<'oxi' | 'hapax' | 'deluge'>('oxi');

  return (
    <section className="bg-[#0c0c0e] p-5 rounded-xl border border-neutral-800/80 shadow-xl flex-1 flex flex-col gap-6 overflow-hidden">
      {/* Terminal Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-sky-400" /> Plugin Terminal VST
          </h3>
          <span className="text-[10px] font-mono text-neutral-500 mt-0.5 block">
            Hardware Step Sequencer Emulation Engine
          </span>
        </div>
        
        {/* Model Selector */}
        <div className="flex items-center gap-1 bg-[#050508] p-1 rounded-lg border border-neutral-800">
          <button 
            onClick={() => setActiveModel('oxi')}
            className={`px-4 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all ${activeModel === 'oxi' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            OXI ONE
          </button>
          <button 
            onClick={() => setActiveModel('hapax')}
            className={`px-4 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all ${activeModel === 'hapax' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            SQUARP HAPAX
          </button>
          <button 
            onClick={() => setActiveModel('deluge')}
            className={`px-4 py-2 text-[10px] font-mono font-bold uppercase rounded transition-all ${activeModel === 'deluge' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            DELUGE
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 flex flex-col bg-[#050508] border border-neutral-800 rounded-xl overflow-hidden relative group shadow-2xl min-h-[500px]">
        {activeModel === 'oxi' && <OxiOneModel {...props} />}
        {activeModel === 'hapax' && <SquarpHapaxModel {...props} />}
        {activeModel === 'deluge' && <DelugeModel {...props} />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------
// OXI ONE MKII NOSTALGIA EMULATION
// ---------------------------------------------------------
function OxiOneModel({ isPlaying, currentStep, tracks, onToggleStep, bpm, setBpm, onPlay, onStop }: SequencerProps) {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-[#0e0e11] text-neutral-300 relative shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      {/* Top Panel - Screen & Encoders */}
      <div className="flex flex-wrap gap-8 mb-8 items-center border-b border-neutral-800/50 pb-6 justify-between">
        
        {/* OLED Screen */}
        <div className="w-56 h-24 bg-black border-[3px] border-[#1a1a1f] rounded p-2 flex flex-col justify-between font-mono text-[9px] shadow-[inset_0_0_15px_rgba(255,255,255,0.05)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_2px] pointer-events-none"></div>
          <div className="flex justify-between text-neutral-400 font-bold uppercase">
            <span>MULTITRACK</span>
            <span>{bpm} BPM</span>
          </div>
          <div className="text-center text-white text-base tracking-widest mt-1 font-bold filter drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
            PATTERN A1
          </div>
          <div className="flex justify-between text-neutral-500 font-bold">
            <span>LEN: 16</span>
            <span>DIV: 1/16</span>
            <span className={isPlaying ? 'text-white' : ''}>{isPlaying ? '▶ PLAYING' : '■ STOPPED'}</span>
          </div>
        </div>

        {/* 4 Push Encoders */}
        <div className="flex gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2a2a30] to-[#111115] border-2 border-[#3a3a42] shadow-[0_5px_15px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform relative group">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tl from-[#1a1a1f] to-[#2a2a30] flex items-center justify-center shadow-inner relative">
                   <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neutral-900 group-hover:bg-white transition-colors"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Play/Rec Buttons */}
        <div className="flex gap-2">
          <button className="w-10 h-8 rounded bg-[#2a2a30] border-b-[3px] border-black active:border-b-0 active:translate-y-[3px] transition-all flex items-center justify-center shadow-md">
            <Circle className="w-4 h-4 text-red-500" />
          </button>
          <button onClick={onStop} className="w-12 h-8 rounded bg-[#2a2a30] border-b-[3px] border-black active:border-b-0 active:translate-y-[3px] transition-all flex items-center justify-center shadow-md">
            <Square className="w-4 h-4 text-white fill-current" />
          </button>
          <button onClick={isPlaying ? onStop : onPlay} className={`w-14 h-8 rounded bg-[#2a2a30] border-b-[3px] border-black active:border-b-0 active:translate-y-[3px] transition-all flex items-center justify-center shadow-md ${isPlaying ? 'bg-[#3a3a42] shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}`}>
            <Play className={`w-4 h-4 ${isPlaying ? 'text-green-400 fill-current' : 'text-white fill-current'}`} />
          </button>
        </div>
      </div>

      {/* Main Grid & Side Buttons */}
      <div className="flex flex-1 gap-6 justify-center">
        {/* Left Side Buttons (Modes) */}
        <div className="flex flex-col gap-2.5 mt-2">
          {['Mono', 'Poly', 'Chord', 'Multi', 'Stoch', 'Matric', 'LFOs', 'Setup'].map((btn) => (
            <button key={btn} className={`w-16 py-2 text-[9px] font-mono font-bold text-center rounded border transition-all ${btn === 'Multi' ? 'text-white bg-[#2a2a30] border-neutral-500 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-neutral-500 border-transparent hover:bg-[#1a1a1f]'}`}>
              {btn}
            </button>
          ))}
        </div>

        {/* 16x8 Pad Matrix */}
        <div className="bg-[#15151a] p-5 rounded-xl border-2 border-[#1a1a1f] shadow-[inset_0_5px_20px_rgba(0,0,0,0.8)] grid grid-rows-8 gap-2">
          {/* We map the 4 tracks to the first 4 rows, and dummy the remaining 4 rows */}
          {(['kick', 'hat', 'clap', 'synth', 'snare', 'tom', 'perc', 'bass'] as TrackType[]).map((trackKey, rowIndex) => (
            <div key={trackKey} className="grid grid-cols-16 gap-2">
              {tracks[trackKey].map((isActive, colIndex) => {
                const isCurrent = currentStep === colIndex && isPlaying;
                const colors = ['bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]', 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]', 'bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)]', 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]', 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]', 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]', 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]', 'bg-lime-500 shadow-[0_0_15px_rgba(132,204,22,0.6)]'];
                const activeClass = isActive ? colors[rowIndex] : 'bg-[#2a2a30] hover:bg-[#3a3a42]';
                const currentClass = isCurrent ? 'ring-2 ring-white scale-90 z-10' : '';
                return (
                  <button
                    key={colIndex}
                    onClick={() => onToggleStep(trackKey, colIndex)}
                    className={`w-10 h-10 rounded-sm border-b-[3px] border-black/60 transition-all duration-75 ${activeClass} ${currentClass}`}
                  />
                );
              })}
            </div>
          ))}
          
          {/* Dummy Rows 5-8 */}
          {[4, 5, 6, 7].map(rowIndex => (
            <div key={rowIndex} className="grid grid-cols-16 gap-2 opacity-50">
              {[...Array(16)].map((_, colIndex) => {
                const isCurrent = currentStep === colIndex && isPlaying;
                return (
                  <div key={colIndex} className={`w-10 h-10 rounded-sm bg-[#1a1a1f] border-b-[3px] border-black/60 ${isCurrent ? 'bg-[#2a2a30] ring-1 ring-white/30' : ''}`} />
                );
              })}
            </div>
          ))}
        </div>

        {/* Right Side Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          {['Undo', 'Redo', 'Copy', 'Paste', 'Clear', 'Rand', 'Euclid', 'Save'].map((btn) => (
            <button key={btn} className="w-16 py-2 text-[9px] font-mono font-bold text-center rounded bg-[#1a1a1f] border-b-2 border-black active:border-b-0 active:translate-y-[2px] text-neutral-400 hover:text-white transition-all shadow-md">
              {btn}
            </button>
          ))}
        </div>
      </div>
      
      {/* Branding */}
      <div className="absolute bottom-6 left-8 flex items-end gap-3">
        <div className="text-neutral-500 font-bold tracking-[0.3em] font-sans text-xl">OXI ONE</div>
        <div className="text-[9px] font-mono text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded mb-1 bg-black/50">mkII NOSTALGIA</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// SQUARP HAPAX EMULATION
// ---------------------------------------------------------
function SquarpHapaxModel({ isPlaying, currentStep, tracks, onToggleStep, bpm, onPlay, onStop }: SequencerProps) {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-[#161719] text-neutral-200 relative shadow-[inset_0_0_40px_rgba(0,0,0,1)]">
      {/* Dual Displays & Encoders Container */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Left Screen Area (Project A) */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="h-20 bg-[#0a0a0c] rounded-md p-3 border-2 border-neutral-800 flex justify-between font-mono text-[10px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:100%_2px] pointer-events-none"></div>
            <div className="flex flex-col justify-between z-10">
              <span className="text-amber-500 font-bold uppercase text-xs">Project A <span className="text-white ml-2">► PLAY</span></span>
              <span className="text-neutral-400 font-bold">Track 1: Drum Rack</span>
            </div>
            <div className="flex flex-col justify-between text-right z-10">
               <span className="text-neutral-500">{bpm} BPM</span>
               <span className="text-emerald-400">SYNC: INT</span>
            </div>
          </div>
          {/* Encoders L */}
          <div className="flex justify-between px-4">
             {[1,2,3,4].map(i => (
               <div key={i} className="w-10 h-10 rounded-full bg-[#111] border-[3px] border-neutral-800 flex items-center justify-center shadow-lg relative group cursor-pointer hover:border-neutral-600 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-[#222] shadow-inner"></div>
               </div>
             ))}
          </div>
        </div>

        {/* Right Screen Area (Project B) */}
        <div className="flex-1 flex flex-col gap-3 opacity-60 hover:opacity-100 transition-opacity">
          <div className="h-20 bg-[#0a0a0c] rounded-md p-3 border-2 border-neutral-800 flex justify-between font-mono text-[10px] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:100%_2px] pointer-events-none"></div>
            <div className="flex flex-col justify-between z-10">
              <span className="text-neutral-500 font-bold uppercase text-xs">Project B <span className="text-neutral-600 ml-2">■ STOP</span></span>
              <span className="text-neutral-600 font-bold">Track 9: Polymeter Lead</span>
            </div>
            <div className="flex flex-col justify-between text-right z-10">
               <span className="text-neutral-600">{bpm} BPM</span>
               <span className="text-neutral-600">SYNC: EXT</span>
            </div>
          </div>
          {/* Encoders R */}
          <div className="flex justify-between px-4">
             {[5,6,7,8].map(i => (
               <div key={i} className="w-10 h-10 rounded-full bg-[#111] border-[3px] border-neutral-800 flex items-center justify-center shadow-lg relative group cursor-pointer hover:border-neutral-600 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-[#222] shadow-inner"></div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Play Controls & UI */}
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-lg bg-red-950/40 border-2 border-red-900/50 flex items-center justify-center hover:bg-red-900/60 transition">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
          </button>
          <button onClick={onStop} className="w-10 h-10 rounded-lg bg-[#222] border-2 border-neutral-700 flex items-center justify-center hover:bg-[#333] transition">
             <Square className="w-4 h-4 text-white fill-current" />
          </button>
          <button onClick={isPlaying ? onStop : onPlay} className={`w-14 h-10 rounded-lg bg-[#222] border-2 flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'border-neutral-700 hover:bg-[#333]'}`}>
             <Play className={`w-5 h-5 ${isPlaying ? 'text-amber-400 fill-current' : 'text-white fill-current'}`} />
          </button>
        </div>
        <div className="font-mono tracking-[0.4em] text-neutral-500 font-bold text-xl flex items-center gap-4">
          HAPAX <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] tracking-normal rounded border border-amber-500/30">V2.0</span>
        </div>
      </div>

      {/* Hapax Main Pad Grid */}
      <div className="flex-1 flex gap-4 justify-center">
        {/* Left Side (Project A) - Mapped to our 4 tracks */}
        <div className="bg-[#111] p-4 rounded-2xl border-2 border-[#1a1b1e] shadow-[0_10px_30px_rgba(0,0,0,0.5)] grid grid-rows-8 gap-2">
           {(['kick', 'hat', 'clap', 'synth', 'snare', 'tom', 'perc', 'bass'] as TrackType[]).map((trackKey, rowIndex) => (
            <div key={trackKey} className="grid grid-cols-16 gap-2">
              {tracks[trackKey].map((isActive, colIndex) => {
                const isCurrent = currentStep === colIndex && isPlaying;
                // Hapax often uses bright distinct pastel/neon colors on black pads
                const colors = ['bg-[#f43f5e] shadow-[0_0_15px_rgba(244,63,94,0.6)]', 'bg-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.6)]', 'bg-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.6)]', 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.6)]', 'bg-[#ec4899] shadow-[0_0_15px_rgba(236,72,153,0.6)]', 'bg-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.6)]', 'bg-[#06b6d4] shadow-[0_0_15px_rgba(6,182,212,0.6)]', 'bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.6)]'];
                const activeClass = isActive ? colors[rowIndex] : 'bg-[#1a1b1e] hover:bg-[#25262a]';
                const currentClass = isCurrent ? 'ring-2 ring-white bg-white/20 z-10' : '';
                return (
                  <button
                    key={colIndex}
                    onClick={() => onToggleStep(trackKey, colIndex)}
                    className={`w-10 h-10 rounded shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)] transition-colors duration-75 ${activeClass} ${currentClass}`}
                  />
                );
              })}
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// SYNTHSTROM DELUGE EMULATION
// ---------------------------------------------------------
function DelugeModel({ isPlaying, currentStep, tracks, onToggleStep, bpm, onPlay, onStop }: SequencerProps) {
  return (
    <div className="flex-1 flex border-x-[20px] border-[#3e2311] bg-[#1a1a1a] text-neutral-300 relative shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
      
      <div className="flex-1 flex flex-col p-4 sm:p-6 pb-8">
        
        {/* Top Controls */}
        <div className="flex justify-between items-end mb-6">
          <div className="flex flex-col gap-6">
             {/* 4 Digit 7-Segment Display */}
             <div className="bg-[#2a0505] border-[3px] border-[#111] rounded p-2.5 inline-flex shadow-inner">
                <span className="font-mono text-[#ff2a2a] font-bold text-3xl tracking-[0.2em] filter drop-shadow-[0_0_12px_rgba(255,42,42,0.9)]">
                  {bpm.toString().padStart(3, '0')}
                </span>
             </div>
             
             {/* Small circular buttons row */}
             <div className="flex gap-3">
               {['SYNTH', 'KIT', 'CV', 'MIDI', 'SONG'].map((btn, i) => (
                 <div key={btn} className="flex flex-col items-center gap-1.5">
                   <button className={`w-6 h-6 rounded-full border-2 shadow-[0_2px_5px_rgba(0,0,0,0.5)] transition ${i === 1 ? 'bg-[#ff2a2a] border-[#ff2a2a] shadow-[0_0_10px_rgba(255,42,42,0.5)]' : 'bg-[#111] border-[#333] hover:bg-[#222]'}`}></button>
                   <span className="text-[7px] font-mono text-neutral-400 font-bold tracking-wider">{btn}</span>
                 </div>
               ))}
             </div>
          </div>
          
          <div className="flex flex-col items-center mb-2">
            <span className="font-sans font-black text-2xl tracking-[0.3em] text-neutral-600/50">DELUGE</span>
          </div>

          {/* Main Gold Encoders */}
          <div className="flex gap-8">
            {['SELECT', 'TEMPO'].map(enc => (
              <div key={enc} className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f3e5ab] via-[#d4af37] to-[#8a7322] border-2 border-[#111] flex items-center justify-center shadow-[0_5px_15px_rgba(0,0,0,0.6)] cursor-pointer hover:rotate-12 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-[#111] shadow-inner flex items-center justify-center">
                       <div className="w-1 h-3 bg-[#d4af37] rounded-full absolute top-2"></div>
                    </div>
                 </div>
                 <span className="text-[9px] font-mono text-neutral-400 font-bold tracking-widest">{enc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* The Massive Deluge Grid (16x8 densely packed) */}
        <div className="flex-1 bg-black p-3 rounded-lg flex gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-[#222] justify-center mx-auto">
          
          {/* Left Function Buttons */}
          <div className="w-10 flex flex-col justify-between py-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <button className="w-8 h-5 rounded-sm bg-[#222] border-b-2 border-black active:border-b-0 active:translate-y-[2px] transition-all"></button>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-rows-8 gap-1">
            {(['kick', 'hat', 'clap', 'synth', 'snare', 'tom', 'perc', 'bass'] as TrackType[]).map((trackKey, rowIndex) => (
              <div key={trackKey} className="grid grid-cols-16 gap-1">
                {tracks[trackKey].map((isActive, colIndex) => {
                  const isCurrent = currentStep === colIndex && isPlaying;
                  // Deluge uses very bright full pad colors filling the square
                  const colors = ['bg-[#ff0055]', 'bg-[#00ff88]', 'bg-[#00aaff]', 'bg-[#ffaa00]', 'bg-[#ff00aa]', 'bg-[#aaff00]', 'bg-[#00ffff]', 'bg-[#8800ff]'];
                  const activeClass = isActive ? colors[rowIndex] : 'bg-[#1a1a1a] hover:bg-[#333]';
                  const currentClass = isCurrent ? 'ring-2 ring-white z-10 brightness-150' : '';
                  return (
                    <button
                      key={colIndex}
                      onClick={() => onToggleStep(trackKey, colIndex)}
                      className={`w-9 h-9 rounded-[3px] transition-all duration-75 ${activeClass} ${currentClass}`}
                      style={{
                        boxShadow: isActive ? 'inset 0 0 15px rgba(255,255,255,0.6), 0 0 10px currentColor' : 'inset 0 0 5px rgba(0,0,0,0.8)'
                      }}
                    />
                  );
                })}
              </div>
            ))}

          </div>
          
          {/* Right Function Buttons */}
          <div className="w-10 flex flex-col justify-between py-1">
            <button onClick={onPlay} className={`w-8 h-5 rounded-sm border-b-2 transition-all ${isPlaying ? 'bg-[#00ff88] border-black shadow-[0_0_10px_#00ff88]' : 'bg-[#222] border-black active:border-b-0 active:translate-y-[2px]'}`}></button>
            <button onClick={onStop} className="w-8 h-5 rounded-sm bg-[#222] border-b-2 border-black active:border-b-0 active:translate-y-[2px] transition-all"></button>
            {[...Array(6)].map((_, i) => (
              <div key={i+2} className="flex flex-col items-center gap-1 opacity-50">
                <button className="w-8 h-5 rounded-sm bg-[#222] border-b-2 border-black active:border-b-0 active:translate-y-[2px] transition-all"></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

