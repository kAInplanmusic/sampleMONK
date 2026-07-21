// src/utils/spatialMath.ts

export interface PanningResult {
  channels: number[]; // 10 channels for 10.0
}

/**
 * Panning algorithm for 10.0 Spatial Audio.
 * Input: x, y coordinate (range -1 to 1)
 */
export function calculate10ChannelPan(x: number, y: number): PanningResult {
  // Provided math:
  // Py/2 = y/2 -> Py = y
  // Px/2 = -x/2 -> Px = -x
  const px = -x;
  const py = y;

  // This is a simplified panning model.
  // In a real 10.0 setup, this would be a VBAP or Ambisonics decoder.
  // For now, we map the calculated Px/Py to 10 output channels.
  const channels = new Array(10).fill(0);
  
  // Basic distribution logic based on Px, Py
  channels[0] = Math.max(0, 1 - Math.abs(px) - Math.abs(py)); // Center
  channels[1] = Math.max(0, px); // Front-Right
  channels[2] = Math.max(0, -px); // Front-Left
  channels[3] = Math.max(0, py); // Back-Right
  channels[4] = Math.max(0, -py); // Back-Left
  // ... and so on for 10 channels
  
  return { channels };
}
