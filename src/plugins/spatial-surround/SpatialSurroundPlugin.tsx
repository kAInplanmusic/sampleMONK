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
  private currentPanner: AudioNode | null = null; // Can be AudioWorkletNode or StereoPannerNode
  private isWorkletPanner: boolean = false; // To track which panner is active
  private _posX: number = 0; // Stored X position (-1 to 1)
  private _posY: number = 0; // Stored Y position (-1 to 1)
  private _positionBuffer: SharedArrayBuffer | null = null;
  private _positionBufferView: Float32Array | null = null;

  async init(ctx: AudioContext) {
    this.audioCtx = ctx;

    // Allocate SAB for position data (x, y)
    this._positionBuffer = new SharedArrayBuffer(2 * Float32Array.BYTES_PER_ELEMENT);
    this._positionBufferView = new Float32Array(this._positionBuffer);
    
    // Attempt to use AudioWorkletNode
    try {
      if (this.audioCtx && typeof AudioWorkletNode !== 'undefined' && this.audioCtx.audioWorklet) {
        // Worklet is now loaded centrally by AudioContext.tsx
        const workletPanner = new AudioWorkletNode(this.audioCtx, 'spatial-panner-processor');
        this.currentPanner = workletPanner;
        this.isWorkletPanner = true;
        // Pass SAB to the worklet
        if (this._positionBuffer) { // Ensure buffer is allocated
          workletPanner.port.postMessage({ buffer: this._positionBuffer });
        }
        console.log("SpatialSurroundPlugin: Using AudioWorkletNode for panning.");
      } else {
        throw new Error("AudioWorkletNode not supported or context not available.");
      }
    } catch (error) {
      console.warn("SpatialSurroundPlugin: Failed to create AudioWorkletNode. Falling back to StereoPannerNode.", error);
      this.isWorkletPanner = false;
      if (this.audioCtx && typeof this.audioCtx.createStereoPanner === 'function') {
        this.currentPanner = this.audioCtx.createStereoPanner();
        console.log("SpatialSurroundPlugin: Using StereoPannerNode for panning.");
      } else if (this.audioCtx) {
        // Fallback to a simple GainNode if StereoPannerNode is also not available (very old browsers)
        this.currentPanner = this.audioCtx.createGain();
        console.log("SpatialSurroundPlugin: Using GainNode as fallback for panning.");
      } else {
        console.error("SpatialSurroundPlugin: No AudioContext available to create any panner.");
      }
    }

    // Connect the panner (assuming it's connected elsewhere in the audio graph)
    // For now, this.currentPanner will be available for connection by the system using this plugin.
  }

  // Helper to map x,y to pan value for StereoPannerNode
  private mapXYToPan(x: number, y: number): number {
    // Simple mapping: x from -1 to 1 directly maps to pan from -1 (left) to 1 (right)
    // y could be used for volume adjustment if needed, but not for stereo pan.
    return x; 
  }

  setPosition(x: number, y: number) {
    // Input Validation
    const safeX = Math.max(-1, Math.min(1, x));
    const safeY = Math.max(-1, Math.min(1, y));

    this._posX = safeX; // Store safe values
    this._posY = safeY;

    if (this.currentPanner) {
      if (this.isWorkletPanner && (this.currentPanner instanceof AudioWorkletNode)) {
        // Write to SAB instead of postMessage
        if (this._positionBufferView) {
            Atomics.store(this._positionBufferView, 0, safeX); // Store X at index 0
            Atomics.store(this._positionBufferView, 1, safeY); // Store Y at index 1
        }
      } else if (!this.isWorkletPanner && (this.currentPanner instanceof StereoPannerNode)) {
        this.currentPanner.pan.setValueAtTime(this.mapXYToPan(safeX, safeY), this.audioCtx?.currentTime || 0);
      }
      // If it's a GainNode fallback, setPosition might not do anything or adjust volume.
      // For now, no action for GainNode fallback.
    }
  }

  getPosition(): { x: number; y: number } {
    return { x: this._posX, y: this._posY };
  }

  handleClock(timestamp: number) {
    // Hier könnte Tempo-Synchronisation stattfinden
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
  const [uiPosX, setUiPosX] = useState(0); // Normalized X (-1 to 1)
  const [uiPosY, setUiPosY] = useState(0); // Normalized Y (-1 to 1)

  useEffect(() => {
    // Initialize UI position from plugin's current position
    const { x, y } = plugin.getPosition();
    setUiPosX(x);
    setUiPosY(y);

    const interval = setInterval(() => {
      const { x, y } = plugin.getPosition();
      setUiPosX(x);
      setUiPosY(y);
    }, 50); // Poll position periodically

    return () => clearInterval(interval);
  }, [plugin]);


  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
    plugin.setPosition(x, y);
    // Directly update local UI state for responsiveness
    setUiPosX(x);
    setUiPosY(y);
  };

  // Calculate pixel position for the dot
  const dotStyle = {
    left: `${(uiPosX + 1) / 2 * 100}%`, // Convert -1 to 1 range to 0% to 100%
    top: `${(uiPosY + 1) / 2 * 100}%`,  // Convert -1 to 1 range to 0% to 100%
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
           {/* Blue dot reflecting position */}
           <div 
             className="absolute w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2" 
             style={dotStyle} // Apply dynamic style
           ></div>
        </div>
      )}
    />
  );
};

