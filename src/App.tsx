import { motion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { User,  
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
  Radio,
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
  CloudLightning, Terminal, Grid3X3, Maximize2, Minimize2, Box, Keyboard, Layers, Mic, Puzzle, Waves, Speaker, Cpu
  } from 'lucide-react';
import { useCollabSession } from './utils/collab';
import { Users, Lock } from 'lucide-react';
import { HypergraphVisualizer } from './components/HypergraphVisualizer';
import { TrackPreset, TrackType, MUSIC_SCALES } from './types';
import { TECHNO_PRESETS } from './presets';
import { audioEngine } from './utils/audioEngine';
import { BeatVisualizer } from './components/BeatVisualizer';
import { DraggableWindow } from './components/DraggableWindow';
import { SequencerPluginTerminal } from './components/SequencerPluginTerminal';
import { SampleMonkLogo } from './components/SampleMonkLogo';
import { MasteringOverlay } from './components/MasteringOverlay';
import { MischpultTerminal } from './components/MischpultTerminal';
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
import { PRESET_SAMPLE_DATABASE, AudioSample } from './data/samples';
import { savePresetToCloud, fetchPresetsFromCloud, seedDatabase, uploadAudioElementToCloud } from './utils/firebase';


export type PluginId = keyof typeof defaultModules;
const defaultModules = {
  mischpult: 'inactive', sequencer: 'autonomous', sample_db: 'autonomous', drum_machines: 'inactive',
  instruments: 'inactive', spatial: 'inactive', eq: 'inactive', mastering: 'autonomous', midi: 'inactive',
  dj_fx: 'autonomous', stem_extractor: 'inactive', voice_gen: 'inactive', ai_terminal: 'autonomous',
  recorder: 'inactive', dsp: 'inactive', custom_slot: 'inactive'
};

export const PLUGIN_REGISTRY = [
  { id: 'mischpult', name: 'Mischpult', short: 'MIX', color: 'blue', icon: Sliders },
  { id: 'sequencer', name: 'Sequenzer', short: 'SEQ', color: 'amber', icon: Grid3X3 },
  { id: 'sample_db', name: 'Library', short: 'LIB', color: 'fuchsia', icon: Database },
  { id: 'drum_machines', name: 'Drum-Machines', short: 'DRM', color: 'yellow', icon: Speaker },
  { id: 'instruments', name: 'Instrumenten', short: 'INS', color: 'purple', icon: Music },
  { id: 'spatial', name: 'Spatial Audio', short: '3D', color: 'lime', icon: Box },
  { id: 'eq', name: 'Equalizer', short: 'EQ', color: 'teal', icon: Waves },
  { id: 'mastering', name: 'Mastering', short: 'MST', color: 'emerald', icon: Activity },
  { id: 'midi', name: 'MIDI Ctrl', short: 'MID', color: 'pink', icon: Keyboard },
  { id: 'dj_fx', name: 'Effektmaschine', short: 'FX', color: 'rose', icon: Sparkles },
  { id: 'stem_extractor', name: 'Remix Extractor', short: 'RMX', color: 'red', icon: Layers },
  { id: 'voice_gen', name: 'Voice Gen', short: 'VOX', color: 'orange', icon: Mic },
  { id: 'ai_terminal', name: 'Critic-Agent', short: 'EMCS', color: 'cyan', icon: Cpu },
  { id: 'recorder', name: 'Master Recorder', short: 'REC', color: 'indigo', icon: Radio },
  { id: 'dsp', name: 'Digital Signal Processor', short: 'DSP', color: 'violet', icon: Activity },
  { id: 'custom_slot', name: 'Custom Sandbox', short: 'CUS', color: 'sky', icon: Puzzle },
];

export default function App() {

  // Collab Session
  const collab = useCollabSession();
  
  // Update local state when collab session changes
  useEffect(() => {
    if (collab.session) {
      const myId = collab.localUser.id;
      
      // If we don't have the lock, mirror the remote state
      if (collab.session.locks['mischpult'] !== myId) {
        setIsPlaying(collab.session.playback.isPlaying);
        setBpm(collab.session.playback.bpm);
      }
      if (collab.session.locks['sequencer'] !== myId) {
        setPatterns(collab.session.sequencer.patterns);
        setSynthNotes(collab.session.sequencer.synthNotes);
      }
      if (collab.session.locks['mastering'] !== myId) {
        setCutoff(collab.session.mastering.cutoff);
        setResonance(collab.session.mastering.resonance);
        setDelayWet(collab.session.mastering.delayTime);
        setDecay(collab.session.mastering.decay);
      }
    }
  }, [collab.session]);
  // Preset state
  const [activePreset, setActivePreset] = useState<TrackPreset>(TECHNO_PRESETS[0]);
  const [presetTab, setPresetTab] = useState<'studio' | 'cloud' | 'matrix'>('studio');
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
    kick: false, hat: false, clap: false, synth: false, snare: false, tom: false, perc: false, bass: false
  });
  const [soloedStems, setSoloedStems] = useState<Record<TrackType, boolean>>({
    kick: false, hat: false, clap: false, synth: false, snare: false, tom: false, perc: false, bass: false
  });

  // Sample database state
  const [samples, setSamples] = useState<AudioSample[]>(PRESET_SAMPLE_DATABASE);
  const [customSampleName, setCustomSampleName] = useState('');
  const [customSampleCategory, setCustomSampleCategory] = useState<'bass' | 'mids' | 'highs'>('bass');
  const [customSampleType, setCustomSampleType] = useState('Kick');
  const [customSampleFreq, setCustomSampleFreq] = useState(60);
  const [activeSampleTab, setActiveSampleTab] = useState<'all' | 'bass' | 'mids' | 'highs'>('all');
  const [isMasteringOverlayOpen, setMasteringOverlayOpen] = useState(false);
  const [activeMasteringPlugin, setActiveMasteringPlugin] = useState<'master_me' | 'tone_shift_eq'>('master_me');
  const [masterMeActive, setMasterMeActive] = useState(true);
  const [toneShiftActive, setToneShiftActive] = useState(true);
  
  // Module Layout States
  const [modules, setModules] = useState({
    mischpult: 'inactive',
    sequencer: 'autonomous',
    sample_db: 'autonomous',
    drum_machines: 'inactive',
    instruments: 'inactive',
    spatial: 'inactive',
    eq: 'inactive',
    mastering: 'autonomous',
    midi: 'inactive',
    dj_fx: 'autonomous',
    stem_extractor: 'inactive',
    voice_gen: 'inactive',
    ai_terminal: 'autonomous',
    slot_14: 'inactive',
    slot_15: 'inactive',
    slot_16: 'inactive',
    slot_17: 'inactive',
    slot_18: 'inactive',
    slot_19: 'inactive',
    slot_20: 'inactive'
  });

  const toggleModule = (mod: PluginId) => {
    setModules(prev => {
      const current = prev[mod];
      if (current === 'inactive') return { ...prev, [mod]: 'autonomous' };
      if (current === 'autonomous') {
         // Attempt to acquire lock when opening terminal
         if (collab.session && !collab.isLocked(mod)) {
            collab.acquireLock(mod);
         }
         return { ...prev, [mod]: 'active' };
      }
      // Releasing terminal
      if (collab.session && collab.session.locks[mod] === collab.localUser.id) {
         collab.releaseLock(mod);
      }
      return { ...prev, [mod]: 'inactive' };
    });
  };
  
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

  // Matrix / Database Seed state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  
  // Custom Audio Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadType, setUploadType] = useState<'sample' | 'song' | 'noise'>('sample');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Zip Import State
  const [zipUrlsText, setZipUrlsText] = useState('');
  const [importTaskId, setImportTaskId] = useState<string | null>(null);
  const [importStatusInfo, setImportStatusInfo] = useState<{status: string, progress: string, url: string} | null>(null);

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

  useEffect(() => {
    let interval: any;
    if (importTaskId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/import-status/${importTaskId}`);
          const data = await res.json();
          setImportStatusInfo(data.status);
          if (data.status && data.status.status === 'completed') {
            clearInterval(interval);
            setImportTaskId(null);
            // Refresh samples
            const sRes = await fetch('/api/samples');
            const sData = await sRes.json();
            if (sData.samples) {
              setSamples(prev => {
                const newIds = new Set(sData.samples.map((s: any) => s.id));
                return [...prev.filter(p => !newIds.has(p.id)), ...sData.samples];
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [importTaskId]);

  const handleStartImport = async () => {
    if (!zipUrlsText.trim()) return;
    const urls = zipUrlsText.split('\n').map(u => u.trim()).filter(u => u);
    if (urls.length === 0) return;
    
    try {
      const res = await fetch('/api/import-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      const data = await res.json();
      if (res.ok) {
        setImportTaskId(data.taskId);
        setZipUrlsText('');
      } else {
        alert("Error starting import: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Error starting import");
    }
  };

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

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedMsg('');
    const res = await seedDatabase();
    setSeedMsg(res.message);
    setIsSeeding(false);
    setTimeout(() => setSeedMsg(''), 6000);
  };

  const handleCustomUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName) return;
    
    setIsUploading(true);
    setUploadMsg('');
    
    const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await uploadAudioElementToCloud(uploadFile, uploadName, uploadType, tagsArray);
    
    setUploadMsg(res.message);
    setIsUploading(false);
    
    if (res.success) {
      setUploadFile(null);
      setUploadName('');
      setUploadTags('');
      setUploadType('sample');
      setTimeout(() => setUploadMsg(''), 4000);
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
    const fetchLocalSamples = async () => {
      try {
        const res = await fetch('/api/samples');
        const data = await res.json();
        if (data.samples && data.samples.length > 0) {
          setSamples(prev => {
            const newIds = new Set(data.samples.map((s: any) => s.id));
            return [...prev.filter(p => !newIds.has(p.id)), ...data.samples];
          });
        }
      } catch (e) {
        console.error("Could not load local samples", e);
      }
    };
    fetchLocalSamples();
  }, []);

  useEffect(() => {
    const isAnySoloed = Object.values(soloedStems).some(Boolean);
    const finalMuteStates = {
      kick: mutedStems.kick || (isAnySoloed && !soloedStems.kick),
      hat: mutedStems.hat || (isAnySoloed && !soloedStems.hat),
      clap: mutedStems.clap || (isAnySoloed && !soloedStems.clap),
      synth: mutedStems.synth || (isAnySoloed && !soloedStems.synth),
      snare: mutedStems.snare || (isAnySoloed && !soloedStems.snare),
      tom: mutedStems.tom || (isAnySoloed && !soloedStems.tom),
      perc: mutedStems.perc || (isAnySoloed && !soloedStems.perc),
      bass: mutedStems.bass || (isAnySoloed && !soloedStems.bass),
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
    setMutedStems({ kick: false, hat: false, clap: false, synth: false, snare: false, tom: false, perc: false, bass: false });
    setSoloedStems({ kick: false, hat: false, clap: false, synth: false, snare: false, tom: false, perc: false, bass: false });
  };

  // Sample Database Handlers
  const handlePreviewSample = async (sample: AudioSample) => {
    try {
      await audioEngine.previewSample(sample.category, sample.parameters.frequency, sample.url);
    } catch (err) {
      console.error('Error previewing sample:', err);
    }
  };

  const handleLoadSampleToTrack = (sample: AudioSample, targetTrack: TrackType) => {
    // If it's a WAV file from public/samples, load it directly to the engine track
    if (sample.url) {
      audioEngine.loadTrackSample(targetTrack, sample.url);
    } else {
      // Clear out loaded sample if returning to synth mode
      audioEngine.loadTrackSample(targetTrack, null);
    }

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
      collab.updatePlayback({ isPlaying: true });
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage('Could not initialize audio engine. Try interacting with the page first.');
    }
  };

  const handlePause = () => {
    audioEngine.pause();
    setIsPlaying(false);
    collab.updatePlayback({ isPlaying: false });
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    collab.updatePlayback({ isPlaying: false });
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
      synth: Array(16).fill(false),
      snare: Array(16).fill(false),
      tom: Array(16).fill(false),
      perc: Array(16).fill(false),
      bass: Array(16).fill(false)
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
      <HypergraphVisualizer />
      {/* Top Header / Nav */}
      <header className="border-b border-neutral-800/60 bg-[#0c0c0e]/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4">
          
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start">
            {/* Collab Users */}
            <div className="flex -space-x-2">
              {collab.session && Object.values(collab.session.activeUsers || {}).filter((u: any) => u && u.name).map((u: any) => (
                <div key={u.name} 
                     title={u.name}
                     className="w-8 h-8 rounded-full border-2 border-[#0c0c0e] flex items-center justify-center text-xs font-bold shadow-sm"
                     style={{ backgroundColor: u.color || '#fff', color: '#000' }}>
                  {u.name.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>

            {/* Playback Controls (Mobile/Tablet Only) */}
            <div className="flex lg:hidden items-center gap-2 bg-[#121215] p-1.5 rounded-lg border border-neutral-800">
              {isPlaying ? (
                <button 
                  id="pause-btn-mobile"
                  onClick={handlePause}
                  className="p-2 rounded-md bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 transition"
                  title="Pause"
                >
                  <Pause className="w-4 h-4 fill-amber-400" />
                </button>
              ) : (
                <button 
                  id="play-btn-mobile"
                  onClick={handlePlay}
                  className="p-2 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 transition flex items-center gap-1.5 font-mono text-xs font-bold"
                  title="Play Sequence"
                >
                  <Play className="w-3.5 h-3.5 fill-sky-400" />
                </button>
              )}
              <button 
                id="stop-btn-mobile"
                onClick={handleStop}
                className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 transition"
                title="Stop"
              >
                <Square className="w-4 h-4 fill-neutral-400" />
              </button>
              <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>
              <button 
                id="clear-btn-mobile"
                onClick={handleClearPatterns}
                className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition"
                title="Clear Sequence Grid"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* The 16 Logos */}
          <div className="grid grid-cols-4 md:grid-cols-8 lg:flex lg:flex-row items-center gap-2 lg:gap-1.5 xl:gap-2">
            {PLUGIN_REGISTRY.map(plugin => {
               const isActive = modules[plugin.id] !== 'inactive';
               const isLocked = collab.isLocked(plugin.id);
               const Icon = plugin.icon;
               
               // Dynamic color classes based on plugin.color
               const colorClassMap: Record<string, string> = {
                 'blue': 'text-blue-400 border-blue-500/50 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
                 'amber': 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
                 'fuchsia': 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10 shadow-[0_0_10px_rgba(217,70,239,0.3)]',
                 'yellow': 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
                 'purple': 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
                 'lime': 'text-lime-400 border-lime-500/50 bg-lime-500/10 shadow-[0_0_10px_rgba(132,204,22,0.3)]',
                 'teal': 'text-teal-400 border-teal-500/50 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.3)]',
                 'emerald': 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
                 'pink': 'text-pink-400 border-pink-500/50 bg-pink-500/10 shadow-[0_0_10px_rgba(236,72,153,0.3)]',
                 'rose': 'text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
                 'red': 'text-red-400 border-red-500/50 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
                 'orange': 'text-orange-400 border-orange-500/50 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
                 'cyan': 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
                 'indigo': 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.3)]',
                 'violet': 'text-violet-400 border-violet-500/50 bg-violet-500/10 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
                 'sky': 'text-sky-400 border-sky-500/50 bg-sky-500/10 shadow-[0_0_10px_rgba(14,165,233,0.3)]',
               };
               
               const activeClasses = colorClassMap[plugin.color] || 'text-white border-white/50 bg-white/10';
               const inactiveClasses = 'text-neutral-500 border-transparent hover:bg-neutral-800 hover:text-neutral-300';
               const classes = isActive ? activeClasses : inactiveClasses;
               const lockedClasses = isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer';

               return (
                 <button
                   key={plugin.id}
                   onClick={() => toggleModule(plugin.id)}
                   disabled={isLocked}
                   className={`p-2 rounded-lg border transition-all flex items-center justify-center ${classes} ${lockedClasses}`}
                   title={plugin.name}
                 >
                   <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5" />
                 </button>
               );
            })}
          </div>

          {/* Playback Controls (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-2 bg-[#121215] p-1.5 rounded-lg border border-neutral-800">
            {isPlaying ? (
              <button 
                id="pause-btn"
                onClick={handlePause}
                className="p-2 rounded-md bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 transition"
                title="Pause"
              >
                <Pause className="w-4 h-4 fill-amber-400" />
              </button>
            ) : (
              <button 
                id="play-btn"
                onClick={handlePlay}
                className="p-2 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 transition flex items-center gap-1.5 font-mono text-xs font-bold"
                title="Play Sequence"
              >
                <Play className="w-3.5 h-3.5 fill-sky-400" />
              </button>
            )}
            <button 
              id="stop-btn"
              onClick={handleStop}
              className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 transition"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-neutral-400" />
            </button>
            <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>
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
        {modules.ai_terminal === 'active' && (
          <div className={`flex flex-col gap-6 ${modules.sequencer === 'active' ? 'lg:col-span-5' : 'lg:col-span-11'} ${collab.isLocked('ai_terminal') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          
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
                <button
                  onClick={() => setPresetTab('matrix')}
                  className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${presetTab === 'matrix' ? 'bg-fuchsia-500/15 text-fuchsia-400 font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Matrix
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
            ) : presetTab === 'cloud' ? (
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
                    <span className="text-xs font-mono text-neutral-500">Querying sampleMONK Firestore...</span>
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
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Data Matrix Connector</span>
                  <Database className="w-3.5 h-3.5 text-fuchsia-400" />
                </div>
                <div className="bg-[#121215] p-3 rounded-lg border border-neutral-800/80 text-xs font-mono text-neutral-400 leading-relaxed">
                  Connect and pull samples, sounds, and motion sequences from external sites like Freesound.org, MusicRadar, Legowelt, and FunctionLoops into the deep Firestore Matrix.
                </div>
                <button
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold font-mono text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Syncing External Nodes...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      Seed Database Matrix
                    </>
                  )}
                </button>
                {seedMsg && (
                  <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-center mt-1 bg-emerald-500/10 py-1.5 rounded border border-emerald-500/25 p-2 text-center leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {seedMsg}
                  </div>
                )}
                
                <div className="border-t border-neutral-800/80 my-2"></div>
                
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Direct Matrix Upload</span>
                  <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
                </div>
                
                <form onSubmit={handleCustomUpload} className="bg-[#121215] p-3 rounded-lg border border-neutral-800/80 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Audio File</label>
                    <input 
                      type="file" 
                      accept="audio/*"
                      required
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="text-xs text-neutral-400 font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-sky-500/20 file:text-sky-400 hover:file:bg-sky-500/30 transition-colors"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Name & Type</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        placeholder="e.g. Deep Kick 01" 
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500/60 font-mono"
                      />
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value as any)}
                        className="w-[90px] bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500/60 font-mono"
                      >
                        <option value="sample">Sample</option>
                        <option value="song">Song</option>
                        <option value="noise">Noise</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      required
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="e.g. Kick, Techno, XXL, 808" 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-sky-500/60 font-mono"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile || !uploadName}
                    className="w-full mt-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 disabled:bg-neutral-800 disabled:text-neutral-500 font-bold font-mono text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-sky-500/30"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload & Tag
                      </>
                    )}
                  </button>
                  
                  {uploadMsg && (
                    <div className={`text-[10px] font-mono flex items-center gap-1 justify-center mt-1 py-1.5 rounded border p-2 text-center leading-relaxed ${uploadMsg.includes('failed') ? 'text-red-400 bg-red-500/10 border-red-500/25' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'}`}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {uploadMsg}
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
                    collab.updateMastering({ cutoff: val });
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
                    collab.updateMastering({ resonance: val });
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
                    collab.updateMastering({ decay: val });
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
        )}

        {/* RIGHT COLUMN: Step Sequencer & AI Prompter (7 Cols) */}
        {modules.sequencer === 'active' && (
          <div className={`flex flex-col gap-6 ${modules.ai_terminal === 'active' ? 'lg:col-span-7' : 'lg:col-span-11'} ${collab.isLocked('sequencer') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>

          {/* AI Generator Panel */}
          <section className="bg-[#0c0c0e] p-5 rounded-xl border border-neutral-800/80 shadow-xl">
            <h3 className="text-xs font-mono text-neutral-400 tracking-wider uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" /> Critic-Agent (EMCS) Terminal
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Holographic Resonance Prompting (HRP) Interface. Describe the desired sonic architecture, and the Critic-Agent will evaluate masking and dynamically synthesize parameters.
            </p>
            
            <form onSubmit={handleGenerateAiPreset} className="flex gap-2">
              <input
                id="ai-prompt-input"
                type="text"
                placeholder="Enter HRP prompt (e.g., 'Optimize mix for club PAs, keep warm 70s transients')..."
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

                    {/* Interactive Sequencer Board (PLUGIN TERMINAL) */}
          <SequencerPluginTerminal 
            isPlaying={isPlaying}
            currentStep={currentStep}
            tracks={patterns}
            synthNotes={synthNotes}
            onToggleStep={handleToggleStep}
            onSynthNoteChange={handleCycleSynthNote}
            bpm={bpm}
            setBpm={(b) => { setBpm(b); collab.updatePlayback({ bpm: b }); }}
            onPlay={handlePlay}
            onStop={handleStop}
          />

        </div>
        )}


        {/* FULL WIDTH BOTTOM SECTION: Color-Coded Sample Database */}
        {modules.sample_db === 'active' && (
        <div className={`col-span-1 lg:col-span-12 flex flex-col gap-6 mt-4 ${collab.isLocked('sample_db') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
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

            {/* Zip Batch Downloader Area */}
            <div className="bg-[#121215] p-4 rounded-xl border border-neutral-800 flex flex-col gap-3">
              <h4 className="text-xs font-mono font-bold text-neutral-300">ZIP-Batch Downloader (Cloud Storage)</h4>
              <p className="text-[10px] text-neutral-500 font-mono">
                Lade beliebig große Sample-Packs (bis 100GB). Der Server streamt die Dateien direkt in den Cloud-Storage (Firebase Bucket), entpackt die WAV-Dateien und legt sie in der Datenbank ab.
              </p>
              
              <div className="flex flex-col gap-2">
                <textarea
                  value={zipUrlsText}
                  onChange={(e) => setZipUrlsText(e.target.value)}
                  placeholder="Füge hier Download-URLs zu .zip Dateien ein (eine URL pro Zeile)..."
                  className="w-full h-20 bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-300 font-mono focus:border-sky-500 focus:outline-none resize-none"
                  disabled={!!importTaskId}
                />
                
                <div className="flex justify-between items-center">
                  <button
                    onClick={handleStartImport}
                    disabled={!!importTaskId || !zipUrlsText.trim()}
                    className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-mono font-bold border border-sky-500/30 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importTaskId ? 'Import läuft...' : 'ZIPs importieren'}
                  </button>
                  
                  {importTaskId && importStatusInfo && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-sky-400">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                      {importStatusInfo.status === 'processing' 
                        ? `Lade & entpacke: ${importStatusInfo.url.substring(0, 30)}... (${importStatusInfo.progress})` 
                        : 'Abgeschlossen!'}
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                    .map((sample, idx) => {
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
                          key={`${sample.id}-${idx}`}
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
        )}
        {modules.mischpult === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('mischpult') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><MischpultTerminal /></DraggableWindow>
          </div>
        )}
        {modules.drum_machines === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('drum_machines') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><DrumMachineTerminal /></DraggableWindow>
          </div>
        )}
        {modules.instruments === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('instruments') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><InstrumentsTerminal /></DraggableWindow>
          </div>
        )}
        {modules.stem_extractor === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('stem_extractor') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><StemExtractorTerminal /></DraggableWindow>
          </div>
        )}
        {modules.voice_gen === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('voice_gen') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><VoiceGenTerminal /></DraggableWindow>
          </div>
        )}
        {modules.spatial === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('spatial') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><SpatialPluginTerminal /></DraggableWindow>
          </div>
        )}
        {modules.eq === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('eq') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><EQPluginTerminal /></DraggableWindow>
          </div>
        )}
        {modules.midi === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('midi') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><MIDIControllerTerminal /></DraggableWindow>
          </div>
        )}
        {modules.recorder === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('recorder') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><RecorderTerminal /></DraggableWindow>
          </div>
        )}
        {modules.dsp === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('dsp') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><DSPTerminal /></DraggableWindow>
          </div>
        )}
        {modules.custom_slot === 'active' && (
          <div className={`lg:col-span-11 flex flex-col gap-6 h-[700px] ${collab.isLocked('custom_slot') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><CustomSlotTerminal /></DraggableWindow>
          </div>
        )}
        {/* GENERIC PLUGIN TERMINALS */}

        {modules.dj_fx === 'active' && (
          <div className={`col-span-1 lg:col-span-12 flex flex-col gap-6 ${collab.isLocked('dj_fx') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
             <DraggableWindow><FXEngineTerminal /></DraggableWindow>
          </div>
        )}
        {modules.mastering === 'active' && (
          <div className={`col-span-1 lg:col-span-12 ${collab.isLocked('mastering') ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            <div className="bg-[#0c0c0e] p-6 rounded-xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-4">
               <h3 className="text-sm font-mono text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-2">
                 <Activity className="w-5 h-5" /> Mastering Meta-Agent Terminal
               </h3>
               <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                 [Meta-Prompting Active] Parallel agents evaluating LUFS, stereo width, and dynamic range.
                 Provide a genre or target aesthetic, and the agents will negotiate the final mastering chain.
               </p>
               <div className="flex gap-4">
                 <button onClick={() => setMasteringOverlayOpen(true)} className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/50 transition">
                   Open Mastering Engine GUI
                 </button>
               </div>
            </div>
          </div>
        )}
\n      </main>

      {/* Page Footer */}
      <footer className="border-t border-neutral-800/60 bg-[#0a0a0c] py-4 text-center text-xs text-neutral-600 font-mono tracking-wide">
        sampleMONK // Sound, Samples & Effektmaschine • Powered by Tone.js & Gemini 3.5 Flash
      </footer>
      <MasteringOverlay 
        isOpen={isMasteringOverlayOpen} 
        onClose={() => setMasteringOverlayOpen(false)} 
        plugin={activeMasteringPlugin} 
      />
    </div>
  );
}
