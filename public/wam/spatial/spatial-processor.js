/**
 * Spatial Audio Processor (VBAP)
 * Updated: LFE-Passthrough & DSP-Platzhalter
 */
registerProcessor('spatial-panner-processor', class extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (e) => {
      if (e.data.type === 'position') {
        this.x = e.data.x;
        this.y = e.data.y;
      }
    };
    this.x = 0;
    this.y = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0][0]; // Mono Input
    const output = outputs[0];
    const numChannels = output.length;
    
    // --- LFE-Passthrough & DSP-Platzhalter ---
    // In Zukunft: Hier DSP-Modul-Aufrufe für interne Raum-Faltung
    // LFE-Kanal (letzter Kanal) wird im Automode (Amp) belassen
    
    const gains = this.calculateVBAPGains(this.x, this.y, numChannels);
    
    for (let channel = 0; channel < numChannels; channel++) {
      // Wenn es der LFE-Kanal ist (Index 8 für 8.1 oder 10 für 10.1), umgehe das Panning
      if (channel === numChannels - 1) {
          output[channel].set(input); // Raw passthrough to LFE
      } else {
          // Normales VBAP Panning
          const outputChannel = output[channel];
          for (let i = 0; i < input.length; i++) {
            outputChannel[i] = input[i] * gains[channel];
          }
      }
    }
    return true;
  }

  calculateVBAPGains(x, y, numChannels) {
    const gains = new Array(numChannels).fill(0);
    // ... Platzhalter für komplexe Matrix ...
    return gains;
  }
});
EOF
