// src/audio/worklets/dspProcessor.ts
class DspProcessor extends AudioWorkletProcessor {
  // Parameters can be dynamic
  static get parameterDescriptors() {
    return [
      { name: 'cutoff', defaultValue: 1000, minValue: 20, maxValue: 20000 },
      { name: 'gain', defaultValue: 0 }
    ];
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>) {
    const input = inputs[0];
    const output = outputs[0];
    const gainParam = parameters.gain;
    
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; i++) {
        // Use gain param, defaulting to 1 if not provided or per-sample value
        const gain = gainParam.length > 1 ? gainParam[i] : gainParam[0];
        outputChannel[i] = inputChannel[i] * gain;
      }
    }
    return true;
  }
}
registerProcessor('dsp-processor', DspProcessor);
