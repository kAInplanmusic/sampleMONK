// src/audio/worklets/analyzerProcessor.ts
class AnalyzerProcessor extends AudioWorkletProcessor {
  private sharedBuffer: Float32Array | null = null;

  constructor() {
    super();
    this.port.onmessage = (e) => {
      if (e.data.buffer) {
        this.sharedBuffer = new Float32Array(e.data.buffer);
      }
    };
  }

  process(inputs: Float32Array[][], _outputs: Float32Array[][], _parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    
    // Write raw audio data to the shared buffer for visualization
    if (this.sharedBuffer && input.length > 0) {
      this.sharedBuffer.set(input[0].slice(0, this.sharedBuffer.length));
    }
    
    return true;
  }
}
registerProcessor('analyzer-processor', AnalyzerProcessor);
