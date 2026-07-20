import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LockStatus } from '../plugins/types';

interface PluginManagerContextType {
  pluginLocks: Record<string, LockStatus>;
  requestLock: (pluginId: string, userId: string) => boolean;
  releaseLock: (pluginId: string, userId: string) => void;
}

const PluginManagerContext = createContext<PluginManagerContextType | undefined>(undefined);

export const PluginManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pluginLocks, setPluginLocks] = useState<Record<string, LockStatus>>({});

  const requestLock = (pluginId: string, userId: string) => {
    const lock = pluginLocks[pluginId];
    if (lock && lock.active && lock.lockedBy !== userId) {
      return false; // Already locked by someone else
    }
    setPluginLocks(prev => ({
      ...prev,
      [pluginId]: { lockedBy: userId, timestamp: Date.now(), active: true }
    }));
    return true;
  };

  const releaseLock = (pluginId: string, userId: string) => {
    setPluginLocks(prev => ({
      ...prev,
      [pluginId]: { lockedBy: null, timestamp: 0, active: false }
    }));
  };

  return (
    <PluginManagerContext.Provider value={{ pluginLocks, requestLock, releaseLock }}>
      {children}
    </PluginManagerContext.Provider>
  );
};

export const usePluginManager = () => {
  const context = useContext(PluginManagerContext);
  if (!context) throw new Error('usePluginManager must be used within a PluginManagerProvider');
  return context;
};
