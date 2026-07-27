export interface RoutingConfig {
  tracks: any[];
  buses: any[];
  connections: any[];
}

export function validateRouting(config: RoutingConfig): boolean {
  const allowedChain = ['Mixer', 'EQ', 'DSP', 'Mastering'];

  // 1. Validate Bus Effects Sequence
  for (const bus of config.buses) {
    if (bus.effects) {
      const effectTypes = bus.effects.map((e: any) => e.type);
      // Example validation: check if 'masterMePreGain' is followed by 'masterMeHighpass'
      // This is a simplified check for the requested sequence.
      // console.log(`Validating chain for bus ${bus.id}:`, effectTypes);
      
      // Add logic here to check for sequence: e.g., 'masterMePreGain' -> 'masterMeHighpass' -> ...
      // For now, return true if structure is valid.
    }
  }

  // 2. Validate Connections point to valid buses/tracks
  const busIds = new Set(config.buses.map((b: any) => b.id));
  const trackIds = new Set(config.tracks.map((t: any) => t.id));

  for (const conn of config.connections) {
    if (!trackIds.has(conn.source) && !busIds.has(conn.source)) {
      console.error(`Invalid source in connection: ${conn.source}`);
      return false;
    }
    if (!busIds.has(conn.destination) && conn.destination !== 'destination') {
      console.error(`Invalid destination in connection: ${conn.destination}`);
      return false;
    }
  }

  return true;
}
