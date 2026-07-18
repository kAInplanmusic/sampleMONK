const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { DraggableWindow }')) {
  content = content.replace("import { SequencerPluginTerminal }", "import { DraggableWindow } from './components/DraggableWindow';\nimport { SequencerPluginTerminal }");
}

const blocks = [
  "modules.ai_terminal === 'active'",
  "modules.sequencer === 'active'",
  "modules.sample_db === 'active'",
  "modules.mischpult === 'active'",
  "modules.drum_machines === 'active'",
  "modules.instruments === 'active'",
  "modules.stem_extractor === 'active'",
  "modules.voice_gen === 'active'",
  "modules.spatial === 'active'",
  "modules.eq === 'active'",
  "modules.midi === 'active'",
  "modules.recorder === 'active'",
  "modules.dsp === 'active'",
  "modules.custom_slot === 'active'",
  "modules.dj_fx === 'active'",
  "modules.mastering === 'active'"
];

blocks.forEach(block => {
  // We look for `{block} && (\n <div className={`
  const regexStr = "\\{" + block.replace(/\./g, '\\.').replace(/\=/g, '\\=').replace(/\'/g, "\\'") + "\\s*===\\s*'active'\\s*&&\\s*\\(\\s*<div className=\\{`([^`]+)`\\}>";
  const regex = new RegExp(regexStr, "g");
  
  content = content.replace(regex, (match, classes) => {
    return `{${block} && (\n          <DraggableWindow className={\`${classes}\`}>`;
  });
});

// Also the generic plugin map
const genericMapRegex = /\{PLUGIN_REGISTRY\.filter\([^)]*\)\.map\(plugin => \{[\s\S]*?return \(\s*<div key=\{plugin\.id\} className="col-span-1 lg:col-span-12">/;
content = content.replace(genericMapRegex, (match) => {
  return match.replace('<div key={plugin.id} className="col-span-1 lg:col-span-12">', '<DraggableWindow key={plugin.id} className="col-span-1 lg:col-span-12">');
});

fs.writeFileSync('src/App.tsx', content);
