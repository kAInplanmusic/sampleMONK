import React, { useState, useEffect, useRef } from 'react';
import { Box, Play, Pause, RefreshCw, Layers, Map, Move, Crosshair } from 'lucide-react';

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

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) * 0.9;

      // Clear
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      // Draw Room / Grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      
      // Circles
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (radius / 4) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.stroke();

      // Listener (Center)
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Nodes
      nodes.forEach(node => {
        if (!node.active) return;
        
        // Add subtle movement if playing
        const xOffset = isPlaying ? Math.sin(time * 0.5 + node.x * 10) * 0.05 : 0;
        const yOffset = isPlaying ? Math.cos(time * 0.5 + node.y * 10) * 0.05 : 0;
        
        const px = cx + (node.x + xOffset) * radius;
        const py = cy + (node.y + yOffset) * radius;

        // Draw shadow/glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = node.color;
        
        ctx.beginPath();
        ctx.arc(px, py, draggedNode === node.id ? 10 : 8, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.shadowBlur = 0; // reset
        
        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, px, py - 15);
      });

      time += 0.05;
      frameId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => cancelAnimationFrame(frameId);
  }, [nodes, isPlaying, draggedNode]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) * 0.9;
    
    // Convert to normalized coordinates (-1 to 1)
    const normX = (x - cx) / radius;
    const normY = (y - cy) / radius;
    
    // Find closest node
    let closestNode = null;
    let minDist = 0.15; // Hit radius
    
    nodes.forEach(node => {
      const dist = Math.sqrt(Math.pow(node.x - normX, 2) + Math.pow(node.y - normY, 2));
      if (dist < minDist) {
        minDist = dist;
        closestNode = node.id;
      }
    });
    
    if (closestNode) setDraggedNode(closestNode);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) * 0.9;
    
    // Convert and clamp
    let normX = (x - cx) / radius;
    let normY = (y - cy) / radius;
    
    const dist = Math.sqrt(normX*normX + normY*normY);
    if (dist > 1) {
      normX /= dist;
      normY /= dist;
    }
    
    setNodes(nodes.map(n => n.id === draggedNode ? { ...n, x: normX, y: normY } : n));
  };

  const handleMouseUp = () => setDraggedNode(null);

  const toggleNode = (id: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, active: !n.active } : n));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] rounded-xl border border-neutral-800 overflow-hidden text-neutral-300 font-sans shadow-2xl relative">
      
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
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-4 py-2 rounded text-xs font-bold tracking-widest flex items-center gap-2 transition-colors ${isPlaying ? 'bg-lime-500/20 text-lime-400 border border-lime-500/50' : 'bg-[#222] text-neutral-400 border border-neutral-700 hover:bg-[#333]'}`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'LFO ACTIVE' : 'LFO PATHS'}
        </button>
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
                       onClick={() => toggleNode(node.id)}
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
             <h3 className="text-xs font-bold tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
               <Map className="w-4 h-4" /> MACRO CONTROLS
             </h3>
             
             <div className="flex flex-col gap-6 flex-1 justify-center">
               <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                   <span>ROOM SIZE</span>
                   <span className="text-lime-400">LARGE</span>
                 </div>
                 <input type="range" className="w-full accent-lime-500" defaultValue="75" />
               </div>
               
               <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                   <span>DOPPLER INTENSITY</span>
                   <span className="text-lime-400">40%</span>
                 </div>
                 <input type="range" className="w-full accent-lime-500" defaultValue="40" />
               </div>
               
               <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                   <span>LOW FREQUENCY LFE</span>
                   <span className="text-lime-400">80Hz</span>
                 </div>
                 <input type="range" className="w-full accent-lime-500" defaultValue="80" />
               </div>
             </div>
             
             <button className="w-full mt-4 py-3 bg-[#222] hover:bg-[#333] border border-neutral-700 rounded text-[10px] font-bold tracking-widest text-neutral-400 flex items-center justify-center gap-2 transition-colors">
               <RefreshCw className="w-3 h-3" /> RESET POSITIONS
             </button>
           </div>
        </div>
        
        {/* Right Side: Visualizer Canvas */}
        <div className="flex-1 bg-[#111] rounded-xl border border-neutral-800 p-4 shadow-inner relative flex flex-col items-center justify-center">
          <div className="absolute top-4 left-4 text-[10px] font-mono text-neutral-500 flex items-center gap-2">
            <Crosshair className="w-3 h-3 text-lime-500" /> FRONT
          </div>
          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-neutral-500">REAR</div>
          <div className="absolute top-4 right-4 text-[10px] font-mono text-neutral-500">RIGHT</div>
          <div className="absolute top-4 left-4 ml-16 text-[10px] font-mono text-neutral-500">LEFT</div>
          
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
        </div>
        
      </div>
    </div>
  );
}
