import React, { useState, useEffect, useRef } from 'react';
import { Box, Play, Pause, RefreshCw, Layers, Map, Move, Crosshair } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';

import { calculate10ChannelPan } from '../utils/spatialMath';

import { StartupWizard } from './spatial/StartupWizard';
import { SpatialSetup } from './spatial/types';

export function SpatialPluginTerminal() {
  const { state, lockStatus, updateState } = usePluginState('spatial', 'ACTIVE');
  const [setup, setSetup] = useState<SpatialSetup | null>(null);

  if (!setup) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#111]">
            <StartupWizard onComplete={setSetup} />
        </div>
    );
  }

  // ... rest of the existing terminal logic (using setup for panning)


  useEffect(() => {
    // simulation loop
    nodes.forEach(node => {
        const { channels } = calculate10ChannelPan(node.x, node.y);
        // console.log(`Routing ${node.id} to channels:`, channels);
    });
  }, [nodes]);

const updateNodePosition = (id: string, x: number, y: number) => {
  setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  // Route to audio engine
  audioEngine.setSpatialPosition(id.toLowerCase() as TrackType, x, y);
};

    const newNode = { 
        id: sample.name.toUpperCase().substring(0, 5), 
        x: 0, 
        y: 0, 
        color: '#f59e0b', 
        active: true 
    };
    setNodes(prev => [...prev, newNode]);
    console.log('Sample added to spatial field:', sample.name);
  };

  // ... (existing animation loop, dragging logic)
  
  return (
    <div className={`w-full h-full flex flex-col bg-[#0a0a0a] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-lime-900/20 to-[#0a0a0a] border-b border-lime-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center border border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.3)]">
            <Box className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Spatial Audio <span className="text-[10px] font-mono text-lime-400 border border-lime-500/30 px-2 py-0.5 rounded-sm">7.1 ATMOS</span>
            </h2>
            <p className="text-xs text-neutral-500 font-mono">2D Vector Path Movement & Surround Panning</p>
          </div>
        </div>
        <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
            <option value="OFF">OFF</option>
            <option value="AI_CONTROLLED">AI</option>
            <option value="ACTIVE">ACTIVE</option>
        </select>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-4 py-2 rounded text-xs font-bold tracking-widest flex items-center gap-2 transition-colors ${isPlaying ? 'bg-lime-500/20 text-lime-400 border border-lime-500/50' : 'bg-[#222] text-neutral-400 border border-neutral-700 hover:bg-[#333]'}`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'LFO ACTIVE' : 'LFO PATHS'}
        </button>

        <div className="flex items-center gap-2 bg-black p-1 rounded border border-neutral-800">
           <button 
             onClick={() => setSpatialMode('ON_TOP')}
             className={`px-3 py-1 text-[10px] font-bold rounded ${spatialMode === 'ON_TOP' ? 'bg-lime-600 text-white' : 'text-neutral-500'}`}
           >ON TOP</button>
           <button 
             onClick={() => setSpatialMode('SEPARATION')}
             className={`px-3 py-1 text-[10px] font-bold rounded ${spatialMode === 'SEPARATION' ? 'bg-lime-600 text-white' : 'text-neutral-500'}`}
           >SEPARATION</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Side: Controls */}
        <div className="w-1/3 flex flex-col gap-6">
           <div className="bg-[#111] rounded-xl border border-neutral-800 p-4 shadow-inner">
             <h3 className="text-xs font-bold tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
               <Layers className="w-4 h-4" /> AUDIO STEMS
             </h3>
             <div className="flex flex-col gap-2">
               {nodes.map(node => (
                 <div key={node.id} className="flex items-center justify-between p-2 rounded bg-black/40 border border-neutral-800/50">
                   <div className="flex items-center gap-3">
                     <button 
                       className={`w-3 h-3 rounded-full transition-colors ${node.active ? 'shadow-[0_0_8px_currentColor]' : 'bg-neutral-800'}`}
                       style={{ backgroundColor: node.active ? node.color : undefined, color: node.color }}
                     />
                     <span className="text-xs font-mono font-bold" style={{ color: node.active ? '#ddd' : '#555' }}>{node.id}</span>
                   </div>
                   
                   <div className="flex gap-4 text-[10px] font-mono text-neutral-600">
                     <span>X: {(node.x).toFixed(2)}</span>
                     <span>Y: {(node.y).toFixed(2)}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
           
           <div className="flex-1 bg-[#111] rounded-xl border border-neutral-800 p-4 flex flex-col shadow-inner">
import { generateCircularPath, generateLissajousPath, generatePingPongPath } from '../utils/spatialAutomation';

// ... inside SpatialPluginTerminal component

  const [macroMappings, setMacroMappings] = useState<Record<string, string>>({
    'btn1': 'CIRCLE',
    'btn2': 'LISS',
    'btn3': 'PINGPONG',
    'btn4': 'CIRCLE_RIGHT',
    'btn5': 'CHAOS'
  });

  const handleMacroDrop = (sample: AudioSample, btnId: string) => {
    // Treat the dropped sample name as a pattern definition if needed, 
    // or assign a pattern name to the button.
    setMacroMappings(prev => ({ ...prev, [btnId]: sample.name }));
  };

  const triggerMacro = (pattern: string) => {
    let path;
    const steps = 100;
    
    // Fallback logic if it's a known pattern or a sample-based pattern
    if (pattern === 'CIRCLE') path = generateCircularPath(0.5, steps);
    else if (pattern === 'LISS') path = generateLissajousPath(3, 2, steps);
    else if (pattern === 'PINGPONG') path = generatePingPongPath(0.8, steps);
    else if (pattern === 'CIRCLE_RIGHT') path = generateCircularPath(0.5, steps);
    else if (pattern === 'CHAOS') path = Array.from({ length: steps }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 }));
    else {
        console.log(`Executing pattern for sample: ${pattern}`);
        return;
    }
    
    console.log(`Triggering macro: ${pattern}`, path);
  };
// ...
             <h3 className="text-xs font-bold tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
               <Map className="w-4 h-4" /> MACRO CONTROLS
             </h3>
             
             <div className="grid grid-cols-2 gap-2">
                 {Object.entries(macroMappings).map(([id, pattern]) => (
                    <DropTarget 
                        key={id}
                        onDrop={(sample) => handleMacroDrop(sample, id)}
                        className="bg-neutral-800 rounded text-[9px] font-bold hover:bg-lime-600 p-2 text-center"
                    >
                        <button onClick={() => triggerMacro(pattern)} className="w-full h-full">
                            {pattern}
                        </button>
                    </DropTarget>
                 ))}
             </div>

             
             <button className="w-full mt-4 py-3 bg-[#222] hover:bg-[#333] border border-neutral-700 rounded text-[10px] font-bold tracking-widest text-neutral-400 flex items-center justify-center gap-2 transition-colors">
               <RefreshCw className="w-3 h-3" /> RESET POSITIONS
             </button>
           </div>
        </div>
        
import { SpatialCanvas } from './spatial/SpatialCanvas';
// ... other imports

// ... inside the JSX return:
        {/* Right Side: Visualizer Canvas */}
        <div className="flex-1">
            <DropTarget 
                label="Drop Sample to Spatial Field"
                onDrop={handleSampleDrop}
                className="w-full h-full p-4 flex flex-col items-center justify-center"
            >
                <div className="w-full h-full max-w-[500px] max-h-[500px] bg-black rounded-full border border-neutral-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <SpatialCanvas />
                </div>
            </DropTarget>
        </div>
        
      </div>
    </div>
  );
}
