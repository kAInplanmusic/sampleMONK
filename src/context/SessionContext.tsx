import React, { createContext, useContext, useState } from 'react';
import { AudioSample } from '../data/samples';

interface SessionContextType {
  scratchpadItems: AudioSample[];
  addToScratchpad: (sample: AudioSample) => void;
  removeFromScratchpad: (id: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scratchpadItems, setScratchpadItems] = useState<AudioSample[]>([]);

  const addToScratchpad = (sample: AudioSample) => {
    setScratchpadItems(prev => prev.find(i => i.id === sample.id) ? prev : [...prev, sample]);
  };

  const removeFromScratchpad = (id: string) => {
    setScratchpadItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <SessionContext.Provider value={{ scratchpadItems, addToScratchpad, removeFromScratchpad }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
