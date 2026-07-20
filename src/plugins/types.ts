export type PluginState = 'OFF' | 'ON' | 'BYPASS';
export interface LockStatus {
  lockedBy: string | null;
  timestamp: number;
  active: boolean;
}
export interface Plugin {
  config: { id: string, name: string, colorScheme: string };
  state: PluginState;
  lockStatus: LockStatus;
  requestLock(userId: string): Promise<boolean>;
  releaseLock(userId: string): Promise<void>;
  updateState(newState: PluginState): Promise<void>;
}
