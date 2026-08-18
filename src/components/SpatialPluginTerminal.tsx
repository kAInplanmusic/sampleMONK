import { useState, useEffect } from 'react';
import { Box, Play, Pause, Layers, Map } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';
import { usePluginState } from '../hooks/usePluginState';
import { StartupWizard } from './spatial/StartupWizard';
import { SpatialSetup } from './spatial/types';
import { SpatialCanvas } from './spatial/SpatialCanvas';
import { generateCircularPath, generateLissajousPath, generatePingPongPath } from '../utils/spatialAutomation';
import { audioEngine } from '../utils/audioEngine';
import { TrackType } from '../types';

export function SpatialPluginTerminal() {
  const { lockStatus } = usePluginState('spatial', 'PRO');
  const [setup, setSetup] = useState<SpatialSetup | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [spatialMode, setSpatialMode] = useState<'ON_TOP' | 'SEPARATION'>('ON_TOP');
  const [nodes, setNodes] = useState([
    { id: 'KICK', x: 0, y: 0, color: '#f43f5e', active: true },
    { id: 'SNARE', x: -0.3, y: 0.2, color: '#3b82f6', active: true },
    { id: 'HIHAT', x: 0.5, y: -0.1, color: '#10b981', active: true },
    { id: 'SYNTH', x: -0.6, y: -0.5, color: '#8b5cf6', active: true },
    { id: 'VOCAL', x: 0.2, y: 0.6, color: '#f97316', active: true },
  ]);
  const [macroMappings, setMacroMappings] = useState<Record<string, string>>({
    'btn1': 'CIRCLE',
    'btn2': 'LISS',
    'btn3': 'PINGPONG',
    'btn4': 'CIRCLE_RIGHT',
    'btn5': 'CHAOS'
  });

  // P10: Positionen tatsächlich an die AudioEngine weitergeben (kein No-Op).
  useEffect(() => {
    nodes.forEach(node => {
      if (node.active) {
        audioEngine.setSpatialPosition(node.id.toLowerCase() as TrackType, node.x, node.y);
      }
    });
  }, [nodes]);

  if (!setup) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-[#111]">
            <StartupWizard onComplete={setSetup} />
        </div>
    );
  }

  const handleSampleDrop = (sample: AudioSample) => {
    if (lockStatus.active && lockStatus.lockedBy !== 'localUser') return;
    const newNode = { 
        id: sample.name.toUpperCase().substring(0, 5), 
        x: 0, 
        y: 0, 
        color: '#f59e0b', 
        active: true 
    };
    setNodes(prev => [...prev, newNode]);
    // console.log('Sample added to spatial field:', sample.name);
  };

  const handleMacroDrop = (sample: AudioSample, btnId: string) => {
    setMacroMappings(prev => ({ ...prev, [btnId]: sample.name }));
  };

  const triggerMacro = (pattern: string) => {
    // Generatoren werden aufgerufen, um zukünftige Automations-Sequenzen vorzubereiten.
    if (pattern === 'CIRCLE') generateCircularPath(0.5, 100);
    else if (pattern === 'LISS') generateLissajousPath(3, 2, 100);
    else if (pattern === 'PINGPONG') generatePingPongPath(0.8, 100);
    else if (pattern === 'CHAOS') Array.from({ length: 100 }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 }));
  };

  return (
    <div className={`w-full h-full flex flex-col bg-[#0a0a0a] rounded-xl border ${lockStatus.active ? 'border-red-500' : 'border-neutral-800'} overflow-hidden text-neutral-300 font-sans shadow-2xl relative ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
      
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-lime-900/20 to-[#0a0a0a] border-b border-lime-900/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center border border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.3)]">
            <Box className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-widest text-neutral-100 uppercase flex items-center gap-2">
              Spatial Audio <span className="text-[10px] font-mono text-lime-400 border border-lime-500/30 px-2 py-0.5 rounded-sm">10.0</span>
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
      </div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        <div className="w-1/3 flex flex-col gap-6">
           <div className="bg-[#111] rounded-xl border border-neutral-800 p-4 shadow-inner flex-1">
             <h3 className="text-xs font-bold tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
               <Layers className="w-4 h-4" /> AUDIO STEMS
             </h3>
             <div className="flex flex-col gap-2">
               {nodes.map(node => (
                 <div key={node.id} className="flex items-center justify-between p-2 rounded bg-black/40 border border-neutral-800/50">
                   <div className="flex items-center gap-3">
                     <button className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
                     <span className="text-xs font-mono font-bold text-neutral-300">{node.id}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
           
           <div className="bg-[#111] rounded-xl border border-neutral-800 p-4 shadow-inner">
             <h3 className="text-xs font-bold tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
               <Map className="w-4 h-4" /> MACRO CONTROLS
             </h3>
             <div className="grid grid-cols-2 gap-2">
                 {Object.entries(macroMappings).map(([id, pattern]) => (
                    <DropTarget key={id} onDrop={(sample) => handleMacroDrop(sample, id)} className="bg-neutral-800 rounded text-[9px] font-bold hover:bg-lime-600 p-2 text-center">
                       <button onClick={() => triggerMacro(String(pattern))} className="w-full h-full">{pattern}</button>
                    </DropTarget>
                 ))}
             </div>
           </div>
        </div>
        
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
