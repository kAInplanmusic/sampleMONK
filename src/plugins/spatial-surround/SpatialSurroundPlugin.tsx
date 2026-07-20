import React from 'react';
import { PluginBase } from '../PluginBase';
import { PluginState, LockStatus, Plugin } from '../types';
import { hubConnector } from '../../hubConnector';

export class SpatialSurroundPlugin implements Plugin {
  config = { id: 'spatial-surround', name: 'SpatialSurround', colorScheme: 'blue' };
  state: PluginState = 'OFF';
  lockStatus: LockStatus = { lockedBy: null, timestamp: 0, active: false };

  // Audio Kontext Integration
  private audioCtx: AudioContext | null = null;
  private pannerNode: AudioWorkletNode | null = null;

  async init(ctx: AudioContext) {
    this.audioCtx = ctx;
    await this.audioCtx.audioWorklet.addModule('/wam/spatial/spatial-processor.js');
    this.pannerNode = new AudioWorkletNode(this.audioCtx, 'spatial-panner-processor');
  }

  handleClock(timestamp: number) {
    // Hier könnte Tempo-Synchronisation stattfinden
  }

  setPosition(x: number, y: number) {
    if (this.pannerNode) {
      this.pannerNode.port.postMessage({ type: 'position', x, y });
    }
  }

  async requestLock(userId: string): Promise<boolean> {
    const success = await hubConnector.lockPlugin(this.config.id, userId);
    if (success) {
      this.lockStatus = { lockedBy: userId, timestamp: Date.now(), active: true };
    }
    return success;
  }

  async releaseLock(userId: string): Promise<void> {
    await hubConnector.unlockPlugin(this.config.id, userId);
    this.lockStatus = { lockedBy: null, timestamp: 0, active: false };
  }

  async updateState(newState: PluginState): Promise<void> {
    this.state = newState;
  }
}

export const SpatialSurroundUI: React.FC<{plugin: SpatialSurroundPlugin, currentUserId: string}> = ({ plugin, currentUserId }) => {
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    plugin.setPosition(x, y);
  };

  return (
    <PluginBase
      name={plugin.config.name}
      state={plugin.state}
      lockStatus={plugin.lockStatus}
      currentUserId={currentUserId}
      onStateChange={(s) => plugin.updateState(s)}
      renderProUI={() => (
        <div className="w-full h-48 bg-neutral-900 rounded border border-neutral-700 relative cursor-crosshair" onMouseMove={handleMove}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 to-transparent"></div>
           <div className="absolute w-4 h-4 bg-blue-500 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      )}
    />
  );
};
