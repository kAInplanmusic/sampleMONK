// src/components/spatial/types.ts
export type SpeakerSetup = '10.0-EarLevel' | '7.1-Surround' | 'Stereo';

export interface SpatialSetup {
  roomWidth: number; // in meters
  roomDepth: number; // in meters
  speakerSetup: SpeakerSetup;
  isPhysicalSetupValid: boolean;
}
