import { z } from 'zod';

export const PresetSchema = z.object({
  global: z.object({
    tempo: z.number().min(30).max(300).optional(),
    masterVolume: z.number().min(-100).max(0).optional(),
  }).optional(),
  tracks: z.array(z.object({
    id: z.string(),
    instrument: z.string(),
    params: z.record(z.string(), z.any()).optional(),
    effects: z.array(z.object({
      type: z.string(),
      params: z.record(z.string(), z.any()).optional()
    })).optional(),
    output: z.string(),
    patterns: z.array(z.boolean()).optional()
  })).optional(),
  buses: z.array(z.object({
    id: z.string(),
    effects: z.array(z.object({
      type: z.string(),
      params: z.record(z.string(), z.any()).optional()
    })).optional(),
    output: z.string()
  })).optional(),
  connections: z.array(z.object({
    source: z.string(),
    destination: z.string()
  })).optional()
});

export const GeminiPresetSchema = z.object({
  name: z.string().optional(),
  bpm: z.number().min(60).max(250),
  cutoff: z.number().min(20).max(20000),
  resonance: z.number().min(0).max(20),
  decay: z.number().min(0).max(1),
  engine: z.enum(['SUBTRACTIVE', 'FM', 'WAVETABLE']).optional(),
  patterns: z.record(z.string(), z.array(z.boolean()).length(16)).optional(),
  synthNotes: z.array(z.number()).length(16).optional()
});

export type Preset = z.infer<typeof PresetSchema>;
export type GeminiPreset = z.infer<typeof GeminiPresetSchema>;

export function validatePreset(data: unknown): Preset {
  return PresetSchema.parse(data);
}

export function validateGeminiPreset(data: unknown): GeminiPreset {
  return GeminiPresetSchema.parse(data);
}
