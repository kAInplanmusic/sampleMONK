import React, { createContext, useContext, useState } from 'react';

export type ModuleState = 'OFF' | 'AUTO_AI' | 'PRO';

interface ModuleContextType {
  moduleStates: Record<string, ModuleState>;
  setModuleState: (id: string, state: ModuleState) => void;
}

const ModuleStateContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({});

  const setModuleState = (id: string, state: ModuleState) => {
    setModuleStates(prev => ({ ...prev, [id]: state }));
  };

  return (
    <ModuleStateContext.Provider value={{ moduleStates, setModuleState }}>
      {children}
    </ModuleStateContext.Provider>
  );
};

export const useModuleState = () => {
  const context = useContext(ModuleStateContext);
  if (!context) throw new Error('useModuleState must be used within ModuleStateProvider');
  return context;
};
