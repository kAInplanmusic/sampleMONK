import React, { useEffect, useRef } from 'react';

export const LiveMonitor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const audioCtx = new AudioContext({ sampleRate: 48000 });
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    
    // WebSocket Stream vom Master-Signal
    const ws = new WebSocket(`ws://${window.location.host}/api/master-stream`);
    
    // Visualization Loop
    const draw = () => {
      requestAnimationFrame(draw);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);
      
      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(16, 185, 129)';
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / analyser.frequencyBinCount;
      let x = 0;
      for(let i = 0; i < analyser.frequencyBinCount; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);
  
  return <canvas ref={canvasRef} className="w-full h-screen bg-black" width="1920" height="1080" />;
};
