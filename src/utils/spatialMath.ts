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


// ============================================================================
// Task 17: HRTF-Spatial-Hub (Kopfhörer-Binaural-Simulation)
// ----------------------------------------------------------------------------
// Vereinfachte HRTF-Modellierung: ITD (Interaural Time Delay) + ILD
// (Interaural Level Difference) aus dem Azimutwinkel. Geeignet für Headphone-
// Monitoring (Cue/Engineer) ohne echte IR-Konvolutions.
// ============================================================================

export interface HrtfResult {
  azimuth: number;      // -180..180 Grad (0 = vorne)
  elevation: number;    // -90..90 Grad
  itdSamples: number;   // Verzögerung zwischen L/R in Samples (0 = mittig)
  ildDb: number;        // Pegeldifferenz L-R in dB (positiv = Richtung rechts)
  leftGain: number;     // 0..1 Verstärkung links
  rightGain: number;    // 0..1 Verstärkung rechts
}

const HEAD_RADIUS_NORM = 0.24; // ~9cm Kopfradius / Schallgeschwindigkeit (in ms/cm)

/** Konvertiert x,y (-1..1) in Azimut/Elevation. */
export function toAzimuthElevation(x: number, y: number): { azimuth: number; elevation: number } {
  // x: links(-1)–rechts(1), y: hinten(-1)–vorne(1)
  const azimuth = Math.atan2(x, y) * 180 / Math.PI; // 0 vorne, positiv rechts
  const elevation = 0; // Kanonisches Modell → direkt am Ohr
  return { azimuth, elevation };
}

/** Berechnet HRTF-Ergebnis für eine Kopfhörer-Cue-(Stereo-)Simulation. */
export function calculateHRTF(x: number, y: number, sampleRate = 48000): HrtfResult {
  const { azimuth, elevation } = toAzimuthElevation(x, y);
  const rad = azimuth * Math.PI / 180;
  // ITD angenähert (Woodworth): sin(azimuth) in Sekunden, auf sinnvollen Bereich begrenzt
  const itdMs = HEAD_RADIUS_NORM * Math.sin(rad); // in ms (±~0.24ms max für einseitiges Ohr)
  let itdSamples = Math.round(sampleRate * itdMs * 0.001);
  const maxSamples = Math.round(sampleRate * 0.0007); // ±0.7ms Obergrenze (physikalisch)
  itdSamples = Math.max(-maxSamples, Math.min(maxSamples, itdSamples));
  // ILD: sinnvoll zwischen -10 und +10 dB (Richtungspegel-Differenz)
  const ildDb = -10 * Math.sin(rad);
  // Beide Kanäle gains ableiten (Summe ~ 1, aber richtungsabhängig)
  const rightGain = Math.min(1, Math.max(0, 0.5 + 0.5 * Math.sin(rad)));
  const leftGain = Math.min(1, Math.max(0, 0.5 - 0.5 * Math.sin(rad)));
  return { azimuth, elevation, itdSamples, ildDb, leftGain, rightGain };
}
