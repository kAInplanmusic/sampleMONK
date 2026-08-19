import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ModuleState = 'OFF' | 'AUTO_AI' | 'PRO';

const STORAGE_KEY = 'audiomonastry_module_states';

interface ModuleContextType {
  moduleStates: Record<string, ModuleState>;
  setModuleState: (id: string, state: ModuleState) => void;
}

const ModuleStateContext = createContext<ModuleContextType | undefined>(undefined);

const loadPersistedStates = (): Record<string, ModuleState> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return {};
};

export const ModuleStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>(loadPersistedStates);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(moduleStates));
    } catch { /* quota exceeded – non-critical */ }
  }, [moduleStates]);

  const setModuleState = useCallback((id: string, state: ModuleState) => {
    setModuleStates(prev => ({ ...prev, [id]: state }));
  }, []);

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
