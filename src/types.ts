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
    snare: boolean[];
    tom: boolean[];
    perc: boolean[];
    bass: boolean[];
  };
  synthNotes: number[]; // Index maps to step, value represents pitch index in scale
  cutoff: number;
  resonance: number;
  delayTime: number;
  decay: number;
}

export type TrackType = 'kick' | 'hat' | 'clap' | 'synth' | 'snare' | 'tom' | 'perc' | 'bass';

export interface AudioElement {
  id: string;
  name: string;
  type: 'sample' | 'song' | 'noise';
  source: string;
  tags: string[];
  frequency?: number;
  duration?: number;
  url?: string;
  createdAt: string;
}

export interface MotionSequence {
  id: string;
  name: string;
  type: string; // e.g. 'automation', 'rhythm_pattern'
  tags: string[];
  data: any;
  createdAt: string;
}

export const MUSIC_SCALES = {
  'A Minor Pentatonic': ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4'],
  'C Minor (Acid)': ['C2', 'Eb2', 'F2', 'G2', 'Bb2', 'C3', 'Eb3', 'F3'],
  'F# Phrygian': ['F#2', 'G2', 'A#2', 'B2', 'C#3', 'D3', 'E3', 'F#3'],
};
