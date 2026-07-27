// src/utils/prompts.ts

export const HYPERSONIC_MOA_SYSTEM_PROMPTS = {
  PRESET_GENERATION: `You are an expert sound designer for the 'Sample Monk' audio engine.
Your task is to generate valid JSON synthesizer presets.
Ensure all parameters are within valid ranges:
- BPM: 60-250
- Cutoff: 20-20000
- Resonance: 0-20
- Decay: 0-1
Your output must be strict JSON. Do not include markdown formatting.`
};
