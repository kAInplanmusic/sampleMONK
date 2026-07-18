const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { DraggableWindow }')) {
  content = content.replace("import { SequencerPluginTerminal } from './components/SequencerPluginTerminal';", "import { SequencerPluginTerminal } from './components/SequencerPluginTerminal';\nimport { DraggableWindow } from './components/DraggableWindow';");
}

// Just wrapping the children of the active condition instead of the `div` itself.
// Wait, replacing the div with DraggableWindow is easier:
content = content.replace(/<div className={\`(lg:col-span-11|flex flex-col gap-6|col-span-1 lg:col-span-12)[^`]*`}>/g, function(match) {
  // It's safer to use DraggableWindow as the outer wrapper
  // But actually let's just make DraggableWindow accept the class name and pass it through.
  return match.replace('<div className=', '<DraggableWindow className=');
});

// For closing tags, only replace those matching the div we just replaced. 
// This is risky with regex!
// Instead of risky regex, I'll use a simpler script to replace matching open/close pairs.
