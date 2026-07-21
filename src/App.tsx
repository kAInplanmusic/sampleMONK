import React, { useState } from 'react';
import { PLUGIN_REGISTRY } from './plugins/registry';
import { audioEngine } from './utils/audioEngine';
import { usePluginManager } from './context/PluginManagerContext';
import { useModuleState, ModuleState } from './context/ModuleStateContext';
import { ModuleContainer } from './components/ModuleContainer';
import { BeatVisualizer } from './components/BeatVisualizer';
import { SequencerPluginTerminal } from './components/SequencerPluginTerminal';
import { TECHNO_PRESETS } from './presets';
import { TrackType } from './types';

export default function App() {
  const { moduleStates, setModuleState } = useModuleState();
  const { requestLock, releaseLock } = usePluginManager();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(128);
  const [patterns, setPatterns] = useState(TECHNO_PRESETS[0].patterns);
  const [isStarted, setIsStarted] = useState(false);

  const startApp = async () => {
      await audioEngine.play();
      setIsStarted(true);
      setIsPlaying(true);
  };

  if (!isStarted) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
              <button 
                onClick={startApp}
                className="group flex flex-col items-center gap-4 transition-transform hover:scale-105 active:scale-95"
              >
                  {/* Branded Logo Shape */}
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                    <Music className="w-12 h-12 text-white" />
                  </div>
                  <span className="text-xl font-black tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                      START MONK
                  </span>
              </button>
          </div>
      );
  }

  const togglePlugin = (id: string) => {
    if (id === 'mixer') return; 
    
    const currentState = moduleStates[id] || 'OFF';
    let nextState: ModuleState = 'OFF';
    
    if (currentState === 'OFF') nextState = 'AUTO_AI';
    else if (currentState === 'AUTO_AI') nextState = 'PRO';
    else if (currentState === 'PRO') nextState = 'OFF';
    
    setModuleState(id, nextState);
    if (nextState === 'PRO') requestLock(id, 'localUser');
    else releaseLock(id, 'localUser');
  };

  const handleToggleStep = (track: TrackType, stepIndex: number) => {
    setPatterns(prev => {
      const nextArr = [...prev[track]];
      nextArr[stepIndex] = !nextArr[stepIndex];
      return { ...prev, [track]: nextArr };
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-slate-950 text-white p-6">
      {/* 1. Header with Logo */}
      <header className="flex justify-center mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            SAMPLE MONK
        </h1>
      </header>

      {/* 2. 4x4 Icon Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
        {PLUGIN_REGISTRY.map(plugin => {
          const state = moduleStates[plugin.id] || 'OFF';
          const isActive = state !== 'OFF';
          
          return (
            <button
              key={plugin.id}
              onClick={() => togglePlugin(plugin.id)}
              className={`flex flex-col items-center justify-center h-20 rounded-xl border transition-all ${
                isActive
                  ? state === 'PRO'
                    ? 'bg-purple-900/50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : 'bg-orange-900/30 border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.2)] animate-pulse'
                  : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <plugin.icon size={24} />
              <span className="text-[10px] font-bold mt-2 uppercase">{plugin.short}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Persistent Waveform/Taktfenster */}
      <section className="bg-black/40 border border-neutral-800 p-4 rounded-xl mb-8">
        <BeatVisualizer isPlaying={isPlaying} currentStep={currentStep} />
      </section>

      {/* 4. Active Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLUGIN_REGISTRY
          .filter(p => p.id !== 'mixer' && moduleStates[p.id] && moduleStates[p.id] !== 'OFF')
          .map(plugin => (
            <ModuleContainer key={plugin.id} id={plugin.id} name={plugin.name} state={moduleStates[plugin.id]}>
                {plugin.id === 'sequencer' ? (
                <SequencerPluginTerminal 
                    isPlaying={isPlaying}
                    currentStep={currentStep}
                    tracks={patterns}
                    bpm={bpm}
                    setBpm={setBpm}
                    onPlay={() => setIsPlaying(true)}
                    onStop={() => setIsPlaying(false)}
                    onToggleStep={handleToggleStep}
                />
                ) : (
                <plugin.component />
                )}
            </ModuleContainer>
        ))}
      </div>
    </div>
  );
}
