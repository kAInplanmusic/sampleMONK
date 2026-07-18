const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<header className="border-b border-neutral-800\/60 bg-\[\#0c0c0e\]\/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">[\s\S]*?<\/header>/;

const newHeader = `<header className="border-b border-sky-500/20 bg-black/60 backdrop-blur-2xl px-6 py-4 sticky top-0 z-50 shadow-[0_0_40px_rgba(14,165,233,0.15)] flex flex-col gap-4">
        <div className="max-w-[1400px] w-full mx-auto flex flex-col xl:flex-row items-center justify-between gap-6">
            
          {/* Left: Users & Master Out */}
          <div className="flex flex-col sm:flex-row items-center gap-8 w-full xl:w-auto">
            {/* Collab Users - New Design */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-widest bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]">
                {collab.session ? Object.keys(collab.session.activeUsers || {}).length : 1}/4 USER
              </div>
              <div className="flex gap-1.5">
                {[...Array(4)].map((_, i) => {
                  const activeCount = collab.session ? Object.keys(collab.session.activeUsers || {}).length : 1;
                  const isActive = i < activeCount;
                  return (
                    <div key={i} className={\`flex flex-col items-center justify-center transition-all duration-500 \${isActive ? 'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]' : 'text-neutral-800'}\`}>
                      <User className="w-5 h-5" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Master Out Sinus */}
            <div className="flex flex-col items-start gap-1 bg-black/80 p-2.5 rounded-xl border border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] w-full sm:w-auto">
               <div className="text-[9px] font-mono text-fuchsia-400 font-bold tracking-widest uppercase px-1 flex items-center justify-between w-full">
                  <span>MASTER OUT SINUS (FIXED) + TAKT</span>
                  <span className="text-neutral-600">0.0dB</span>
               </div>
               <div className="h-10 w-full sm:w-64 bg-[#050508] rounded-lg border border-neutral-800 relative overflow-hidden flex items-center justify-center">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full opacity-80">
                     <polyline points="0,10 5,5 10,15 15,8 20,12 25,2 30,18 35,6 40,14 45,3 50,17 55,7 60,13 65,4 70,16 75,5 80,15 85,9 90,11 95,8 100,10" fill="none" stroke="currentColor" className="text-fuchsia-500" strokeWidth="0.5" strokeLinejoin="round" />
                  </svg>
                  <div className={\`absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_white] \${isPlaying ? 'animate-[pulse_0.5s_infinite]' : 'opacity-50'}\`} style={{ left: '50%' }}></div>
               </div>
            </div>
            
            {/* Playback Controls moved to left side for better UX */}
            <div className="flex items-center gap-2 bg-[#0c0c0e] p-1.5 rounded-lg border border-neutral-800/80 shadow-lg">
              {isPlaying ? (
                <button 
                  id="pause-btn"
                  onClick={handlePause}
                  className="p-2.5 rounded-md bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 transition"
                  title="Pause"
                >
                  <Pause className="w-4 h-4 fill-amber-400" />
                </button>
              ) : (
                <button 
                  id="play-btn"
                  onClick={handlePlay}
                  className="p-2.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 transition flex items-center gap-1.5 font-mono text-xs font-bold px-4 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                  title="Play Sequence"
                >
                  <Play className="w-3.5 h-3.5 fill-sky-400" /> START
                </button>
              )}
              <button 
                id="stop-btn"
                onClick={handleStop}
                className="p-2.5 rounded-md hover:bg-neutral-800 text-neutral-400 transition"
                title="Stop"
              >
                <Square className="w-4 h-4 fill-neutral-400" />
              </button>
              <div className="h-6 w-[1px] bg-neutral-800 mx-1"></div>
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

          {/* Right: Plugin Toggle Grid */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
             {/* MST / EQ Special Toggles */}
             <div className="flex bg-[#0c0c0e] border border-neutral-800 rounded-full p-1.5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={() => toggleModule('mastering')}
                  className={\`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all \${modules.mastering !== 'inactive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-neutral-500 hover:text-neutral-300'}\`}
                >
                  <div className={\`w-2 h-2 rounded-full \${modules.mastering !== 'inactive' ? 'bg-emerald-400 animate-[pulse_2s_infinite]' : 'bg-neutral-700'}\`}></div>
                  MST
                </button>
                <button 
                  onClick={() => toggleModule('eq')}
                  className={\`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold transition-all \${modules.eq !== 'inactive' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'text-neutral-500 hover:text-neutral-300'}\`}
                >
                  <div className={\`w-2 h-2 rounded-full \${modules.eq !== 'inactive' ? 'bg-teal-400 animate-[pulse_2s_infinite]' : 'bg-neutral-700'}\`}></div>
                  EQ
                </button>
             </div>
             
             {/* 2x8 Grid */}
             <div className="flex flex-col gap-1 items-start">
               <span className="text-[8px] font-mono text-sky-500/50 font-bold tracking-widest pl-1">PLUGIN MATRIX</span>
               <div className="grid grid-cols-8 grid-rows-2 gap-1.5 bg-[#0a0a0c] p-2 rounded-xl border border-sky-500/30 shadow-[0_0_25px_rgba(14,165,233,0.15)]">
                  {PLUGIN_REGISTRY.map((plugin, idx) => {
                     const isActive = modules[plugin.id] !== 'inactive';
                     const isLocked = collab.isLocked(plugin.id);
                     // Tailwind border/text colors based on plugin.color
                     const colorClasses: Record<string, string> = {
                        'cyan': 'text-cyan-400 bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]',
                        'amber': 'text-amber-400 bg-amber-500/20 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
                        'fuchsia': 'text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.4)]',
                        'rose': 'text-rose-400 bg-rose-500/20 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.4)]',
                        'emerald': 'text-emerald-400 bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
                        'blue': 'text-blue-400 bg-blue-500/20 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]',
                        'purple': 'text-purple-400 bg-purple-500/20 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
                        'yellow': 'text-yellow-400 bg-yellow-500/20 border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]',
                        'lime': 'text-lime-400 bg-lime-500/20 border-lime-400 shadow-[0_0_10px_rgba(132,204,22,0.4)]',
                        'red': 'text-red-400 bg-red-500/20 border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]',
                        'orange': 'text-orange-400 bg-orange-500/20 border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
                        'teal': 'text-teal-400 bg-teal-500/20 border-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.4)]',
                        'pink': 'text-pink-400 bg-pink-500/20 border-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.4)]',
                        'indigo': 'text-indigo-400 bg-indigo-500/20 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]',
                        'violet': 'text-violet-400 bg-violet-500/20 border-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.4)]',
                        'sky': 'text-sky-400 bg-sky-500/20 border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.4)]',
                        'green': 'text-green-400 bg-green-500/20 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]',
                     };
                     const activeClass = colorClasses[plugin.color] || colorClasses[plugin.color.replace('-300', '')] || 'text-white bg-white/20 border-white';
                     
                     return (
                       <button
                         key={plugin.id}
                         onClick={() => toggleModule(plugin.id)}
                         className={\`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 border transition-all \${isActive ? activeClass : 'bg-black/80 border-neutral-800 text-neutral-600 hover:border-neutral-500 hover:text-neutral-400'} \${isLocked ? 'opacity-50 grayscale' : ''}\`}
                         title={plugin.name}
                       >
                          <span className="text-[10px] sm:text-xs font-mono font-bold">{idx + 1}</span>
                       </button>
                     );
                  })}
               </div>
             </div>
          </div>
        </div>
      </header>`;

content = content.replace(regex, newHeader);

// Import User from lucide-react if not present
if (!content.includes('User,')) {
    content = content.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
        return `import { User, ${p1} } from 'lucide-react';`;
    });
}

fs.writeFileSync('src/App.tsx', content);
