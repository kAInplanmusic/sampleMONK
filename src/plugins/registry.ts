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

// ============================================================================
// Task 21: Modul-Zusammenführung – Aliase für Konsolidierung
// ----------------------------------------------------------------------------
// Gruppen, deren Module zu einem "Metamodul" zusammengefasst werden können:
//  - Verarbeitungskette: dsp + eq + effect  → primärer Kern: 'effect'
//  - Klangerzeugung:     synth + instrument → primärer Kern: 'instrument'
//  - Signalquelle:       recorder + voice   → primärer Kern: 'recording'
// resolveComponent(id) liefert die ERSTE primäre Komponente der Gruppe, sodass
// beim Zusammenführen nur ein Terminal gerendert wird.
// ============================================================================

/** Gruppen mit ihren Mitgliedern und dem primären (verbleibenden) Modul. */
export const METAMODULE_GROUPS: { group: string; members: string[]; primary: string }[] = [
  { group: 'process', members: ['dsp', 'eq', 'effect'], primary: 'effect' },
  { group: 'sound',   members: ['synth', 'instrument'],  primary: 'instrument' },
  { group: 'source',  members: ['recording', 'voice'],   primary: 'recording' },
];

/** Mappt ein Modul auf seinen primären Gruppenvorsteher. */
export function resolvePrimaryModule(id: string): string {
  const g = METAMODULE_GROUPS.find(x => x.members.includes(id));
  return g ? g.primary : id;
}

/** Führt für ein Modul die richtige Render-Komponente auf (Merge-bewusst). */
export function resolveComponent(id: string): any {
  return COMPONENT_MAP[resolvePrimaryModule(id)] ?? COMPONENT_MAP[id];
}

const DEFAULT_PLUGIN_METADATA: Record<string, { name: string; short: string; icon: string }> = {
  mixer: { name: 'mixerMONK', short: 'MIX', icon: 'Sliders' },
  controller: { name: 'controllerMONK', short: 'CTRL', icon: 'Keyboard' },
  sequencer: { name: 'sequencerMONK', short: 'SEQ', icon: 'Grid3X3' },
  spatial: { name: 'spatialMONK', short: '3D', icon: 'Box' },
  instrument: { name: 'instrumentMONK', short: 'INS', icon: 'Music' },
  drum: { name: 'drumMONK', short: 'DRM', icon: 'Speaker' },
  effect: { name: 'effectMONK', short: 'FX', icon: 'Sparkles' },
  synth: { name: 'synthesizerMONK', short: 'SYN', icon: 'Waves' },
  voice: { name: 'voiceMONK', short: 'VOX', icon: 'Mic' },
  visualizer: { name: 'samplerMONK', short: 'SAM', icon: 'Activity' },
  stem: { name: 'stemMONK', short: 'RMX', icon: 'Radio' },
  recording: { name: 'recordingMONK', short: 'REC', icon: 'Activity' },
  library: { name: 'biblioMONK', short: 'LIB', icon: 'Database' },
  eq: { name: 'eqMONK', short: 'EQ', icon: 'Activity' },
  dsp: { name: 'dspMONK', short: 'DSP', icon: 'Zap' },
  mastering: { name: 'masteringMONK', short: 'MST', icon: 'Square' },
};

const EXPECTED_PLUGIN_COUNT = 16;

const createFallbackRegistry = () =>
  Object.keys(COMPONENT_MAP).map((id) => {
    const metadata = DEFAULT_PLUGIN_METADATA[id] || {
      name: `${id}MONK`,
      short: id.substring(0, 3).toUpperCase(),
      icon: 'Cpu',
    };
    return {
      id,
      name: metadata.name,
      short: metadata.short,
      icon: ICON_MAP[metadata.icon] || Cpu,
      component: COMPONENT_MAP[id],
    };
  });

let _pluginRegistry: readonly any[] = [];

/** Read-only accessor – prevents external mutation of the registry. */
export const getPluginRegistry = (): readonly any[] => _pluginRegistry;

/** @deprecated Use getPluginRegistry() instead. Kept for backward compatibility. */
export const PLUGIN_REGISTRY: any[] = [] as any;

export const discoverPlugins = async () => {
    try {
        const response = await fetch('/plugin-manifest.json');
        const manifest = await response.json();
        
        if (Array.isArray(manifest.ui_plugins)) {
            const discoveredPlugins = manifest.ui_plugins.map((p: any) => ({
                ...p,
                icon: ICON_MAP[p.icon] || Cpu,
                component: COMPONENT_MAP[p.id]
            })).filter((p: any) => p.component);

            if (discoveredPlugins.length === EXPECTED_PLUGIN_COUNT) {
                _pluginRegistry = Object.freeze(discoveredPlugins);
                // Keep backward-compat array in sync
                PLUGIN_REGISTRY.length = 0;
                PLUGIN_REGISTRY.push(...discoveredPlugins);
                return _pluginRegistry;
            }
             
            console.warn(
                `Plugin manifest mismatch: expected ${EXPECTED_PLUGIN_COUNT}, got ${discoveredPlugins.length}. Falling back to built-in registry.`,
            );
        }
    } catch (error) {
        console.error("Failed to discover plugins:", error);
    }
    const fallback = Object.freeze(createFallbackRegistry());
    _pluginRegistry = fallback;
    PLUGIN_REGISTRY.length = 0;
    PLUGIN_REGISTRY.push(...fallback);
    return _pluginRegistry;
};

// Initial synchronous population
const _initial = createFallbackRegistry();
_pluginRegistry = Object.freeze(_initial);
PLUGIN_REGISTRY.push(..._initial);
