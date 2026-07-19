// Audio-System Diagnose-Skript
export async function checkAudioSystem() {
  console.log("--- Audio System Diagnostics ---");
  const ctx = new AudioContext();
  console.log("Sample Rate:", ctx.sampleRate);
  console.log("State:", ctx.state);
  console.log("Destination Channels:", ctx.destination.channelCount);
  
  if (ctx.destination.channelCount < 8) {
      console.warn("WARNUNG: System unterstützt weniger als 8 Kanäle. Spatial-Surround (8.1/10.1) könnte eingeschränkt sein.");
  } else {
      console.log("OK: System unterstützt Multichannel-Audio.");
  }
  
  await ctx.close();
}
