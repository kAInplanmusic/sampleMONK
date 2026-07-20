import React from 'react';
import { PluginState, LockStatus } from './types';

interface PluginBaseProps {
  name: string;
  state: PluginState;
  lockStatus: LockStatus;
  currentUserId: string;
  onStateChange: (state: PluginState) => void;
  renderProUI: () => React.ReactNode;
}

export const PluginBase: React.FC<PluginBaseProps> = ({ name, state, lockStatus, renderProUI }) => (
  <div className="p-4 border rounded shadow">
    <h2 className="text-lg font-bold">{name}</h2>
    <div>Status: {state}</div>
    <div className="mt-4">{renderProUI()}</div>
  </div>
);
