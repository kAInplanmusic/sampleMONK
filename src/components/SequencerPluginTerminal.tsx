import React, { useState, useEffect } from 'react';
import { Play, Square, Circle, LayoutGrid, Zap, Clock } from 'lucide-react';
import { TrackType, TrackPreset } from '../types';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';
import { generateRhythmicPattern } from '../utils/aiRhythmGenerator';

interface SequencerProps {
  isPlaying: boolean;
  currentStep: number;
  tracks: TrackPreset['patterns'];
  bpm: number;
  setBpm: (b: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onToggleStep: (track: TrackType, stepIndex: number) => void;
}

import { SampleModuleWrapper } from './SampleModuleWrapper';

// ... (other imports)

export const SequencerPluginTerminal = React.memo(function SequencerPluginTerminal(props: SequencerProps) {
  const { setSelectedSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('sequencer', 'ACTIVE');
  
  // ... (rest of code before return)
  
  return (
    <SampleModuleWrapper onSelect={setSelectedSample}>
        <section className={`bg-[#050508] p-5 rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800/80'} shadow-xl flex flex-col gap-4 ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>

        {/* Taktmaschine Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <h3 className="text-sm font-mono text-neutral-300 font-bold tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> SEQUENCER MONK
            </h3>

            <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
                <option value="OFF">OFF</option>
                <option value="AI_CONTROLLED">AI</option>
                <option value="ACTIVE">ACTIVE</option>
            </select>

            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase">BPM</span>
                    <input type="number" value={props.bpm} onChange={e => props.setBpm(Number(e.target.value))} className="w-16 bg-neutral-900 border border-neutral-800 rounded text-center text-sm" />
                </div>
            </div>
        </div>

        {/* Grid als reine Rhythmus-Matrix */}
        <div className="bg-[#0c0c0e] p-4 rounded-lg border border-neutral-800/50">
            {channels.map((trackKey) => (
            <div 
                key={trackKey} 
                className="mb-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, trackKey)}
            >
                <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase mb-1">
                    <span>{trackKey} : {trackSamples[trackKey]?.name || '...'}</span>
                </div>
                <div className="grid grid-cols-16 gap-1">
                {props.tracks[trackKey as TrackType].map((isActive, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-1 items-center">
                        <button
                            onClick={() => props.onToggleStep(trackKey as TrackType, colIndex)}
                            className={`w-8 h-8 rounded-sm ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-neutral-900'} ${props.currentStep === colIndex && props.isPlaying ? 'ring-2 ring-white' : ''}`}
                        />
                        {state === 'PRO' && isActive && (
                            <input 
                                type="range" min="0" max="1" step="0.1" defaultValue="1"
                                className="w-8 h-1 accent-emerald-500"
                            />
                        )}
                    </div>
                ))}
                </div>
            </div>
            ))}
        </div>
        </section>
    </SampleModuleWrapper>
  );
});
