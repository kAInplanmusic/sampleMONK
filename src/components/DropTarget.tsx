import React from 'react';
import { useSamples } from '../context/SampleContext';
import { AudioSample } from '../data/samples';

interface DropTargetProps {
  onDrop: (sample: AudioSample) => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}

export const DropTarget: React.FC<DropTargetProps> = ({ onDrop, children, className = '', label }) => {
  const { setSelectedSample } = useSamples();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(data);
      setSelectedSample(data);
    } catch (err) {
      console.error("Invalid sample dropped", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div 
      onDragOver={handleDragOver} 
      onDrop={handleDrop} 
      className={`relative border-2 border-dashed border-neutral-700 rounded-lg hover:border-fuchsia-500 transition-colors ${className}`}
    >
      {label && <span className="absolute top-1 left-2 text-[8px] font-mono text-neutral-500 uppercase">{label}</span>}
      {children}
    </div>
  );
};
