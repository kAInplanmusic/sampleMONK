import React, { useState, useEffect, useRef } from 'react';
import { Box, Play, Pause, RefreshCw, Layers, Map, Move, Crosshair } from 'lucide-react';
import { DropTarget } from './DropTarget';
import { AudioSample } from '../data/samples';

export function SpatialPluginTerminal() {
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [nodes, setNodes] = useState([
    { id: 'KICK', x: 0, y: 0, color: '#f43f5e', active: true },
    { id: 'SNARE', x: -0.3, y: 0.2, color: '#3b82f6', active: true },
    { id: 'HIHAT', x: 0.5, y: -0.1, color: '#10b981', active: true },
    { id: 'SYNTH', x: -0.6, y: -0.5, color: '#8b5cf6', active: true },
    { id: 'VOCAL', x: 0.2, y: 0.6, color: '#f97316', active: true },
  ]);

  const [draggedNode, setDraggedNode] = useState<string | null>(null);

  const handleSampleDrop = (sample: AudioSample) => {
    // Add new node for dropped sample
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
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl relative">
      {/* ... (Header) */}
      
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Side: Controls */}
        <div className="w-1/3 flex flex-col gap-6">
            {/* ... (Existing controls) */}
        </div>
        
        {/* Right Side: DropTarget container for Visualizer */}
        <div className="flex-1">
            <DropTarget 
                label="Drop Sample to Spatial Field"
                onDrop={handleSampleDrop}
                className="w-full h-full p-4 flex flex-col items-center justify-center"
            >
                {/* ... (Existing visualizer canvas wrapper) */}
                <div className="w-full h-full max-w-[500px] max-h-[500px] bg-black rounded-full border border-neutral-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <canvas 
                        ref={canvasRef} 
                        width={500} 
                        height={500} 
                        className={`w-full h-full ${draggedNode ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </div>
            </DropTarget>
        </div>
      </div>
    </div>
  );
}

