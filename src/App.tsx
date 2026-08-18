import React, { useEffect, useState } from 'react';
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
import { Logo } from './components/Logo';


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
          <div className="min-h-screen relative flex flex-col items-center justify-center bg-black text-white overflow-hidden">
              {/* Ambient-Aura passend zur Logofarbe (Teal/Cyan) */}
              <div className="absolute inset-0 pointer-events-none opacity-40"
                   style={{ background: 'radial-gradient(520px 380px at 50% 42%, rgba(16,120,130,0.35) 0%, rgba(8,20,24,0.2) 45%, transparent 75%)' }} />
              <div className="absolute w-[540px] h-[540px] rounded-full blur-3xl opacity-25"
                   style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5), transparent 70%)' }} />

              <button
                onClick={startApp}
                aria-label="sampleMONK starten"
                className="group relative flex flex-col items-center gap-6 outline-none"
              >
                  {/* Logo mit sanftem Glow + Hover-Orbit */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl blur-2xl bg-cyan-400/20 group-hover:bg-cyan-300/30 transition-colors duration-700 scale-110 group-hover:scale-125" />
                    <div className="relative ring-1 ring-cyan-400/20 rounded-2xl overflow-hidden">
                      <Logo size={96} glow rounded={false} className="group-hover:scale-[1.03] transition-transform duration-500" />
                    </div>
                    <span className="absolute -inset-3 rounded-2xl border border-cyan-400/0 group-hover:border-cyan-400/30 transition-all duration-500" />
                  </div>

                  <span className="text-[9px] font-mono tracking-[0.5em] text-neutral-500 uppercase">Audio Workstation</span>
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-400">
                    SAMPLE MONK
                  </span>
                  <span className="px-5 py-2.5 rounded-full border border-cyan-400/40 text-cyan-200 text-xs font-bold tracking-[0.3em] uppercase
                                 bg-cyan-500/8 hover:bg-cyan-500/18 hover:border-cyan-300/70 hover:shadow-[0_0_30px_-6px_var(--monk-glow-teal)]
                                 transition-all duration-300 active:scale-95">
                    ▶ Studio betreten
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
    <div className="min-h-screen bg-transparent text-white p-6">
      {/* 1. Header: STICKY, Logo schwarz, Titel-4-Farben, Steuerung rechts */}
      <header className="flex items-center justify-between gap-4 mb-8 sticky top-0 z-30 -mx-6 px-6 py-4 bg-black/70 backdrop-blur-xl [box-shadow:0_1px_0_rgba(34,211,238,0.06),0_20px_40px_-24px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-cyan-400/15 blur-lg" />
            <div className="relative overflow-hidden rounded-lg ring-1 ring-cyan-400/15">
              <Logo size={38} rounded={false} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-fuchsia-400 leading-none">
                SAMPLE MONK
            </h1>
            <p className="text-[9px] text-neutral-500 font-mono tracking-[0.3em] uppercase mt-1">4-Person Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              defaultValue=""
              onChange={e => e.target.value && applyRole(e.target.value as StudioRole)}
              className="appearance-none pl-3 pr-8 py-2 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-300 text-xs hover:border-fuchsia-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 transition-colors cursor-pointer"
              title="Rollen-Startprofil wählen"
            >
              <option value="" disabled>Rolle</option>
              {ROLE_PRESETS.map(r => (
                <option key={r.role} value={r.role}>{r.role.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-cyan-300 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all duration-200 active:scale-95 cursor-pointer"
            title="Audio / I-O Einstellungen"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Module Selection + Icon Grid (2 x 8) */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-800" />
          <h2 className="text-[11px] font-bold tracking-[0.4em] text-neutral-400 uppercase">Module Selection</h2>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-800" />
        </div>
        <div className="grid grid-cols-8 gap-3 max-w-5xl mx-auto">
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
      </div>

      {/* 3. Master-Player + Waveform (BPM-Anzeige) */}
      <section className="monk-panel edge-inset p-5 mb-8">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-bold tracking-[0.35em] text-neutral-500 uppercase">Master Player</h3>
            <span className={`font-mono text-lg font-bold tracking-tight ${isPlaying ? 'text-cyan-300' : 'text-neutral-600'}`}>
              {isPlaying ? <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-1" /> : null}
              {bpm} BPM
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(true)}
              disabled={isPlaying}
              className="px-5 py-2 rounded-full bg-cyan-500/12 border border-cyan-500/50 text-cyan-200 text-xs font-bold tracking-widest uppercase hover:bg-cyan-500/25 hover:shadow-[0_0_20px_-6px_var(--monk-glow-teal)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              ▶ Play
            </button>
            <button
              onClick={() => setIsPlaying(false)}
              disabled={!isPlaying}
              className="px-5 py-2 rounded-full bg-fuchsia-500/12 border border-fuchsia-500/50 text-fuchsia-200 text-xs font-bold tracking-widest uppercase hover:bg-fuchsia-500/25 hover:shadow-[0_0_20px_-6px_rgba(217,70,239,0.5)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              ⏹ Stop
            </button>
          </div>
        </div>
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
