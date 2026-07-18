const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports for new icons
content = content.replace(
  "import { Play, Pause, Square, RotateCcw, Download, Sparkles, UploadCloud, Library, Plus, Trash2, Gauge } from 'lucide-react';",
  "import { Play, Pause, Square, RotateCcw, Download, Sparkles, UploadCloud, Library, Plus, Trash2, Gauge, Terminal, Grid3X3, Database, Maximize2, Minimize2 } from 'lucide-react';"
);

// 2. Add module state
content = content.replace(
  "const [toneShiftActive, setToneShiftActive] = useState(true);",
  `const [toneShiftActive, setToneShiftActive] = useState(true);
  
  // Module Layout States
  const [modules, setModules] = useState({
    ai_terminal: 'active', // 'active' | 'auto'
    sequencer: 'active',
    sample_db: 'active'
  });

  const toggleModule = (mod) => {
    setModules(prev => ({ ...prev, [mod]: prev[mod] === 'active' ? 'auto' : 'active' }));
  };
  `
);

// 3. Update the Top Header to include the Module Dock
const oldHeader = `<div className="flex items-center gap-2 bg-[#121215] p-1.5 rounded-lg border border-neutral-800">`;
const dockHtml = `
            {/* MODULE DOCK */}
            <div className="flex items-center bg-[#0a0a0c] p-1.5 rounded-lg border border-neutral-800 gap-2 shadow-inner mx-2">
              <button 
                onClick={() => toggleModule('ai_terminal')}
                className={\`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition border \${modules.ai_terminal === 'auto' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-cyan-400'}\`}
                title="AI Terminal"
              >
                <Terminal className="w-4 h-4" />
                {modules.ai_terminal === 'auto' && <span className="text-[10px] font-mono font-bold uppercase">AUTO</span>}
              </button>
              <button 
                onClick={() => toggleModule('sequencer')}
                className={\`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition border \${modules.sequencer === 'auto' ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-amber-400'}\`}
                title="Sequencer"
              >
                <Grid3X3 className="w-4 h-4" />
                {modules.sequencer === 'auto' && <span className="text-[10px] font-mono font-bold uppercase">AUTO</span>}
              </button>
              <button 
                onClick={() => toggleModule('sample_db')}
                className={\`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition border \${modules.sample_db === 'auto' ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-fuchsia-400'}\`}
                title="Sample Database"
              >
                <Database className="w-4 h-4" />
                {modules.sample_db === 'auto' && <span className="text-[10px] font-mono font-bold uppercase">AUTO</span>}
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-[#121215] p-1.5 rounded-lg border border-neutral-800">`;

content = content.replace(oldHeader, dockHtml);

// 4. Wrap sections in conditional rendering and styling
// We need to find the specific sections in the Main Panel Grid and conditionally render them.

fs.writeFileSync('src/App.tsx', content);
console.log('App patched with layout state');
