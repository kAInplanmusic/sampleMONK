export interface TrackPreset {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  key: string;
  description: string;
  patterns: {
    kick: boolean[];
    hat: boolean[];
    clap: boolean[];
    synth: boolean[];
  };
  synthNotes: number[]; // Index maps to step, value represents pitch index in scale
  cutoff: number;
  resonance: number;
  delayTime: number;
  decay: number;
}

export type TrackType = 'kick' | 'hat' | 'clap' | 'synth';

export const MUSIC_SCALES = {
  'A Minor Pentatonic': ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4'],
  'C Minor (Acid)': ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'F3'],
  'F# Phrygian': ['F#2', 'G2', 'A#2', 'B2', 'C#3', 'D3', 'E3', 'F#3'],
};
