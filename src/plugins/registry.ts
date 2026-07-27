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
import { RecorderTerminal } from '../components/RecorderTerminal';
import { DSPTerminal } from '../components/DSPTerminal';
import { VisualizerTerminal } from '../components/VisualizerTerminal';
import { SynthesizerTerminal } from '../components/SynthesizerTerminal';

const ICON_MAP: Record<string, any> = {
  Sliders, Keyboard, Grid3X3, Box, Music, Speaker, Sparkles, Waves, 
  Mic, Layers, Radio, Database, Activity, Zap, Cpu, Square
};

const COMPONENT_MAP: Record<string, any> = {
  mixer: MischpultTerminal,
  controller: MIDIControllerTerminal,
  sequencer: SequencerPluginTerminal,
  spatial: SpatialPluginTerminal,
  instrument: InstrumentsTerminal,
  drum: DrumMachineTerminal,
  effect: FXEngineTerminal,
  synth: SynthesizerTerminal,
  voice: VoiceGenTerminal,
  visualizer: VisualizerTerminal,
  stem: StemExtractorTerminal,
  recording: RecorderTerminal,
  library: LibraryTerminal,
  eq: EQPluginTerminal,
  dsp: DSPTerminal,
  mastering: MasteringOverlay
};

export let PLUGIN_REGISTRY: any[] = [];

export const discoverPlugins = async () => {
    try {
        const response = await fetch('/plugin-manifest.json');
        const manifest = await response.json();
        
        if (manifest.ui_plugins) {
            PLUGIN_REGISTRY = manifest.ui_plugins.map((p: any) => ({
                ...p,
                icon: ICON_MAP[p.icon] || Cpu,
                component: COMPONENT_MAP[p.id]
            })).filter((p: any) => p.component);
            
            // console.log(`Discovered ${PLUGIN_REGISTRY.length} plugins from manifest.`);
        }
    } catch (error) {
        console.error("Failed to discover plugins:", error);
        // Fallback to minimal set if manifest fails
        PLUGIN_REGISTRY = [
            { id: 'mixer', name: 'mixerMONK', short: 'MIX', icon: Sliders, component: MischpultTerminal }
        ];
    }
    return PLUGIN_REGISTRY;
};

// Initial synchronous population (can be updated later by discoverPlugins)
PLUGIN_REGISTRY = Object.entries(COMPONENT_MAP).map(([id, component]) => {
    // Find matching icon from manifest-like fallback logic
    const icon = ICON_MAP[id] || Cpu; 
    return { id, name: `${id}MONK`, short: id.substring(0,3).toUpperCase(), icon, component };
});
