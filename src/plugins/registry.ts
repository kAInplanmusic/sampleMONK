import { 
  Sliders, Keyboard, Grid3X3, Box, Music, Speaker, Sparkles, Waves, 
  Mic, Layers, Radio, Database, Activity, Zap, Cpu, Square 
} from 'lucide-react';
import { MischpultTerminal } from '../components/MischpultTerminal';
import { SequencerPluginTerminal } from '../components/SequencerPluginTerminal';
import { LibraryTerminal } from '../components/LibraryTerminal';
import { DrumMachineTerminal } from '../components/DrumMachineTerminal';
import { InstrumentsTerminal } from '../components/InstrumentsTerminal';
import { SpatialPluginTerminal } from '../components/SpatialPluginTerminal';
import { EQPluginTerminal } from '../components/EQPluginTerminal';
import { MasteringOverlay } from '../components/MasteringOverlay';
import { MIDIControllerTerminal } from '../components/MIDIControllerTerminal';
import { FXEngineTerminal } from '../components/FXEngineTerminal';
import { StemExtractorTerminal } from '../components/StemExtractorTerminal';
import { VoiceGenTerminal } from '../components/VoiceGenTerminal';
import { HypergraphVisualizer } from '../components/HypergraphVisualizer';
import { RecorderTerminal } from '../components/RecorderTerminal';
import { DSPTerminal } from '../components/DSPTerminal';
import { CustomSlotTerminal } from '../components/CustomSlotTerminal';
import { SynthesizerTerminal } from '../components/SynthesizerTerminal';

export const PLUGIN_REGISTRY = [
  { id: 'mixer', name: 'mixerMONK', short: 'MIX', icon: Sliders, description: 'Zentrales Mischpult für Lautstärke, Panning, Bus-Routing.', component: MischpultTerminal },
  { id: 'controller', name: 'controllerMONK', short: 'CTRL', icon: Keyboard, description: 'Verwaltung von MIDI, LFOs und Hardware-Mappings.', component: MIDIControllerTerminal },
  { id: 'sequencer', name: 'sequencerMONK', short: 'SEQ', icon: Grid3X3, description: 'Touch-optimierter Step-Sequenzer.', component: SequencerPluginTerminal },
  { id: 'spatial', name: 'spatialMONK', short: '3D', icon: Box, description: '10.0 Spatial-Audio-Modul für 2D/3D-Raumklang.', component: SpatialPluginTerminal },
  { id: 'instrument', name: 'instrumentMONK', short: 'INS', icon: Music, description: 'Host für webbasierte virtuelle Instrumente.', component: InstrumentsTerminal },
  { id: 'drum', name: 'drumMONK', short: 'DRM', icon: Speaker, description: 'Drumcomputer und Drum-Sampler.', component: DrumMachineTerminal },
  { id: 'effect', name: 'effectMONK', short: 'FX', icon: Sparkles, description: 'Effektrack für Hardware-FX-Emulationen.', component: FXEngineTerminal },
  { id: 'synth', name: 'synthesizerMONK', short: 'SYN', icon: Waves, description: 'Vielseitige Synthese-Engines.', component: SynthesizerTerminal },
  { id: 'voice', name: 'voiceMONK', short: 'VOX', icon: Mic, description: 'KI-Vocal-Synthese, TTS und Vokoder.', component: VoiceGenTerminal },
  { id: 'sampler', name: 'samplerMONK', short: 'SMP', icon: Layers, description: 'Sample-Generator mit Granularsynthese.', component: CustomSlotTerminal },
  { id: 'stem', name: 'stemMONK', short: 'RMX', icon: Radio, description: 'KI-gestützte Live-Stem-Trennung.', component: StemExtractorTerminal },
  { id: 'recording', name: 'recordingMONK', short: 'REC', icon: Activity, description: 'Audio-Interface für bit-perfektes Recording.', component: RecorderTerminal },
  { id: 'library', name: 'biblioMONK', short: 'LIB', icon: Database, description: 'Bibliothek und Datei-Explorer.', component: LibraryTerminal },
  { id: 'eq', name: 'eqMONK', short: 'EQ', icon: Activity, description: 'Parametrischer Equalizer.', component: EQPluginTerminal },
  { id: 'dsp', name: 'dspMONK', short: 'DSP', icon: Zap, description: 'High-End DSP für Phasenkorrektur/Filter.', component: DSPTerminal },
  { id: 'mastering', name: 'masteringMONK', short: 'MST', icon: Square, description: 'Finales Mastering-Tool.', component: MasteringOverlay },
];
