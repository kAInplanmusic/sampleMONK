// src/audio/worklets/analyzerProcessor.ts
class AnalyzerProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    
    // Send raw audio data to main thread for visualization
    if (input.length > 0) {
      this.port.postMessage({ waveform: input[0].slice(0, 128) });
    }
    
    return true;
  }
}
registerProcessor('analyzer-processor', AnalyzerProcessor);
