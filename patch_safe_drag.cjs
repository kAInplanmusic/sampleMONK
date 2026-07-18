const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { DraggableWindow }')) {
  content = content.replace("import { SequencerPluginTerminal }", "import { DraggableWindow } from './components/DraggableWindow';\nimport { SequencerPluginTerminal }");
}

const terminals = [
  'SequencerPluginTerminal',
  'MischpultTerminal',
  'DrumMachineTerminal',
  'InstrumentsTerminal',
  'StemExtractorTerminal',
  'VoiceGenTerminal',
  'SpatialPluginTerminal',
  'EQPluginTerminal',
  'MIDIControllerTerminal',
  'RecorderTerminal',
  'DSPTerminal',
  'CustomSlotTerminal',
  'FXEngineTerminal',
  'MasteringOverlay'
];

terminals.forEach(term => {
  const regex = new RegExp(`<${term} \\/>`, 'g');
  content = content.replace(regex, `<DraggableWindow><${term} /></DraggableWindow>`);
});

// For sample_db which might not use a <Terminal /> component directly... wait, what does sample_db use?
// Oh, sample_db is completely inline in App.tsx! So I can't easily wrap it with regex. But the other 14 plugins will be draggable!

fs.writeFileSync('src/App.tsx', content);
