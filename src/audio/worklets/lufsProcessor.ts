// src/audio/worklets/lufsProcessor.ts
class LufsProcessor extends AudioWorkletProcessor {
  private lufsBuffer: Float32Array | null = null; // SAB for LUFS data

  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data.buffer) {
        this.lufsBuffer = new Float32Array(event.data.buffer);
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    if (input.length > 0 && this.lufsBuffer) { // Check if SAB is available
      // ITU-R BS.1770-5 simple RMS approximation for LUFS
      let sum = 0;
      for (let i = 0; i < input[0].length; i++) {
        sum += input[0][i] * input[0][i];
      }
      const rms = Math.sqrt(sum / input[0].length);
      const lufs = 20 * Math.log10(rms) - 0.691; // simplified LUFS
      
      // Write LUFS value to SharedArrayBuffer
      Atomics.store(this.lufsBuffer, 0, lufs); // Store at index 0
    }
    return true;
  }
}
registerProcessor('lufs-processor', LufsProcessor);
