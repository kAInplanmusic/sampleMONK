export interface AudioSample {
  id: string;
  name: string;
  category: 'bass' | 'mids' | 'highs';
  type: string; // e.g. "Kick", "Acid Bass", "Clap", "Rimshot", "Open Hat", "Shaker"
  url?: string;  // Public domain/archive.org free electronic sound preview link (if available) or synthesised synth preset name
  description: string;
  parameters: {
    frequency?: number;
    decay?: number;
    pitchDecay?: number;
    oscillatorType?: string;
  };
}

export const PRESET_SAMPLE_DATABASE: AudioSample[] = [
  // BASS / LOWS (Emerald Green)
  {
    id: 'bass-909-kick',
    name: 'TR-909 Classic Kick',
    category: 'bass',
    type: 'Kick',
    url: 'https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg', // Free fallback sound preview
    description: 'The legendary punchy analog kick drum that defined the early Detroit and Berlin techno soundscapes.',
    parameters: { frequency: 55, decay: 0.4, pitchDecay: 0.05, oscillatorType: 'sine' }
  },
  {
    id: 'bass-sub-boomy',
    name: 'Sub-Sonic Boom Kick',
    category: 'bass',
    type: 'Kick',
    description: 'Deep, room-shaking warehouse bass kick with extended release for high-energy low end.',
    parameters: { frequency: 45, decay: 0.6, pitchDecay: 0.08, oscillatorType: 'triangle' }
  },
  {
    id: 'bass-acid-line',
    name: 'TB-303 Acid Sawtooth',
    category: 'bass',
    type: 'Acid Bass',
    description: 'Highly resonant, raw, distorted electronic bass synth line that drives the peak time and acid grooves.',
    parameters: { frequency: 120, decay: 0.15, oscillatorType: 'sawtooth' }
  },
  {
    id: 'bass-dub-chord',
    name: 'Deep Dub Chord Synth',
    category: 'bass',
    type: 'Sub Bass',
    description: 'Smooth, warm low-passed chord drone with deep analog tape style tape delays.',
    parameters: { frequency: 90, decay: 0.5, oscillatorType: 'square' }
  },

  // MIDS (Fuchsia / Purple)
  {
    id: 'mids-909-clap',
    name: 'TR-909 Analog Clap',
    category: 'mids',
    type: 'Clap',
    description: 'Stretching mid frequencies with a noise-burst decay to cut right through heavy low-end kicks.',
    parameters: { frequency: 1200, decay: 0.22 }
  },
  {
    id: 'mids-rimshot',
    name: 'Metallic Electro Rimshot',
    category: 'mids',
    type: 'Percussion',
    description: 'Resonant, short wooden rimshot strike mapped to add syncopation on offbeat sequences.',
    parameters: { frequency: 950, decay: 0.08 }
  },
  {
    id: 'mids-rave-stab',
    name: 'Hooover Rave Chord',
    category: 'mids',
    type: 'Synth Mid',
    description: 'Classic 90s warehouse mid-frequency chord hit with wide detuned oscillators.',
    parameters: { frequency: 320, decay: 0.35, oscillatorType: 'sawtooth' }
  },

  // HIGHS (Cyan / Blue)
  {
    id: 'highs-909-hat',
    name: 'TR-909 Open Hat',
    category: 'highs',
    type: 'Hi-Hat',
    description: 'Metallic analog open high-hat containing a rich spectrum of micro-modulated transient noise.',
    parameters: { frequency: 8000, decay: 0.14 }
  },
  {
    id: 'highs-shaker',
    name: 'Tribal Shaker Roll',
    category: 'highs',
    type: 'Hi-Hat',
    description: 'Very high frequency micro-shaker loop that adds top-end shuffle and high-velocity groove.',
    parameters: { frequency: 11000, decay: 0.04 }
  },
  {
    id: 'highs-bell',
    name: 'Resonant Acid Bell',
    category: 'highs',
    type: 'High Bells',
    description: 'Ice-cold high-pitched metallic mallet synth sound with sparkling delay echoes.',
    parameters: { frequency: 4500, decay: 0.2 }
  }
];
