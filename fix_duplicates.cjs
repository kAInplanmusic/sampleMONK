const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const dmBlock = `        {modules.drum_machines === 'active' && (
          <div className={\`lg:col-span-11 flex flex-col gap-6 h-[700px] \${collab.isLocked('drum_machines') ? 'opacity-50 grayscale pointer-events-none' : ''}\`}>
             <DrumMachineTerminal />
          </div>
        )}`;

content = content.split(dmBlock).join("");
content = content.replace("{/* GENERIC PLUGIN TERMINALS */}", dmBlock + "\n\n        {/* GENERIC PLUGIN TERMINALS */}");

const instBlock = `        {modules.instruments === 'active' && (
          <div className={\`lg:col-span-11 flex flex-col gap-6 h-[700px] \${collab.isLocked('instruments') ? 'opacity-50 grayscale pointer-events-none' : ''}\`}>
             <InstrumentsTerminal />
          </div>
        )}`;

content = content.split(instBlock).join("");
content = content.replace("{/* GENERIC PLUGIN TERMINALS */}", instBlock + "\n\n        {/* GENERIC PLUGIN TERMINALS */}");

fs.writeFileSync('src/App.tsx', content);
