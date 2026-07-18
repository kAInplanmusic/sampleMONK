import React, { useRef, useState } from 'react';
import { motion, useDragControls } from 'motion/react';
import { GripHorizontal } from 'lucide-react';

export const DraggableWindow = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [zIndex, setZIndex] = useState(10);
  
  return (
    <motion.div 
      drag 
      dragMomentum={false}
      onDragStart={() => setZIndex(50)}
      onDragEnd={() => setZIndex(10)}
      style={{ zIndex }}
      className={`relative cursor-grab active:cursor-grabbing bg-transparent ${className || ''}`}
    >
      <div className="absolute top-0 left-0 w-full h-4 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10 pointer-events-none">
         <GripHorizontal className="w-6 h-6 text-white/50" />
      </div>
      <div className="pointer-events-auto">
        {children}
      </div>
    </motion.div>
  );
};
