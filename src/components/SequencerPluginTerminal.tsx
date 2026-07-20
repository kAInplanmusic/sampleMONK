import React, { useState } from 'react';
import { Play, Square, Circle, LayoutGrid, Zap, Clock } from 'lucide-react';
import { TrackType, TrackPreset } from '../types';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

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

export function SequencerPluginTerminal(props: SequencerProps) {
  const { setSelectedSample } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('sequencer', 'ACTIVE');
  const [trackSamples, setTrackSamples] = useState<Record<TrackType, AudioSample | null>>({
    kick: null, hat: null, clap: null, snare: null
  });

  const handleDrop = (e: React.DragEvent, track: TrackType) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      setTrackSamples(prev => ({ ...prev, [track]: data }));
      setSelectedSample(data);
    } catch (err) {
      console.error("Invalid sample dropped", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <section className={`bg-[#050508] p-5 rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800/80'} shadow-xl flex flex-col gap-4 ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>

      {/* Taktmaschine Header */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
        <h3 className="text-sm font-mono text-neutral-300 font-bold tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> MASTER CLOCK ENGINE
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
//...
      {/* Grid als reine Rhythmus-Matrix */}
      <div className="bg-[#0c0c0e] p-4 rounded-lg border border-neutral-800/50">
        {(['kick', 'hat', 'clap', 'snare'] as TrackType[]).map((trackKey) => (
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
              {props.tracks[trackKey].map((isActive, colIndex) => (
                <button
                  key={colIndex}
                  onClick={() => props.onToggleStep(trackKey, colIndex)}
                  className={`w-8 h-8 rounded-sm ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-neutral-900'} ${props.currentStep === colIndex && props.isPlaying ? 'ring-2 ring-white' : ''}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
