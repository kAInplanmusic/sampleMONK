import React, { useState, useEffect } from 'react';
import { 
  Sliders, Grid3X3, Database, Speaker, Music, Box, Waves, Activity, Keyboard, 
  Sparkles, Layers, Mic, Cpu, Radio, Puzzle, Play, Pause, Square
} from 'lucide-react';
import { PLUGIN_REGISTRY } from './plugins/registry';
import { audioEngine } from './utils/audioEngine';
import { webRTCManager } from './utils/WebRTCManager';
import { usePluginManager } from './context/PluginManagerContext';
import { useModuleState, ModuleState } from './context/ModuleStateContext';
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

// PLUGIN_REGISTRY removed, imported from ./plugins/registry

export default function App() {
  const { moduleStates, setModuleState } = useModuleState();
  const { pluginLocks, requestLock, releaseLock } = usePluginManager();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(128);
  const [patterns, setPatterns] = useState(TECHNO_PRESETS[0].patterns);
  const [synthNotes, setSynthNotes] = useState(TECHNO_PRESETS[0].synthNotes);

  useEffect(() => {
    webRTCManager.onRemoteStream = (stream, senderId) => {
        console.log('Linking remote stream from:', senderId);
        audioEngine.addRemoteStream(stream);
    };

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
    if (id === 'mixer') return; // Mixer is persistent
    
    const currentState = moduleStates[id] || 'OFF';
    let nextState: ModuleState = 'OFF';
    
    if (currentState === 'OFF') nextState = 'AUTO_AI';
    else if (currentState === 'AUTO_AI') nextState = 'PRO';
    else if (currentState === 'PRO') nextState = 'OFF';
    
    setModuleState(id, nextState);
    
    // Manage locks based on state
    if (nextState === 'PRO') requestLock(id, 'localUser');
    else releaseLock(id, 'localUser');
  };

import { ModuleContainer } from './components/ModuleContainer';
// ... (keep other imports)

// ... (keep state)

  const renderActivePlugins = () => {
    return PLUGIN_REGISTRY
      .filter(p => p.id !== 'mixer' && moduleStates[p.id] && moduleStates[p.id] !== 'OFF')
      .map(plugin => {
        const Component = plugin.component;
        const state = moduleStates[plugin.id];
        
        return (
          <ModuleContainer key={plugin.id} id={plugin.id} name={plugin.name} state={state}>
            {plugin.id === 'sequencer' ? (
              <SequencerPluginTerminal 
                isPlaying={isPlaying}
                currentStep={currentStep}
                tracks={patterns}
                bpm={bpm}
                setBpm={setBpm}
                onPlay={handlePlay}
                onStop={handleStop}
                onToggleStep={handleToggleStep}
              />
            ) : (
              <Component />
            )}
          </ModuleContainer>
        );
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
            {PLUGIN_REGISTRY.map(plugin => {
              const state = moduleStates[plugin.id] || 'OFF';
              const isActive = state !== 'OFF';
              
              return (
                <button
                  key={plugin.id}
                  onClick={() => togglePlugin(plugin.id)}
                  className={`flex flex-col items-center justify-center min-w-[76px] h-14 rounded-lg border transition-all ${
                    isActive
                      ? state === 'PRO'
                        ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                        : 'bg-orange-600/50 border-orange-400/50 text-white shadow-[0_0_15px_rgba(234,88,12,0.1)] animate-pulse'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-700'
                  }`}
                >
                  <plugin.icon size={18} />
                  <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{plugin.short}</span>
                </button>
              );
            })}
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
