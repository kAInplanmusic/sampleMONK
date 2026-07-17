import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Sliders, 
  Music, 
  Sparkles, 
  Volume2, 
  VolumeX,
  RotateCcw, 
  Disc, 
  Info, 
  ListMusic,
  Gauge,
  Trash2,
  Activity,
  Flame,
  HelpCircle,
  Shuffle,
  Database,
  Plus,
  PlusCircle,
  Save,
  CheckCircle2,
  Cloud,
  UploadCloud,
  RefreshCw,
  CloudLightning
} from 'lucide-react';
import { TrackPreset, TrackType, MUSIC_SCALES } from './types';
import { TECHNO_PRESETS } from './presets';
import { audioEngine } from './utils/audioEngine';
import { BeatVisualizer } from './components/BeatVisualizer';
import { SampleMonkLogo } from './components/SampleMonkLogo';
import { PRESET_SAMPLE_DATABASE, AudioSample } from './data/samples';
import { savePresetToCloud, fetchPresetsFromCloud } from './utils/firebase';

export default function App() {
  // Preset state
  const [activePreset, setActivePreset] = useState<TrackPreset>(TECHNO_PRESETS[0]);
  const [presetTab, setPresetTab] = useState<'studio' | 'cloud'>('studio');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Audio state
  const [bpm, setBpm] = useState(TECHNO_PRESETS[0].bpm);
  const [cutoff, setCutoff] = useState(TECHNO_PRESETS[0].cutoff);
  const [resonance, setResonance] = useState(TECHNO_PRESETS[0].resonance);
  const [decay, setDecay] = useState(TECHNO_PRESETS[0].decay);
  const [delayWet, setDelayWet] = useState(0.3);
  const [volume, setVolume] = useState(75);
  const [scale, setScale] = useState<keyof typeof MUSIC_SCALES>('C Minor (Acid)');

  // Sequencer patterns
  const [patterns, setPatterns] = useState<Record<TrackType, boolean[]>>(TECHNO_PRESETS[0].patterns);
  const [synthNotes, setSynthNotes] = useState<number[]>(TECHNO_PRESETS[0].synthNotes);
  const [mutedStems, setMutedStems] = useState<Record<TrackType, boolean>>({
    kick: false,
    hat: false,
    clap: false,
    synth: false,
  });
  const [soloedStems, setSoloedStems] = useState<Record<TrackType, boolean>>({
    kick: false,
    hat: false,
    clap: false,
    synth: false,
  });

  // Sample database state
  const [samples, setSamples] = useState<AudioSample[]>(PRESET_SAMPLE_DATABASE);
  const [customSampleName, setCustomSampleName] = useState('');
  const [customSampleCategory, setCustomSampleCategory] = useState<'bass' | 'mids' | 'highs'>('bass');
  const [customSampleType, setCustomSampleType] = useState('Kick');
  const [customSampleFreq, setCustomSampleFreq] = useState(60);
  const [activeSampleTab, setActiveSampleTab] = useState<'all' | 'bass' | 'mids' | 'highs'>('all');
  const [sampleSuccessMsg, setSampleSuccessMsg] = useState('');

  // AI Prompt Assist state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successGlow, setSuccessGlow] = useState(false);

  // Cloud Presets state
  const [cloudPresets, setCloudPresets] = useState<TrackPreset[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetGenre, setNewPresetGenre] = useState('Techno');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSuccessMsg, setCloudSuccessMsg] = useState('');

  const loadCloudPresets = async () => {
    setIsLoadingCloud(true);
    try {
      const data = await fetchPresetsFromCloud();
      setCloudPresets(data);
    } catch (err) {
      console.error("Error fetching cloud presets:", err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    loadCloudPresets();
  }, []);

  const handleSaveToCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    setIsSavingCloud(true);
    try {
      const presetToSave = {
        name: newPresetName,
        genre: newPresetGenre,
        bpm: bpm,
        key: scale,
        description: newPresetDesc || `Custom ${newPresetGenre} loop created by sampleMONK user.`,
        patterns: patterns,
        synthNotes: synthNotes,
        cutoff: cutoff,
        resonance: resonance,
        delayTime: 0.25,
        decay: decay
      };
      await savePresetToCloud(presetToSave);
      setCloudSuccessMsg("Loop successfully uploaded to sampleMONK Cloud!");
      setNewPresetName('');
      setNewPresetDesc('');
      await loadCloudPresets();
      setTimeout(() => setCloudSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error saving loop to cloud:", err);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Initialize and bind audio callback
  useEffect(() => {
    // Synchronize beat changes from Tone.js thread back to React safely
    audioEngine.setOnBeatCallback((step) => {
      setCurrentStep(step);
    });

    // Cleanup on unmount
    return () => {
      audioEngine.dispose();
    };
  }, []);

  // Sync initial parameters on mount/preset-switch
  useEffect(() => {
    const isAnySoloed = Object.values(soloedStems).some(Boolean);
    const finalMuteStates = {
      kick: mutedStems.kick || (isAnySoloed && !soloedStems.kick),
      hat: mutedStems.hat || (isAnySoloed && !soloedStems.hat),
      clap: mutedStems.clap || (isAnySoloed && !soloedStems.clap),
      synth: mutedStems.synth || (isAnySoloed && !soloedStems.synth),
    };

    audioEngine.setPatterns(patterns);
    audioEngine.setSynthNotes(synthNotes);
    audioEngine.setBpm(bpm);
    audioEngine.setScale(scale);
    audioEngine.updateBassSynth(cutoff, resonance, decay);
    audioEngine.updateDelayWet(delayWet);
    audioEngine.setMasterVolume(volume);
    audioEngine.setMutedStems(finalMuteStates);
  }, [patterns, synthNotes, bpm, scale, cutoff, resonance, decay, delayWet, volume, mutedStems, soloedStems]);

  // Load a preset
  const handleLoadPreset = (preset: TrackPreset) => {
    setActivePreset(preset);
    setBpm(preset.bpm);
    setPatterns(preset.patterns);
    setSynthNotes(preset.synthNotes);
    setCutoff(preset.cutoff);
    setResonance(preset.resonance);
    setDecay(preset.decay);
    
    // Auto-detect key
    if (preset.key.includes('Acid')) {
      setScale('C Minor (Acid)');
    } else if (preset.key.includes('Pentatonic')) {
      setScale('A Minor Pentatonic');
    } else {
      setScale('F# Phrygian');
    }

    // Live update engine
    audioEngine.setBpm(preset.bpm);
    audioEngine.setPatterns(preset.patterns);
    audioEngine.setSynthNotes(preset.synthNotes);
    audioEngine.updateBassSynth(preset.cutoff, preset.resonance, preset.decay);
  };

  // Stem & Mute/Solo Helpers
  const handleToggleMute = (track: TrackType) => {
    setMutedStems(prev => ({ ...prev, [track]: !prev[track] }));
  };

  const handleToggleSolo = (track: TrackType) => {
    setSoloedStems(prev => ({ ...prev, [track]: !prev[track] }));
  };

  const handleClearStem = (track: TrackType) => {
    setPatterns(prev => ({
      ...prev,
      [track]: Array(16).fill(false)
    }));
  };

  const handleFillFourFour = (track: TrackType) => {
    const nextArr = Array(16).fill(false);
    [0, 4, 8, 12].forEach(idx => { nextArr[idx] = true; });
    setPatterns(prev => ({
      ...prev,
      [track]: nextArr
    }));
  };

  const handleFillOffbeats = (track: TrackType) => {
    const nextArr = Array(16).fill(false);
    [2, 6, 10, 14].forEach(idx => { nextArr[idx] = true; });
    setPatterns(prev => ({
      ...prev,
      [track]: nextArr
    }));
  };

  const handleRandomizeStem = (track: TrackType) => {
    const nextArr = Array(16).fill(null).map(() => Math.random() > 0.65);
    setPatterns(prev => ({
      ...prev,
      [track]: nextArr
    }));
  };

  const handleResetStems = () => {
    setMutedStems({ kick: false, hat: false, clap: false, synth: false });
    setSoloedStems({ kick: false, hat: false, clap: false, synth: false });
  };

  // Sample Database Handlers
  const handlePreviewSample = async (sample: AudioSample) => {
    try {
      await audioEngine.previewSample(sample.category, sample.parameters.frequency);
    } catch (err) {
      console.error('Error previewing sample:', err);
    }
  };

  const handleLoadSampleToTrack = (sample: AudioSample, targetTrack: TrackType) => {
    // Modify synth parameters if the sample provides them
    if (sample.parameters.frequency) {
      if (sample.category === 'bass') {
        setCutoff(sample.parameters.frequency);
      }
    }
    if (sample.parameters.decay) {
      setDecay(sample.parameters.decay);
    }

    // Give a beautiful rhythm depending on the target track
    setPatterns(prev => {
      const nextArr = [...prev[targetTrack]];
      // If track is completely empty, give it a default characteristic pattern to help the flowstate
      const isEmpty = nextArr.every(v => !v);
      if (isEmpty) {
        if (targetTrack === 'kick') {
          [0, 4, 8, 12].forEach(idx => { nextArr[idx] = true; });
        } else if (targetTrack === 'hat') {
          [2, 6, 10, 14].forEach(idx => { nextArr[idx] = true; });
        } else if (targetTrack === 'clap') {
          [4, 12].forEach(idx => { nextArr[idx] = true; });
        } else if (targetTrack === 'synth') {
          [0, 3, 6, 8, 11, 14].forEach(idx => { nextArr[idx] = true; });
        }
      }
      return {
        ...prev,
        [targetTrack]: nextArr
      };
    });

    setSampleSuccessMsg(`"${sample.name}" erfolgreich auf Spur ${targetTrack.toUpperCase()} geladen! 🔥`);
    setTimeout(() => setSampleSuccessMsg(''), 4000);
  };

  const handleAddCustomSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSampleName.trim()) return;

    const newSample: AudioSample = {
      id: `custom-${Date.now()}`,
      name: customSampleName,
      category: customSampleCategory,
      type: customSampleType,
      description: 'Benutzerdefiniertes analoges Sound-Preset für Live-Performances.',
      parameters: {
        frequency: Number(customSampleFreq),
        decay: customSampleCategory === 'bass' ? 0.35 : customSampleCategory === 'mids' ? 0.15 : 0.05
      }
    };

    setSamples(prev => [newSample, ...prev]);
    setCustomSampleName('');
    setSampleSuccessMsg(`Eigenes Sample "${newSample.name}" hinzugefügt! 💎`);
    setTimeout(() => setSampleSuccessMsg(''), 4000);
  };

  const handleSaveCurrentAsSample = () => {
    const newSample: AudioSample = {
      id: `generated-${Date.now()}`,
      name: `Generierter ${activePreset.genre} Groove`,
      category: 'bass',
      type: 'Loop',
      description: `Selbst generierter ${bpm} BPM Loop. Synthesizer Cutoff bei ${cutoff}Hz, Resonance ${resonance}.`,
      parameters: {
        frequency: cutoff,
        decay: decay
      }
    };

    setSamples(prev => [newSample, ...prev]);
    setSampleSuccessMsg(`Aktueller Groove als generiertes Sample "${newSample.name}" gespeichert! 💾`);
    setTimeout(() => setSampleSuccessMsg(''), 4000);
  };

  // Play / Pause / Stop Handlers
  const handlePlay = async () => {
    try {
      await audioEngine.init();
      audioEngine.play();
      setIsPlaying(true);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage('Could not initialize audio engine. Try interacting with the page first.');
    }
  };

  const handlePause = () => {
    audioEngine.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Toggle Step in sequencer grid
  const handleToggleStep = (track: TrackType, stepIndex: number) => {
    const updatedPatterns = { ...patterns };
    updatedPatterns[track] = [...updatedPatterns[track]];
    updatedPatterns[track][stepIndex] = !updatedPatterns[track][stepIndex];
    setPatterns(updatedPatterns);
    audioEngine.setPatterns(updatedPatterns);
  };

  // Change specific pitch/note for synth step
  const handleCycleSynthNote = (stepIndex: number) => {
    const updatedNotes = [...synthNotes];
    updatedNotes[stepIndex] = (updatedNotes[stepIndex] + 1) % 8; // 8 notes in scale
    setSynthNotes(updatedNotes);
    audioEngine.setSynthNotes(updatedNotes);
  };

  // Clear patterns
  const handleClearPatterns = () => {
    const cleared = {
      kick: Array(16).fill(false),
      hat: Array(16).fill(false),
      clap: Array(16).fill(false),
      synth: Array(16).fill(false)
    };
    setPatterns(cleared);
    audioEngine.setPatterns(cleared);
  };

  // Generate Custom Preset using Gemini API backend
  const handleGenerateAiPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/generate-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error.');
      }

      // Load AI generated preset successfully
      const customPreset: TrackPreset = {
        id: 'ai-generated',
        name: data.name || 'AI Vibe Capture',
        genre: data.genre || 'AI Techno',
        bpm: Number(data.bpm) || 125,
        key: data.key || 'C Minor (Acid)',
        description: data.description || 'AI procedurally generated pattern.',
        patterns: data.patterns,
        synthNotes: data.synthNotes || Array(16).fill(0),
        cutoff: Number(data.cutoff) || 600,
        resonance: Number(data.resonance) || 6,
        delayTime: Number(data.delayTime) || 0.25,
        decay: Number(data.decay) || 0.2
      };

      handleLoadPreset(customPreset);
      setSuccessGlow(true);
      setTimeout(() => setSuccessGlow(false), 2000);
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to connect to the generator. Verify GEMINI_API_KEY is configured.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Pitch values for display
  const activeScaleNotes = MUSIC_SCALES[scale];

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-sans selection:bg-sky-500 selection:text-black">
      {/* Top Header / Nav */}
      <header className="border-b border-neutral-800/60 bg-[#0c0c0e]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SampleMonkLogo size={56} />
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-baseline select-none">
                  <span className="text-xs font-sans font-medium text-neutral-400 tracking-tight leading-none uppercase mr-1">sample</span>
                  <span className="text-xs font-sans font-bold text-sky-400 tracking-tight leading-none uppercase">MONK</span>
                </div>
                <span className="px-1.5 py-0.2 bg-sky-500/10 text-[9px] font-mono text-sky-400 rounded border border-sky-500/20 uppercase tracking-wider">Sound, Samples & Effektmaschine</span>
              </div>
              <h1 className="text-lg font-mono tracking-tight font-bold text-neutral-100 mt-1">sampleMONK ENGINE</h1>
            </div>
          </div>

          {/* Master Transport controls */}
          <div className="flex items-center gap-2 bg-[#121215] p-1.5 rounded-lg border border-neutral-800">
            {isPlaying ? (
              <button 
                id="pause-btn"
                onClick={handlePause}
                className="p-2.5 rounded-md bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 transition"
                title="Pause"
              >
                <Pause className="w-4 h-4 fill-amber-400" />
              </button>
            ) : (
              <button 
                id="play-btn"
                onClick={handlePlay}
                className="p-2.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 transition flex items-center gap-1.5 font-mono text-xs font-bold px-4"
                title="Play Sequence"
              >
                <Play className="w-3.5 h-3.5 fill-sky-400" /> START
              </button>
            )}
            <button 
              id="stop-btn"
              onClick={handleStop}
              className="p-2.5 rounded-md hover:bg-neutral-800 text-neutral-400 transition"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-neutral-400" />
            </button>
            <div className="h-6 w-[1px] bg-neutral-800 mx-1"></div>
            <button 
              id="clear-btn"
              onClick={handleClearPatterns}
              className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition"
              title="Clear Sequence Grid"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Presets & Visualizer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Waveform visualizer */}
          <section className="bg-[#0c0c0e] p-4 rounded-xl border border-neutral-800/80 shadow-xl">
            <h3 className="text-xs font-mono text-neutral-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              Pulse Visual Waveform
            </h3>
            <BeatVisualizer isPlaying={isPlaying} />
          </section>

          {/* Quick Style Presets Selector & Cloud Storage */}
          <section className="bg-[#0c0c0e] p-5 rounded-xl border border-neutral-800/80 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-sky-400" /> Presets & Cloud Library
              </h3>
              <div className="flex bg-[#121215] p-0.5 rounded-lg border border-neutral-800/60 text-[10px] font-mono">
                <button
                  onClick={() => setPresetTab('studio')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${presetTab === 'studio' ? 'bg-sky-500/15 text-sky-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Studio
                </button>
                <button
                  onClick={() => {
                    setPresetTab('cloud');
                    loadCloudPresets();
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${presetTab === 'cloud' ? 'bg-sky-500/15 text-sky-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Cloud
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>
              </div>
            </div>

            {presetTab === 'studio' ? (
              <div className="grid grid-cols-2 gap-2">
                {TECHNO_PRESETS.map((preset) => {
                  const isActive = activePreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleLoadPreset(preset)}
                      className={`p-3 rounded-lg text-left transition border font-mono ${
                        isActive 
                          ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' 
                          : 'bg-[#121215] border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{preset.name}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{preset.genre} • {preset.bpm} BPM</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Community Firestore Loops</span>
                  <button 
                    onClick={loadCloudPresets}
                    disabled={isLoadingCloud}
                    className="p-1 hover:bg-neutral-800 rounded text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                    title="Refresh Library"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {isLoadingCloud ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Cloud className="w-8 h-8 text-sky-500/30 animate-bounce" />
                    <span className="text-xs font-mono text-neutral-500">Querying identitymonk Firestore...</span>
                  </div>
                ) : cloudPresets.length === 0 ? (
                  <div className="py-8 border border-dashed border-neutral-800/80 rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <CloudLightning className="w-8 h-8 text-neutral-600 mb-2" />
                    <p className="text-xs font-mono text-neutral-400 font-bold">No Cloud Loops Found</p>
                    <p className="text-[10px] text-neutral-500 mt-1 max-w-[200px]">Be the first to save your current sequence parameters to the cloud database!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {cloudPresets.map((preset) => {
                      const isActive = activePreset.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleLoadPreset(preset)}
                          className={`p-3 rounded-lg text-left transition border font-mono ${
                            isActive 
                              ? 'bg-sky-500/10 border-sky-500/50 text-sky-300' 
                              : 'bg-[#121215] border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{preset.name}</div>
                          <div className="text-[10px] opacity-75 mt-0.5">{preset.genre} • {preset.bpm} BPM</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cloud Upload Form */}
                <form onSubmit={handleSaveToCloud} className="mt-2 bg-[#121215] p-3.5 rounded-lg border border-neutral-800/85 flex flex-col gap-2.5">
                  <div className="text-[10px] font-mono text-sky-400/90 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" /> Save Current Preset to Cloud
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase">Preset Name</label>
                      <input 
                        type="text" 
                        required
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="e.g. Acid Sunrise" 
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500/60 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase">Subgenre</label>
                      <select
                        value={newPresetGenre}
                        onChange={(e) => setNewPresetGenre(e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500/60 font-mono"
                      >
                        <option value="Acid Techno">Acid Techno</option>
                        <option value="Peak Time">Peak Time</option>
                        <option value="Psy Trance">Psy Trance</option>
                        <option value="Goa Trance">Goa Trance</option>
                        <option value="Hardtekk">Hardtekk</option>
                        <option value="Schranz">Schranz</option>
                        <option value="Ambient">Ambient</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Short Description (Vibe)</label>
                    <input 
                      type="text" 
                      value={newPresetDesc}
                      onChange={(e) => setNewPresetDesc(e.target.value)}
                      placeholder="e.g. Hypnotic bass line with aggressive delay" 
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500/60 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingCloud || !newPresetName.trim()}
                    className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold font-mono text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSavingCloud ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading to Firestore...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload Current Setup
                      </>
                    )}
                  </button>

                  {cloudSuccessMsg && (
                    <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-center mt-1 bg-emerald-500/10 py-1.5 rounded border border-emerald-500/25">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {cloudSuccessMsg}
                    </div>
                  )}
                </form>
              </div>
            )}
          </section>

          {/* Preset Metadata details card */}
          <section className={`bg-[#0c0c0e] p-5 rounded-xl border transition-all duration-500 shadow-xl flex flex-col gap-3 ${successGlow ? 'border-sky-500/70 shadow-sky-500/5' : 'border-neutral-800/80'}`}>
            <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" /> Loop Production Metadata
            </h3>
            <div className="bg-[#121215] p-4 rounded-lg border border-neutral-800/80 flex flex-col gap-2.5">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block uppercase">Name / Subgenre</span>
                <span className="text-sm font-bold font-mono text-neutral-200">{activePreset.name}</span>
                <span className="ml-2 px-1.5 py-0.5 bg-sky-500/10 text-sky-400 rounded text-[9px] font-mono border border-sky-500/20">{activePreset.genre}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 block uppercase">Playback Tempo</span>
                  <span className="text-xs font-mono font-bold text-neutral-300">{bpm} BPM</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 block uppercase">Frequency Key Scale</span>
                  <span className="text-xs font-mono font-bold text-neutral-300">{activePreset.key}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block uppercase">Vibe Description</span>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">{activePreset.description}</p>
              </div>
            </div>
          </section>

          {/* Sound Controls / Synthesizer Parameter Board */}
          <section className="bg-[#0c0c0e] p-5 rounded-xl border border-neutral-800/80 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" /> Analog Synthesizer Knobs
            </h3>
            <div className="flex flex-col gap-4">
              {/* Filter Cutoff */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1.5">
                  <span>Filter Cutoff</span>
                  <span className="text-sky-400 font-semibold">{cutoff} Hz</span>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="1600" 
                  step="10"
                  value={cutoff}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCutoff(val);
                    audioEngine.updateBassSynth(val, resonance, decay);
                  }}
                  className="w-full h-1 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-sky-500" 
                />
              </div>

              {/* Filter Resonance */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1.5">
                  <span>Resonance (Q-factor)</span>
                  <span className="text-sky-400 font-semibold">{resonance}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="15" 
                  step="0.5"
                  value={resonance}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setResonance(val);
                    audioEngine.updateBassSynth(cutoff, val, decay);
                  }}
                  className="w-full h-1 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-sky-500" 
                />
              </div>

              {/* Envelope Decay */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1.5">
                  <span>Synth Note Decay</span>
                  <span className="text-sky-400 font-semibold">{decay.toFixed(2)}s</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.6" 
                  step="0.01"
                  value={decay}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDecay(val);
                    audioEngine.updateBassSynth(cutoff, resonance, val);
                  }}
                  className="w-full h-1 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-sky-500" 
                />
              </div>

              {/* Stereo Delay Echo */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1.5">
                  <span>Delay Echo Wet/Dry</span>
                  <span className="text-sky-400 font-semibold">{Math.round(delayWet * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="0.8" 
                  step="0.05"
                  value={delayWet}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDelayWet(val);
                    audioEngine.updateDelayWet(val);
                  }}
                  className="w-full h-1 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-sky-500" 
                />
              </div>

              <div className="h-[1px] bg-neutral-800 my-1"></div>

              {/* Master Volume */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono text-neutral-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" /> Station Master Gain
                  </span>
                  <span className="text-sky-400 font-semibold">{volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setVolume(val);
                    audioEngine.setMasterVolume(val);
                  }}
                  className="w-full h-1.5 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-sky-500" 
                />
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Step Sequencer & AI Prompter (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* AI Generator Panel */}
          <section className="bg-[#0c0c0e] p-5 rounded-xl border border-neutral-800/80 shadow-xl">
            <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" /> AI Sound & Beat Generator
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Describe a rhythm or electronic vibe (e.g., <span className="text-sky-400">"Dark fast warehouse acid techno with lots of hi-hat rolls"</span> or <span className="text-sky-400">"Meditation dub with warm delay, minimal kick"</span>) and Gemini will customize your patterns instantly.
            </p>
            
            <form onSubmit={handleGenerateAiPreset} className="flex gap-2">
              <input
                id="ai-prompt-input"
                type="text"
                placeholder="Describe your vibe (tempo, style, mood)..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-[#121215] border border-neutral-800 hover:border-neutral-700 focus:border-sky-500/80 rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none transition placeholder:text-neutral-600 text-neutral-200"
                disabled={isGenerating}
              />
              <button
                id="ai-generate-btn"
                type="submit"
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold rounded-lg text-sm transition flex items-center gap-2 font-mono disabled:bg-neutral-800 disabled:text-neutral-500 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-500 border-t-black rounded-full animate-spin"></div>
                    CREATING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    INJECT
                  </>
                )}
              </button>
            </form>
            {errorMessage && (
              <p className="text-xs text-red-400 bg-red-950/25 border border-red-900/35 rounded-lg p-3 mt-3 font-mono">
                Error: {errorMessage}
              </p>
            )}
          </section>

          {/* Interactive Sequencer Board */}
          <section className="bg-[#0c0c0e] p-5 rounded-xl border border-neutral-800/80 shadow-xl flex-1 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" /> Takt & Stems Performance Terminal
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 mt-0.5 block">
                  Interactive real-time stem mixing & multi-pattern performance grid.
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Reset stems shortcut */}
                <button
                  onClick={handleResetStems}
                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-400 hover:text-sky-400 rounded-lg border border-neutral-800/80 transition flex items-center gap-1 cursor-pointer select-none"
                  title="Unmute and unsolo all stems"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Mutes
                </button>

                {/* BPM Dial */}
                <div className="flex items-center gap-2 bg-[#121215] px-3 py-1.5 rounded-lg border border-neutral-800/80">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Tempo:</span>
                  <input 
                    type="number" 
                    min="100" 
                    max="150" 
                    value={bpm}
                    onChange={(e) => {
                      const val = Math.max(100, Math.min(150, Number(e.target.value)));
                      setBpm(val);
                      audioEngine.setBpm(val);
                    }}
                    className="w-12 bg-transparent border-none text-xs font-mono font-bold text-neutral-100 text-center focus:outline-none focus:ring-0 p-0"
                  />
                  <span className="text-[10px] font-mono text-neutral-400">BPM</span>
                </div>
              </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 flex flex-col gap-5 overflow-x-auto pb-4">
              <div className="min-w-[700px] flex flex-col gap-5">
                
                {/* STEMS & STEPS ROW RENDERER */}
                {[
                  { id: 'kick' as TrackType, name: 'KICK DRUM', subtitle: 'Sub bass pulse', colorText: 'text-emerald-400', activeColor: 'bg-emerald-500 shadow-emerald-500/35 text-black', bgGradient: 'from-emerald-500/10 via-emerald-500/2 to-transparent', borderColor: 'border-emerald-500/20' },
                  { id: 'hat' as TrackType, name: 'HI-HAT', subtitle: 'Metallic transient', colorText: 'text-cyan-400', activeColor: 'bg-cyan-400 shadow-cyan-400/35 text-black', bgGradient: 'from-cyan-500/10 via-cyan-500/2 to-transparent', borderColor: 'border-cyan-500/20' },
                  { id: 'clap' as TrackType, name: 'CLAP DRUM', subtitle: 'Pink/White noise', colorText: 'text-fuchsia-400', activeColor: 'bg-fuchsia-500 shadow-fuchsia-500/35 text-black', bgGradient: 'from-fuchsia-500/10 via-fuchsia-500/2 to-transparent', borderColor: 'border-fuchsia-500/20' },
                  { id: 'synth' as TrackType, name: 'ACID SYNTH', subtitle: '303 Melodic line', colorText: 'text-purple-400', activeColor: 'bg-purple-500 shadow-purple-500/35 text-white', bgGradient: 'from-purple-500/10 via-purple-500/2 to-transparent', borderColor: 'border-purple-500/20' },
                ].map((track) => {
                  const isAnySoloed = Object.values(soloedStems).some(Boolean);
                  const isTrackMuted = mutedStems[track.id];
                  const isTrackSoloed = soloedStems[track.id];
                  
                  // Active means it is not explicitly muted AND (either nothing is soloed or this track is soloed)
                  const isTrackActive = !isTrackMuted && (!isAnySoloed || isTrackSoloed);
                  const isTrackCurrentlyPlaying = isPlaying && patterns[track.id][currentStep] && isTrackActive;

                  return (
                    <div 
                      key={`row-terminal-${track.id}`} 
                      className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl border transition-all duration-150 ${
                        isTrackActive 
                          ? 'bg-[#0f0f12]/40 border-neutral-800/40' 
                          : 'bg-[#09090b]/20 border-neutral-900/60 opacity-55'
                      }`}
                    >
                      {/* Left: Stem header with state triggers */}
                      <div className={`col-span-3 p-2.5 rounded-lg border transition-all duration-150 flex flex-col justify-between h-full min-h-[95px] ${
                        isTrackActive 
                          ? `bg-gradient-to-b ${track.bgGradient} ${track.borderColor}` 
                          : 'bg-neutral-950/20 border-neutral-900/40'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Flasher LED */}
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-75 ${
                              isTrackCurrentlyPlaying 
                                ? `${track.id === 'kick' ? 'bg-emerald-400 shadow shadow-emerald-400' : track.id === 'hat' ? 'bg-cyan-400 shadow shadow-cyan-400' : track.id === 'clap' ? 'bg-fuchsia-400 shadow shadow-fuchsia-400' : 'bg-purple-400 shadow shadow-purple-400'} scale-110` 
                                : 'bg-neutral-900'
                            }`} />
                            <div>
                              <span className={`text-xs font-mono font-bold tracking-wider block ${track.colorText}`}>
                                {track.name}
                              </span>
                              <span className="text-[8px] font-mono text-neutral-500 block uppercase tracking-tight">
                                {track.subtitle}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stems mix toggles */}
                        <div className="flex gap-1.5 mt-2">
                          <button
                            onClick={() => handleToggleMute(track.id)}
                            className={`flex-1 py-1 px-1.5 rounded text-[9px] font-mono font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer select-none ${
                              isTrackMuted
                                ? 'bg-red-950/85 text-red-400 border border-red-800/60 shadow-md'
                                : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-500 border border-neutral-800/40'
                            }`}
                            title={`Mute ${track.name}`}
                          >
                            <VolumeX className="w-2.5 h-2.5" /> Mute
                          </button>
                          <button
                            onClick={() => handleToggleSolo(track.id)}
                            className={`flex-1 py-1 px-1.5 rounded text-[9px] font-mono font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer select-none ${
                              isTrackSoloed
                                ? 'bg-cyan-950/85 text-cyan-400 border border-cyan-800/60 shadow-md'
                                : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-500 border border-neutral-800/40'
                            }`}
                            title={`Solo ${track.name}`}
                          >
                            <Flame className="w-2.5 h-2.5" /> Solo
                          </button>
                        </div>

                        {/* Quick fill performance tools */}
                        <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-neutral-900">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleFillFourFour(track.id)}
                              className="text-[8px] font-mono text-neutral-500 hover:text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-800/80 cursor-pointer transition select-none"
                              title="Fill Standard 4/4 Beat"
                            >
                              4/4
                            </button>
                            <button
                              onClick={() => handleFillOffbeats(track.id)}
                              className="text-[8px] font-mono text-neutral-500 hover:text-cyan-400 bg-neutral-900 hover:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-800/80 cursor-pointer transition select-none"
                              title="Fill Offbeats"
                            >
                              Off
                            </button>
                            <button
                              onClick={() => handleRandomizeStem(track.id)}
                              className="text-[8px] font-mono text-neutral-500 hover:text-purple-400 bg-neutral-900 hover:bg-neutral-800 px-1 py-0.5 rounded border border-neutral-800/80 cursor-pointer flex items-center gap-0.5 transition select-none"
                              title="Randomize Pattern"
                            >
                              <Shuffle className="w-2 h-2" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleClearStem(track.id)}
                            className="text-[8px] font-mono text-red-500/70 hover:text-red-400 hover:bg-red-950/30 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800/80 cursor-pointer transition select-none"
                            title="Clear Pattern Grid"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Right: 16 Step Interactive pads */}
                      <div className="col-span-9 grid grid-cols-16 gap-1.5 relative">
                        {/* Playhead vertical highlight bar sweep behind the column */}
                        {isPlaying && (
                          <div 
                            className="absolute top-0 bottom-0 w-[6.25%] bg-sky-500/5 border-x border-sky-500/10 pointer-events-none rounded transition-all duration-75"
                            style={{ 
                              left: `${currentStep * 6.25}%`,
                            }}
                          />
                        )}

                        {patterns[track.id].map((active, idx) => {
                          const isPlayheadHere = currentStep === idx && isPlaying;
                          return (
                            <div key={`${track.id}-wrap-${idx}`} className="flex flex-col gap-1.5 items-center justify-center relative z-10">
                              <button
                                onClick={() => handleToggleStep(track.id, idx)}
                                className={`w-full aspect-square rounded-md transition-all duration-150 cursor-pointer ${
                                  active 
                                    ? isTrackActive 
                                      ? track.activeColor 
                                      : 'bg-neutral-600 text-neutral-300 border border-neutral-500' 
                                    : idx % 4 === 0 
                                      ? 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-500 border border-neutral-700/50' 
                                      : 'bg-[#141418] hover:bg-neutral-800 text-neutral-600'
                                } ${
                                  isPlayheadHere 
                                    ? 'ring-2 ring-white scale-105 shadow-md shadow-neutral-100/10' 
                                    : ''
                                }`}
                                title={`${track.name} step ${idx + 1}`}
                              />
                              
                              {track.id === 'synth' ? (
                                <button
                                  onClick={() => handleCycleSynthNote(idx)}
                                  disabled={!active}
                                  className={`text-[8px] font-mono px-1 py-0.5 rounded transition select-none ${
                                    active 
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800/40 hover:bg-purple-900 cursor-pointer' 
                                      : 'text-neutral-700 border border-transparent'
                                  }`}
                                  title="Change note pitch"
                                >
                                  {active ? activeScaleNotes[synthNotes[idx] ?? 0] : '—'}
                                </button>
                              ) : (
                                <span className={`text-[8px] font-mono select-none ${isPlayheadHere ? 'text-neutral-300 font-bold' : 'text-neutral-700'}`}>
                                  {idx % 4 === 0 ? `•` : ' '}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* VISUAL PLAYHEAD / TAKT MARKER LED ROW */}
                <div className="grid grid-cols-12 gap-4 items-center border-t border-neutral-800/60 pt-4 mt-2">
                  <div className="col-span-3 pr-2 flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase block">Visual Takt</span>
                      <span className="text-[8px] font-mono text-neutral-600 uppercase">Playhead Index</span>
                    </div>
                  </div>
                  <div className="col-span-9 grid grid-cols-16 gap-1.5">
                    {Array(16).fill(null).map((_, idx) => {
                      const isActive = currentStep === idx && isPlaying;
                      return (
                        <div key={`playhead-indicator-${idx}`} className="flex flex-col items-center justify-center relative group">
                          {/* Beat bar marker indicator */}
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-75 ${
                            isActive 
                              ? 'bg-sky-400 text-black font-bold scale-115 shadow-md shadow-sky-400/80 animate-pulse' 
                              : idx % 4 === 0 
                                ? 'bg-neutral-800 text-neutral-400 font-semibold border border-neutral-700' 
                                : 'bg-neutral-900 text-neutral-600'
                          }`}>
                            <span className="text-[9px] font-mono">{idx + 1}</span>
                          </div>
                          {/* Beat bar marker */}
                          <div className={`w-1 h-1.5 rounded-full mt-1.5 transition-all duration-75 ${
                            isActive 
                              ? 'bg-sky-400' 
                              : idx % 4 === 0 
                                ? 'bg-neutral-600' 
                                : 'bg-neutral-800'
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Pitch Scale Selector */}
            <div className="border-t border-neutral-800/50 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">Harmonic Acid Scale:</span>
                <select
                  value={scale}
                  onChange={(e) => {
                    const nextScale = e.target.value as keyof typeof MUSIC_SCALES;
                    setScale(nextScale);
                    audioEngine.setScale(nextScale);
                  }}
                  className="bg-[#121215] border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-sky-400 rounded px-2.5 py-1.5 focus:outline-none"
                >
                  {Object.keys(MUSIC_SCALES).map((scaleName) => (
                    <option key={scaleName} value={scaleName}>{scaleName}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] font-mono text-neutral-500 leading-normal flex items-center gap-2 bg-[#121215] px-3 py-2 rounded-lg border border-neutral-800/60">
                <span className="w-2 h-2 bg-sky-500/20 border border-sky-500/40 rounded-full"></span>
                Interactive scale tones mapped to steps: {activeScaleNotes.join(', ')}
              </div>
            </div>
          </section>

        </div>

        {/* FULL WIDTH BOTTOM SECTION: Color-Coded Sample Database */}
        <div className="col-span-1 lg:col-span-12 flex flex-col gap-6 mt-4">
          <section className="bg-[#0c0c0e] p-6 rounded-xl border border-neutral-800/80 shadow-2xl flex flex-col gap-6">
            
            {/* Header section with notifications */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-neutral-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                  <Database className="w-5 h-5 text-sky-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-neutral-200">
                    Muster- & Sample-Datenbank (Katalog)
                  </h3>
                  <p className="text-xs font-mono text-neutral-500 mt-0.5">
                    Live-Verwaltung von kostenlosen, eigenen und generierten Audio-Modellierungen.
                  </p>
                </div>
              </div>

              {/* Save current sequence button */}
              <button
                onClick={handleSaveCurrentAsSample}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono font-bold text-neutral-300 hover:text-sky-400 border border-neutral-800 rounded-lg flex items-center gap-2 transition cursor-pointer select-none active:scale-95"
                title="Sichert die aktuellen Parameter als neues Loop-Sample"
              >
                <Save className="w-3.5 h-3.5" />
                Groove als Sample sichern
              </button>
            </div>

            {/* Notification area */}
            {sampleSuccessMsg && (
              <div className="bg-sky-950/20 border border-sky-800/40 text-sky-400 p-3 rounded-lg text-xs font-mono flex items-center gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0 animate-bounce" />
                <span>{sampleSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column inside Database: Sample List & Filtering (8 cols) */}
              <div className="xl:col-span-8 flex flex-col gap-4">
                
                {/* Tabs filter */}
                <div className="flex gap-2 bg-[#09090b] p-1 rounded-lg border border-neutral-800 max-w-fit">
                  <button
                    onClick={() => setActiveSampleTab('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition select-none cursor-pointer ${
                      activeSampleTab === 'all' 
                        ? 'bg-neutral-800 text-neutral-200' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Alle Frequenzen ({samples.length})
                  </button>
                  <button
                    onClick={() => setActiveSampleTab('bass')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 select-none cursor-pointer ${
                      activeSampleTab === 'bass' 
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' 
                        : 'text-neutral-500 hover:text-sky-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Bass / Lows ({samples.filter(s => s.category === 'bass').length})
                  </button>
                  <button
                    onClick={() => setActiveSampleTab('mids')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 select-none cursor-pointer ${
                      activeSampleTab === 'mids' 
                        ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30' 
                        : 'text-neutral-500 hover:text-fuchsia-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></span>
                    Mids ({samples.filter(s => s.category === 'mids').length})
                  </button>
                  <button
                    onClick={() => setActiveSampleTab('highs')}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 select-none cursor-pointer ${
                      activeSampleTab === 'highs' 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                        : 'text-neutral-500 hover:text-cyan-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    Highs ({samples.filter(s => s.category === 'highs').length})
                  </button>
                </div>

                {/* Samples List Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {samples
                    .filter(sample => activeSampleTab === 'all' || sample.category === activeSampleTab)
                    .map(sample => {
                      // Category-based coloring definitions
                      const isBass = sample.category === 'bass';
                      const isMids = sample.category === 'mids';
                      const isHighs = sample.category === 'highs';

                      let colorBorder = 'border-emerald-500/20 hover:border-emerald-500/40';
                      let colorBg = 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]';
                      let colorText = 'text-emerald-400';
                      let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                      if (isMids) {
                        colorBorder = 'border-fuchsia-500/20 hover:border-fuchsia-500/40';
                        colorBg = 'bg-fuchsia-500/[0.02] hover:bg-fuchsia-500/[0.05]';
                        colorText = 'text-fuchsia-400';
                        badgeStyle = 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20';
                      } else if (isHighs) {
                        colorBorder = 'border-cyan-500/20 hover:border-cyan-500/40';
                        colorBg = 'bg-cyan-500/[0.02] hover:bg-cyan-500/[0.05]';
                        colorText = 'text-cyan-400';
                        badgeStyle = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                      }

                      return (
                        <div
                          key={sample.id}
                          className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${colorBorder} ${colorBg}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeStyle}`}>
                                {sample.type}
                              </span>
                              <span className="text-[9px] font-mono text-neutral-500 uppercase">
                                {sample.id.startsWith('custom-') ? 'EIGEN' : sample.id.startsWith('generated-') ? 'GENERIERT' : 'FREE'}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold font-mono text-neutral-200 mt-2 truncate">
                              {sample.name}
                            </h4>
                            <p className="text-[11px] text-neutral-400 font-sans leading-normal mt-1 line-clamp-2">
                              {sample.description}
                            </p>
                          </div>

                          {/* Sound parameter indicators */}
                          <div className="bg-[#08080a] p-2 rounded border border-neutral-900 flex justify-between text-[10px] font-mono text-neutral-500">
                            <span>Freq: {sample.parameters.frequency ? `${sample.parameters.frequency}Hz` : 'Auto'}</span>
                            <span>Decay: {sample.parameters.decay ? `${sample.parameters.decay}s` : 'Standard'}</span>
                          </div>

                          {/* Interactive control buttons */}
                          <div className="flex gap-2">
                            {/* Preview Sound Trigger */}
                            <button
                              onClick={() => handlePreviewSample(sample)}
                              className={`flex-1 py-1.5 px-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-mono font-bold transition flex items-center justify-center gap-1.5 select-none cursor-pointer active:scale-95 ${colorText}`}
                            >
                              <Play className="w-3 h-3 fill-current" />
                              Anhören
                            </button>

                            {/* Load destination selector */}
                            <div className="flex gap-1">
                              {isBass && (
                                <>
                                  <button
                                    onClick={() => handleLoadSampleToTrack(sample, 'kick')}
                                    className="px-2 py-1.5 bg-neutral-950 hover:bg-emerald-950/40 text-[9px] font-mono text-neutral-400 hover:text-emerald-400 border border-neutral-800 hover:border-emerald-900 rounded transition cursor-pointer select-none"
                                    title="Als KICK-Spur laden"
                                  >
                                    To Kick
                                  </button>
                                  <button
                                    onClick={() => handleLoadSampleToTrack(sample, 'synth')}
                                    className="px-2 py-1.5 bg-neutral-950 hover:bg-purple-950/40 text-[9px] font-mono text-neutral-400 hover:text-purple-400 border border-neutral-800 hover:border-purple-900 rounded transition cursor-pointer select-none"
                                    title="Als ACID BASS laden"
                                  >
                                    To Synth
                                  </button>
                                </>
                              )}
                              {isMids && (
                                <button
                                  onClick={() => handleLoadSampleToTrack(sample, 'clap')}
                                  className="px-2 py-1.5 bg-neutral-950 hover:bg-fuchsia-950/40 text-[9px] font-mono text-neutral-400 hover:text-fuchsia-400 border border-neutral-800 hover:border-fuchsia-900 rounded transition cursor-pointer select-none"
                                  title="Als CLAP-Spur laden"
                                >
                                  To Clap
                                </button>
                              )}
                              {isHighs && (
                                <button
                                  onClick={() => handleLoadSampleToTrack(sample, 'hat')}
                                  className="px-2 py-1.5 bg-neutral-950 hover:bg-cyan-950/40 text-[9px] font-mono text-neutral-400 hover:text-cyan-400 border border-neutral-800 hover:border-cyan-900 rounded transition cursor-pointer select-none"
                                  title="Als HI-HAT-Spur laden"
                                >
                                  To Hat
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column inside Database: Add Custom Sample Form (4 cols) */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                <div className="bg-[#09090b] p-5 rounded-xl border border-neutral-800/80 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-bold font-mono uppercase text-neutral-300">
                      Eigenes Analog-Sample hinzufügen
                    </h4>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-mono leading-relaxed">
                    Registriere ein selbst modelliertes Synthesizer- oder Drum-Sample in der lokalen Station.
                  </p>

                  <form onSubmit={handleAddCustomSample} className="flex flex-col gap-3.5">
                    {/* Name */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase">Sample-Bezeichnung</label>
                      <input
                        type="text"
                        placeholder="z.B. Industrial Distortion Snare"
                        value={customSampleName}
                        onChange={(e) => setCustomSampleName(e.target.value)}
                        className="bg-[#121215] border border-neutral-800 focus:border-sky-500 text-xs rounded px-3 py-2 text-neutral-200 focus:outline-none transition font-sans"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase">Frequenzbereich (Kategorie)</label>
                      <select
                        value={customSampleCategory}
                        onChange={(e) => {
                          const cat = e.target.value as 'bass' | 'mids' | 'highs';
                          setCustomSampleCategory(cat);
                          setCustomSampleType(cat === 'bass' ? 'Kick' : cat === 'mids' ? 'Clap' : 'Hi-Hat');
                        }}
                        className="bg-[#121215] border border-neutral-800 text-xs font-mono rounded px-3 py-2 text-neutral-300 focus:outline-none"
                      >
                        <option value="bass">Bass / Lows (Grün)</option>
                        <option value="mids">Mids / Mitten (Fuchsia)</option>
                        <option value="highs">Highs / Höhen (Cyan)</option>
                      </select>
                    </div>

                    {/* Type descriptor */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase">Instrumenten-Typ</label>
                      <input
                        type="text"
                        placeholder="z.B. Kick, Clap, Shaker, Sub Bass"
                        value={customSampleType}
                        onChange={(e) => setCustomSampleType(e.target.value)}
                        className="bg-[#121215] border border-neutral-800 focus:border-sky-500 text-xs rounded px-3 py-2 text-neutral-200 focus:outline-none transition font-sans"
                        required
                      />
                    </div>

                    {/* Freq Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 uppercase">
                        <span>Basis-Frequenz</span>
                        <span className="text-sky-400">{customSampleFreq} Hz</span>
                      </div>
                      <input
                        type="range"
                        min={customSampleCategory === 'bass' ? '30' : customSampleCategory === 'mids' ? '300' : '3000'}
                        max={customSampleCategory === 'bass' ? '250' : customSampleCategory === 'mids' ? '2500' : '12000'}
                        step="10"
                        value={customSampleFreq}
                        onChange={(e) => setCustomSampleFreq(Number(e.target.value))}
                        className="w-full h-1 bg-[#121215] rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!customSampleName.trim()}
                      className="w-full py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-black font-semibold rounded text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      In Datenbank speichern
                    </button>
                  </form>
                </div>
              </div>

            </div>

          </section>
        </div>

      </main>

      {/* Page Footer */}
      <footer className="border-t border-neutral-800/60 bg-[#0a0a0c] py-4 text-center text-xs text-neutral-600 font-mono tracking-wide">
        sampleMONK // Sound, Samples & Effektmaschine • Powered by Tone.js & Gemini 3.5 Flash
      </footer>
    </div>
  );
}
