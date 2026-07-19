import React, { useEffect, useRef, useState } from 'react';

export const DrumMachineTerminal: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [isGenerating, setIsGenerating] = useState(false);

  // High-performance rendering loop (Phase 5)
  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(10, 10, 50, 50); // Playhead indicator
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const generateSample = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:8000/api/generate-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      console.log("Sample generation task triggered:", data.task_id);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="drum-machine-ui p-4 bg-gray-800 rounded-lg">
      <canvas ref={canvasRef} width={800} height={200} className="border border-gray-600 mb-4" />
      <button 
        className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
        onClick={() => generateSample("A crisp snare drum")}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Snare Sample"}
      </button>
    </div>
  );
};
