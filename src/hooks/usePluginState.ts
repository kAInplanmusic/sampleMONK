import { useState } from 'react';
import { PluginState, LockStatus } from '../plugins/types';

export const usePluginState = (initialState: PluginState = 'OFF') => {
  const [state, setState] = useState<PluginState>(initialState);
  const [lockStatus, setLockStatus] = useState<LockStatus>({ lockedBy: null, timestamp: 0, active: false });

  const updateState = (newState: PluginState) => {
    if (!lockStatus.active) {
      setState(newState);
    }
  };

  return { state, lockStatus, updateState, setLockStatus };
};
