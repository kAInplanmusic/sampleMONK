import React, { useRef, useState, useEffect } from 'react';
import { audioEngine } from '../../utils/audioEngine';

interface Point { x: number, y: number }
interface Path { points: Point[], layer: number, color: string }

export const SpatialCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const [activeLayer, setActiveLayer] = useState(0);
  const [quantization, setQuantization] = useState(4); // Beats

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    setPaths([...paths, { points: [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }], layer: activeLayer, color: 'lime' }]);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const newPaths = [...paths];
    newPaths[newPaths.length - 1].points.push({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    setPaths(newPaths);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = 2;
        path.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    });
  }, [paths]);

  useEffect(() => {
    // Sync with audioEngine clock
    audioEngine.setOnBeatCallback((step) => {
      // Logic: Update the 'playback' position on the paths based on the beat
      // If a path is drawn for 4 beats, progress the 'playhead' based on current step
      const progress = (step % (quantization * 4)) / (quantization * 4);
      // updateSpatialAudioPosition(progress);
    });
  }, [quantization]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 text-[10px] font-mono text-neutral-500">
        <span>QUANT:</span>
        {[1, 4, 8].map(q => (
          <button key={q} onClick={() => setQuantization(q)} className={quantization === q ? 'text-lime-400' : ''}>{q} B</button>
        ))}
        <span className="ml-4">LAYER:</span>
        {[0, 1, 2].map(l => (
          <button key={l} onClick={() => setActiveLayer(l)} className={activeLayer === l ? 'text-lime-400' : ''}>{l}</button>
        ))}
      </div>
      <canvas 
        ref={canvasRef}
        width={500}
        height={500}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
