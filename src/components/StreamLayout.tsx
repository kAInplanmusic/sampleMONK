import React from 'react';
import { useDevice } from '../hooks/useDevice';
import { usePluginStatus } from '../hooks/usePluginStatus';
import { PluginIcon } from './PluginIcon';

// Mock list of 16 plugins - mapped to existing Terminal components
const plugins = [
  { id: 'custom-slot', name: 'Custom Slot', component: 'CustomSlotTerminal' },
  { id: 'drum-synths', name: 'Drum Synths', component: 'DrumMachineTerminal' },
  { id: 'dsp-engine', name: 'DSP Engine', component: 'DSPTerminal' },
  { id: 'equalizer', name: 'Equalizer', component: 'EQPluginTerminal' },
  { id: 'extension-slot', name: 'Extension Slot', component: 'CustomSlotTerminal' },
  { id: 'fx-engine', name: 'FX Engine', component: 'FXEngineTerminal' },
  { id: 'instrumente', name: 'Instrumente', component: 'InstrumentsTerminal' },
  { id: 'masteringTool', name: 'Mastering', component: 'MasteringOverlay' },
  { id: 'midi-controller', name: 'MIDI', component: 'MIDIControllerTerminal' },
  { id: 'mischpult', name: 'Mischpult', component: 'MischpultTerminal' },
  { id: 'recorder', name: 'Recorder', component: 'RecorderTerminal' },
  { id: 'sample-bibliothek', name: 'Library', component: 'SampleMonkLogo' }, // Placeholder
  { id: 'sequenzer', name: 'Sequenzer', component: 'SequencerPluginTerminal' },
  { id: 'spatial-surround', name: 'Spatial', component: 'SpatialPluginTerminal' },
  { id: 'stem-extractor', name: 'Stem', component: 'StemExtractorTerminal' },
  { id: 'voice-generator', name: 'Voice', component: 'VoiceGenTerminal' },
];

interface StreamLayoutProps {
  children: React.ReactNode;
  roomId: string;
  username: string;
}

export const StreamLayout: React.FC<StreamLayoutProps> = ({ children, roomId, username }) => {
  const device = useDevice();
  // We need to implement useRoom hook again as it was wiped by git reset
  
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      <nav className="h-16 border-b border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Placeholder for icons */}
          <div className="text-sm font-mono text-gray-500">Plugin Icons Row</div>
        </div>
        <div className="text-xs text-neutral-400 font-mono">
           Room: {roomId} | User: {username}
        </div>
      </nav>

      <main className={`flex-1 overflow-auto p-4 ${device === 'mobile' ? 'p-2' : ''}`}>
        {children}
      </main>
      
      <footer className="text-xs text-gray-600 p-2 text-center">
        Mode: {device.toUpperCase()}
      </footer>
    </div>
  );
};
