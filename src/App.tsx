import React, { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import { PLUGIN_REGISTRY, discoverPlugins } from './plugins/registry';
import { audioEngine } from './utils/audioEngine';
import { usePluginManager } from './context/PluginManagerContext';
import { useModuleState, ModuleState } from './context/ModuleStateContext';
import { ModuleContainer } from './components/ModuleContainer';
import { BeatVisualizer } from './components/BeatVisualizer';
import { SequencerPluginTerminal } from './components/SequencerPluginTerminal';
import { TECHNO_PRESETS } from './presets';
import { TrackType } from './types';
import { SafeModuleBoundary } from './components/SafeModuleBoundary';
import { PluginButton } from './components/PluginButton';
import { FEATURE_FLAGS } from './config/featureFlags';
import { VoiceGenTerminal } from './components/VoiceGenTerminal';
import { useAudio } from './context/AudioContext';
import { SettingsDialog } from './components/SettingsDialog';
import { ROLE_PRESETS, moduleStateForRole, StudioRole } from './config/rolePresets';
import { Settings } from 'lucide-react';


export default function App() {
  return (
    <SafeModuleBoundary>
      <AppComponent />
    </SafeModuleBoundary>
  );
}

function AppComponent() {
  const { startAudio } = useAudio();
  const { moduleStates, setModuleState } = useModuleState();
  const { requestLock, releaseLock } = usePluginManager();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(128);
  const [patterns, setPatterns] = useState(TECHNO_PRESETS[0].patterns);
  const [isStarted, setIsStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Task 22: Rollen-Start-Presets – wendet das Modul-Profil einer Rolle an.
  const applyRole = (role: StudioRole) => {
    const ids = PLUGIN_REGISTRY.map(p => p.id);
    const states = moduleStateForRole(role, ids);
    Object.entries(states).forEach(([id, s]) => setModuleState(id, s));
  };

  useEffect(() => {
    audioEngine.onStepUpdate = setCurrentStep;
    return () => {
      audioEngine.onStepUpdate = () => {};
    };
  }, []);

  const startApp = async () => {
      // UX-Debug: markiert den Start-Ablauf sichtbar in der Konsole.
      console.log('[startApp] Aktion ausgelöst – Audio-Init beginnt');
      // UX-Fix: Jeder Initialisierungsschritt wird einzeln abgefangen. Wenn das
      // Backend (WebRTC-Signaling) oder einzelne Worklets nicht verfügbar sind,
      // darf die App NICHT auf dem Start-Screen hängen bleiben – sie startet
      // trotzdem und protokolliert den Fehler konsolen-seitig.
      try {
        await startAudio();
      } catch (e) {
        console.error('[startApp] startAudio fehlgeschlagen (App startet trotzdem):', e);
      }
      console.log('[startApp] startAudio done');
      try {
        await discoverPlugins();
      } catch (e) {
        console.error('[startApp] discoverPlugins fehlgeschlagen (Fallback-Registry aktiv):', e);
      }
      console.log('[startApp] discoverPlugins done');
      try {
        await audioEngine.play();
      } catch (e) {
        console.error('[startApp] audioEngine.play fehlgeschlagen:', e);
      } finally {
        console.log('[startApp] audioEngine.play done');
      }
      // IMMER in den App-Screen wechseln – Backend/Worklet-Defizite brechen die App nicht.
      console.log('[startApp] isStarted=true setzen');
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
    
    if (nextState === 'PRO') {
      const lockGranted = requestLock(id, 'localUser');
      if (!lockGranted) return;
    } else {
      releaseLock(id, 'localUser');
    }
    setModuleState(id, nextState);
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
      <header className="flex justify-center items-center gap-4 mb-8">
        <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            SAMPLE MONK
        </h1>
        <select
          defaultValue=""
          onChange={e => e.target.value && applyRole(e.target.value as StudioRole)}
          className="ml-4 px-2 py-2 rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs hover:border-purple-500/60"
          title="Rollen-Startprofil wählen"
        >
          <option value="" disabled>Rolle wählen</option>
          {ROLE_PRESETS.map(r => (
            <option key={r.role} value={r.role}>{r.role.replace('_', ' ')}</option>
          ))}
        </select>
        <button
          onClick={() => setSettingsOpen(true)}
          className="ml-2 p-2.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-400 hover:text-white hover:border-purple-500/60 transition-colors"
          title="Audio / I-O Einstellungen"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* 2. 4x4 Icon Grid */}
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
        {PLUGIN_REGISTRY.map(plugin => {
          const state = moduleStates[plugin.id] || 'OFF';
          const isActive = state !== 'OFF';
          
          return (
            <PluginButton
              key={plugin.id}
              id={plugin.id}
              icon={plugin.icon}
              short={plugin.short}
              isActive={isActive}
              state={state}
              onClick={() => togglePlugin(plugin.id)}
            />
          );
        })}
      </div>

      {/* 3. Persistent Waveform/Taktfenster */}
      <section className="bg-black/40 border border-neutral-800 p-4 rounded-xl mb-8">
        <BeatVisualizer isPlaying={isPlaying} />
      </section>

      {/* 4. Active Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLUGIN_REGISTRY
          .filter(p => p.id !== 'mixer' && moduleStates[p.id] && moduleStates[p.id] !== 'OFF')
          .map(plugin => (
            <ModuleContainer key={plugin.id} id={plugin.id} name={plugin.name} state={moduleStates[plugin.id]}>

                              <SafeModuleBoundary>
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
                                  ) : plugin.id === 'voice' ? (
                                    <VoiceGenTerminal enabled={FEATURE_FLAGS.VOICE_GENERATOR_ENABLED} />
                                  ) : (
                                  <plugin.component />
                                  )}
                              </SafeModuleBoundary>
                            </ModuleContainer>

        ))}
      </div>

      {/* Settings / Audio-I/O */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
