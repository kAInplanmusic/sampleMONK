import React, { useState, useEffect } from 'react';
import { 
  Sliders, Grid3X3, Database, Speaker, Music, Box, Waves, Activity, Keyboard, 
  Sparkles, Layers, Mic, Cpu, Radio, Puzzle, Play, Pause, Square
} from 'lucide-react';
import { audioEngine } from './utils/audioEngine';
import { BeatVisualizer } from './components/BeatVisualizer';
import { MischpultTerminal } from './components/MischpultTerminal';
import { SequencerPluginTerminal } from './components/SequencerPluginTerminal';
import { DrumMachineTerminal } from './components/DrumMachineTerminal';
import { InstrumentsTerminal } from './components/InstrumentsTerminal';
import { FXEngineTerminal } from './components/FXEngineTerminal';
import { StemExtractorTerminal } from './components/StemExtractorTerminal';
import { VoiceGenTerminal } from './components/VoiceGenTerminal';
import { SpatialPluginTerminal } from './components/SpatialPluginTerminal';
import { EQPluginTerminal } from './components/EQPluginTerminal';
import { MIDIControllerTerminal } from './components/MIDIControllerTerminal';
import { RecorderTerminal } from './components/RecorderTerminal';
import { DSPTerminal } from './components/DSPTerminal';
import { CustomSlotTerminal } from './components/CustomSlotTerminal';
import { MasteringOverlay } from './components/MasteringOverlay';
import { HypergraphVisualizer } from './components/HypergraphVisualizer';
import { LibraryTerminal } from './components/LibraryTerminal';
import { TECHNO_PRESETS } from './presets';
import { TrackType, MUSIC_SCALES } from './types';

const PLUGIN_REGISTRY = [
  { id: 'mischpult', name: 'Mischpult', short: 'MIX', color: 'blue', icon: Sliders, component: MischpultTerminal },
  { id: 'sequencer', name: 'Sequenzer', short: 'SEQ', color: 'amber', icon: Grid3X3, component: SequencerPluginTerminal },
  { id: 'sample_db', name: 'Library', short: 'LIB', color: 'fuchsia', icon: Database, component: LibraryTerminal },
  { id: 'drum_machines', name: 'Drum-Machines', short: 'DRM', color: 'yellow', icon: Speaker, component: DrumMachineTerminal },
  { id: 'instruments', name: 'Instrumenten', short: 'INS', color: 'purple', icon: Music, component: InstrumentsTerminal },
  { id: 'spatial', name: 'Spatial Audio', short: '3D', color: 'lime', icon: Box, component: SpatialPluginTerminal },
  { id: 'eq', name: 'Equalizer', short: 'EQ', color: 'teal', icon: Waves, component: EQPluginTerminal },
  { id: 'mastering', name: 'Mastering', short: 'MST', color: 'emerald', icon: Activity, component: MasteringOverlay },
  { id: 'midi', name: 'MIDI Ctrl', short: 'MID', color: 'pink', icon: Keyboard, component: MIDIControllerTerminal },
  { id: 'dj_fx', name: 'Effektmaschine', short: 'FX', color: 'rose', icon: Sparkles, component: FXEngineTerminal },
  { id: 'stem_extractor', name: 'Remix Extractor', short: 'RMX', color: 'red', icon: Layers, component: StemExtractorTerminal },
  { id: 'voice_gen', name: 'Voice Gen', short: 'VOX', color: 'orange', icon: Mic, component: VoiceGenTerminal },
  { id: 'ai_terminal', name: 'Critic-Agent', short: 'EMCS', color: 'cyan', icon: Cpu, component: HypergraphVisualizer },
  { id: 'recorder', name: 'Master Recorder', short: 'REC', color: 'indigo', icon: Radio, component: RecorderTerminal },
  { id: 'dsp', name: 'Digital Signal Processor', short: 'DSP', color: 'violet', icon: Activity, component: DSPTerminal },
  { id: 'custom_slot', name: 'Custom Sandbox', short: 'CUS', color: 'sky', icon: Puzzle, component: CustomSlotTerminal },
];

export default function App() {
  const [activePlugins, setActivePlugins] = useState<Set<string>>(new Set(['midi', 'sample_db']));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(128);
  const [patterns, setPatterns] = useState(TECHNO_PRESETS[0].patterns);
  const [synthNotes, setSynthNotes] = useState(TECHNO_PRESETS[0].synthNotes);

  useEffect(() => {
    audioEngine.setOnBeatCallback((step) => {
      setCurrentStep(step);
    });
    return () => {
      audioEngine.dispose();
    };
  }, []);

  useEffect(() => {
    audioEngine.setPatterns(patterns);
    audioEngine.setSynthNotes(synthNotes);
    audioEngine.setBpm(bpm);
  }, [patterns, synthNotes, bpm]);

  const handleToggleStep = (track: TrackType, stepIndex: number) => {
    setPatterns(prev => {
      const nextArr = [...prev[track]];
      nextArr[stepIndex] = !nextArr[stepIndex];
      return { ...prev, [track]: nextArr };
    });
  };

  const handlePlay = async () => {
    await audioEngine.play();
    setIsPlaying(true);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const togglePlugin = (id: string) => {
    if (id === 'mischpult') return; // Mischpult is persistent
    setActivePlugins(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderActivePlugins = () => {
    return PLUGIN_REGISTRY
      .filter(p => p.id !== 'mischpult' && activePlugins.has(p.id))
      .map(plugin => {
        const Component = plugin.component;
        
        // Special case for sequencer to pass props
        if (plugin.id === 'sequencer') {
          return (
            <SequencerPluginTerminal 
              key={plugin.id}
              isPlaying={isPlaying}
              currentStep={currentStep}
              tracks={patterns}
              bpm={bpm}
              setBpm={setBpm}
              onPlay={handlePlay}
              onStop={handleStop}
              onToggleStep={handleToggleStep}
            />
          );
        }

        return <Component key={plugin.id} />;
      });
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans selection:bg-orange-500/30">
      
      {/* 1. TOP BAR: 16 PLUGIN BUTTONS */}
      <header className="h-20 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-4 border-r border-neutral-800 pr-4 mr-2">
            <button 
                onClick={isPlaying ? handleStop : handlePlay}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-emerald-600 hover:bg-emerald-500'}`}
            >
                {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
            </button>
        </div>
        
        <div className="flex gap-2">
            {PLUGIN_REGISTRY.map(plugin => (
              <button
                key={plugin.id}
                onClick={() => togglePlugin(plugin.id)}
                className={`flex flex-col items-center justify-center min-w-[76px] h-14 rounded-lg border transition-all ${
                  activePlugins.has(plugin.id) || plugin.id === 'mischpult'
                    ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-700'
                }`}
              >
                <plugin.icon size={18} />
                <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{plugin.short}</span>
              </button>
            ))}
        </div>
      </header>

      {/* 2. MASTER WAVEFORM */}
      <section className="px-4 py-2 bg-black border-b border-neutral-900 shrink-0">
        <BeatVisualizer isPlaying={isPlaying} />
      </section>

      {/* 3. PERSISTENT MIXER (MISCHPULT) */}
      <section className="h-64 bg-[#0a0a0a] border-b border-neutral-800 overflow-hidden shrink-0">
        <MischpultTerminal />
      </section>

      {/* 4. DYNAMIC PLUGIN AREA */}
      <main className="flex-1 overflow-auto bg-[#070709] relative">
         <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            {renderActivePlugins()}
         </div>
         
         {/* Background Decor */}
         <div className="fixed bottom-4 right-4 text-[10px] font-mono text-neutral-800 pointer-events-none uppercase tracking-[0.2em]">
            SampleMonk // Pro Audio Workstation // v1.0.4
         </div>
      </main>
    </div>
  );
}
