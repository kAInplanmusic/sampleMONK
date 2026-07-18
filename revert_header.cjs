const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Match the entire <header> element
const headerRegex = /<header className="border-b border-sky-500\/20 bg-black\/60 backdrop-blur-2xl px-6 py-4 sticky top-0 z-50 shadow-\[0_0_40px_rgba\(14,165,233,0\.15\)\] flex flex-col gap-4">[\s\S]*?<\/header>/;

const newHeader = `<header className="border-b border-neutral-800/60 bg-[#0c0c0e]/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Collab Users */}
          <div className="flex -space-x-2">
            {collab.session && Object.values(collab.session.activeUsers || {}).filter((u: any) => u && u.name).map((u: any) => (
              <div key={u.name} 
                   title={u.name}
                   className="w-8 h-8 rounded-full border-2 border-[#0c0c0e] flex items-center justify-center text-xs font-bold shadow-sm"
                   style={{ backgroundColor: u.color || '#fff', color: '#000' }}>
                {u.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
          </div>

          {/* The 16 Logos */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {PLUGIN_REGISTRY.map(plugin => {
               const isActive = modules[plugin.id] !== 'inactive';
               const isLocked = collab.isLocked(plugin.id);
               const Icon = plugin.icon;
               
               // Dynamic color classes based on plugin.color
               const colorClassMap: Record<string, string> = {
                 'blue': 'text-blue-400 border-blue-500/50 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
                 'amber': 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
                 'fuchsia': 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-500/10 shadow-[0_0_10px_rgba(217,70,239,0.3)]',
                 'yellow': 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
                 'purple': 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
                 'lime': 'text-lime-400 border-lime-500/50 bg-lime-500/10 shadow-[0_0_10px_rgba(132,204,22,0.3)]',
                 'teal': 'text-teal-400 border-teal-500/50 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.3)]',
                 'emerald': 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
                 'pink': 'text-pink-400 border-pink-500/50 bg-pink-500/10 shadow-[0_0_10px_rgba(236,72,153,0.3)]',
                 'rose': 'text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
                 'red': 'text-red-400 border-red-500/50 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
                 'orange': 'text-orange-400 border-orange-500/50 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
                 'cyan': 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
                 'indigo': 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.3)]',
                 'violet': 'text-violet-400 border-violet-500/50 bg-violet-500/10 shadow-[0_0_10px_rgba(139,92,246,0.3)]',
                 'sky': 'text-sky-400 border-sky-500/50 bg-sky-500/10 shadow-[0_0_10px_rgba(14,165,233,0.3)]',
               };
               
               const activeClasses = colorClassMap[plugin.color] || 'text-white border-white/50 bg-white/10';
               const inactiveClasses = 'text-neutral-500 border-transparent hover:bg-neutral-800 hover:text-neutral-300';
               const classes = isActive ? activeClasses : inactiveClasses;
               const lockedClasses = isLocked ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer';

               return (
                 <button
                   key={plugin.id}
                   onClick={() => toggleModule(plugin.id)}
                   disabled={isLocked}
                   className={\`p-2 rounded-lg border transition-all \${classes} \${lockedClasses}\`}
                   title={plugin.name}
                 >
                   <Icon className="w-5 h-5" />
                 </button>
               );
            })}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2 bg-[#121215] p-1.5 rounded-lg border border-neutral-800">
            {isPlaying ? (
              <button 
                id="pause-btn"
                onClick={handlePause}
                className="p-2 rounded-md bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 transition"
                title="Pause"
              >
                <Pause className="w-4 h-4 fill-amber-400" />
              </button>
            ) : (
              <button 
                id="play-btn"
                onClick={handlePlay}
                className="p-2 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 transition flex items-center gap-1.5 font-mono text-xs font-bold"
                title="Play Sequence"
              >
                <Play className="w-3.5 h-3.5 fill-sky-400" />
              </button>
            )}
            <button 
              id="stop-btn"
              onClick={handleStop}
              className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 transition"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-neutral-400" />
            </button>
            <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>
            <button 
              id="clear-btn"
              onClick={handleClearPatterns}
              className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-red-400 transition"
              title="Clear Sequence Grid"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>`;

if (headerRegex.test(content)) {
    content = content.replace(headerRegex, newHeader);
} else {
    console.log("Could not find header with regex!");
}

fs.writeFileSync('src/App.tsx', content);
