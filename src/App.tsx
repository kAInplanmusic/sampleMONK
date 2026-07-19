import React, { useState } from 'react';
import { InstrumentsTerminal } from './plugins/instrumente/InstrumentePlugin';
import { MischpultTerminal } from './plugins/mischpult/MischpultPlugin';
import { SequencerPluginTerminal } from './plugins/sequenzer/SequencerPlugin';
// ... importiere die anderen 13 Plugins analog ...

export function App() {
  const [activePlugin, setActivePlugin] = useState('instrumente');

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar mit 16 Plugin-Buttons */}
      <nav className="w-20 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-4 gap-2">
        {['instrumente', 'sequenzer', 'mischpult', 'mastering-tool', 'voice-generator', 'dsp-engine', 'fx-engine', 'spatial-surround', 'drum-synths', 'recorder', 'midi-controller', 'custom-slot', 'extension-slot', 'equalizer', 'sample-bibliothek', 'stem-extractor'].map(p => (
           <button key={p} onClick={() => setActivePlugin(p)} className="w-12 h-12 bg-neutral-800 rounded-lg hover:bg-orange-600 transition">
             {p[0].toUpperCase()}
           </button>
        ))}
      </nav>
      
      {/* Plugin-Host */}
      <main className="flex-1 p-6">
        {activePlugin === 'instrumente' && <InstrumentsTerminal />}
        {activePlugin === 'sequenzer' && <SequencerPluginTerminal />}
        {activePlugin === 'mischpult' && <MischpultTerminal />}
        {/* ... etc ... */}
      </main>
    </div>
  );
}
