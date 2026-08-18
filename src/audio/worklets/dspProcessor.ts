/**
 * dspProcessor – DSP-Engine (AudioWorklet)
 * -----------------------------------------
 * Funktionen:
 *  - Phasenkorrektur im Bassbereich via Allpass 1. Ordnung (PhaseAlignmentTilt).
 *  - Dynamisches Filter: Envelope Follower glättet das Eingangssignal und
 *    moduliert in Echtzeit die Cutoff-Frequenz (Auto-Filter / Dynamic EQ).
 *  - Optionaler Soft-Clipper (Waveshaper) für harmonische Sättigung.
 *
 * Port-Nachrichten:
 *   { phase: <0..1> }                       → Allpass-Stärke
 *   { filterCutoff, resonance, depth }      → dynamisches Filter
 *   { drive: <0..1> }                       → Soft-Clipping
 */
class DspProcessor extends AudioWorkletProcessor {
  // Allpass (1. Ordnung)
  private apCoef = 0.2;
  private ap1Z = 0;
  // Envelope Follower Zustand
  private env = 0;
  private envAttack = 0.02;
  private envRelease = 0.08;
  // Dynamisches Filter
  private filterCo = [1,0,0,0,0]; // lowpass biquad
  private filterZ = [0,0];
  private baseCutoff = 1000;
  private resonance = 0.5;
  private depth = 0.4;
  private drive = 0;

  constructor() {
    super();
    this.port.onmessage = (e) => {
      const m = e.data; if (!m) return;
      if (m.reset) { this.ap1Z=0; this.filterZ=[0,0]; this.env=0; }
      if (typeof m.phase === 'number') this.apCoef = (m.phase - 0.5); // -0.5..0.5
      if (typeof m.filterCutoff === 'number') this.baseCutoff = m.filterCutoff;
      if (typeof m.resonance === 'number') this.resonance = Math.max(0.1, Math.min(1, m.resonance));
      if (typeof m.depth === 'number') this.depth = Math.max(0, Math.min(1, m.depth));
      if (typeof m.drive === 'number') this.drive = Math.max(0, Math.min(1, m.drive));
    };
  }

  private setLowpass(freq: number, q: number) {
    const w = 2*Math.PI*freq/sampleRate;
    const alpha = Math.sin(w)/(2*q);
    const cw = Math.cos(w);
    const b0 = (1-cw)/2, b1 = 1-cw, b2 = b0;
    const a0 = 1+alpha, a1 = -2*cw, a2 = 1-alpha;
    this.filterCo = [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0];
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0]) return true;

    for (let i = 0; i < output[0].length; i++) {
      // Envelope Follower (Average über Kanäle, Mono-Basis)
      let mono = 0;
      for (let ch = 0; ch < input.length; ch++) mono += Math.abs((input[ch]||input[0])[i]);
      mono /= Math.max(1, input.length);
      const dt = 1 / sampleRate;
      if (mono > this.env) this.env += dt/this.envAttack * (mono - this.env);
      else this.env -= dt/this.envRelease * (this.env - mono);
      if (this.env < 0) this.env = 0;

      // Dynamisches Filter: Cutoff wird vom Envelope moduliert
      const modCutoff = this.baseCutoff + this.depth * this.env * 4000;
      this.setLowpass(modCutoff, this.resonance);

      // Anwenden auf jeden Kanal
      for (let ch = 0; ch < output.length; ch++) {
        const inCh = input[ch] || input[0];
        let s = inCh[i] ?? 0;

        // 1) Tilt: Phasenkorrektur (schneller 1.Ordnung Allpass in Serie)
        let y1 = this.apCoef * s + this.ap1Z;
        this.ap1Z = s - this.apCoef * this.ap1Z;
        s = y1;

        // 2) Dynamisches Lowpass
        const [b0,b1,b2,a1,a2] = this.filterCo;
        const yf = b0*s + this.filterZ[0];
        this.filterZ[0] = b1*s - a1*yf + this.filterZ[1];
        this.filterZ[1] = b2*s - a2*yf;
        s = yf;

        // 3) Optionaler Soft-Clipper (harmonische Sättigung)
        if (this.drive > 0) {
          s = Math.tanh(s * (1 + this.drive * 2)) / Math.tanh(1 + this.drive * 2 * 0.8);
        }

        output[ch][i] = s;
      }
    }
    return true;
  }
}
registerProcessor('dsp-processor', DspProcessor);
