import React, { useEffect, useRef } from 'react';
import { useSamples } from '../context/SampleContext';
import { usePluginState } from '../hooks/usePluginState';

export function HypergraphVisualizer() {
  const { samples } = useSamples();
  const { state, lockStatus, updateState } = usePluginState('ACTIVE');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const nodes = Array.from({ length: 40 }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002,
      vy: (Math.random() - 0.5) * 0.002,
      radius: Math.random() * 3 + 1,
      type: Math.random() > 0.8 ? 'agent' : 'data',
      phase: Math.random() * Math.PI * 2
    }));

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;

      // Update positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        
        if (node.x < 0 || node.x > 1) node.vx *= -1;
        if (node.y < 0 || node.y > 1) node.vy *= -1;
        
        node.x = Math.max(0, Math.min(1, node.x));
        node.y = Math.max(0, Math.min(1, node.y));
      });

      // Draw edges (Hypergraph semantic links)
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 0.2) {
            const opacity = (0.2 - dist) / 0.2;
            const isAgentLink = nodes[i].type === 'agent' || nodes[j].type === 'agent';
            ctx.strokeStyle = isAgentLink 
              ? `rgba(34, 211, 238, ${opacity * 0.5})` // Cyan for agent logic
              : `rgba(139, 92, 246, ${opacity * 0.3})`; // Purple for audio data
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * width, nodes[i].y * height);
            ctx.lineTo(nodes[j].x * width, nodes[j].y * height);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        const pulse = Math.sin(time * 2 + node.phase) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(node.x * width, node.y * height, node.radius + (node.type === 'agent' ? pulse * 2 : 0), 0, Math.PI * 2);
        
        if (node.type === 'agent') {
          ctx.fillStyle = `rgba(34, 211, 238, ${0.8 + pulse * 0.2})`; // Cyan agents
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = `rgba(167, 139, 250, ${0.5 + pulse * 0.3})`; // Purple data nodes
          ctx.shadowColor = '#a78bfa';
          ctx.shadowBlur = 5;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${lockStatus.active && lockStatus.lockedBy !== 'localUser' ? 'opacity-50 grayscale' : ''}`}>
        <div className="absolute top-4 right-4 z-10">
            <select value={state} onChange={(e) => updateState(e.target.value as any)} className="bg-black text-white text-xs p-1 rounded">
                <option value="OFF">OFF</option>
                <option value="AI_CONTROLLED">AI</option>
                <option value="ACTIVE">ACTIVE</option>
            </select>
        </div>
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070709] via-transparent to-[#070709]"></div>
        </div>
    </div>
  );
}
