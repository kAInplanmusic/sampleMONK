import React from 'react';
import { ModuleState } from '../context/ModuleStateContext';
import { usePluginManager } from '../context/PluginManagerContext';

interface ModuleContainerProps {
  id: string;
  name: string;
  state: ModuleState;
  children: React.ReactNode;
}

export const ModuleContainer: React.FC<ModuleContainerProps> = ({ id, name, state, children }) => {
  const { pluginLocks } = usePluginManager();
  const isLocked = pluginLocks[id]?.active && pluginLocks[id]?.lockedBy !== 'localUser';

  if (state === 'OFF') return null;

  return (
    <div className={`relative border rounded-xl p-4 transition-all duration-300 ${
      state === 'AUTO_AI' ? 'border-orange-500/50 bg-neutral-900/50 animate-pulse' : 'border-neutral-700 bg-neutral-900'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">{name}</h2>
        {isLocked && <span className="text-[10px] text-red-500 font-bold uppercase">Locked by Remote</span>}
      </div>
      
      {state === 'AUTO_AI' && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-600 rounded text-[9px] font-bold text-white uppercase">AI Active</div>
      )}
      
      <div className={isLocked ? 'pointer-events-none opacity-50' : ''}>
        {children}
      </div>
    </div>
  );
};
