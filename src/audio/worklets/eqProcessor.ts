/**
 * eqProcessor – 4-Band parametrischer Equalizer (AudioWorklet)
 * ------------------------------------------------------------
 * Bands: Highpass  ·  Lowshelf  ·  Peaking (Mittel)  ·  Highshelf
 * Steuerung über Port-Nachrichten:
 *   { band: 'low'|'mid'|'high'|'hp', gain, freq, q }
 * Basiert auf Biquad-Filterkoeffizienten (RBJ Audio EQ Cookbook).
 */
class EqProcessor extends AudioWorkletProcessor {
  // Jedes Band: [b0,b1,b2,a1,a2] und Zustände [z1,z2]
  private hp = { co: [1,0,0,0,0], z: [0,0] };
  private low = { co: [1,0,0,0,0], z: [0,0] };
  private mid = { co: [1,0,0,0,0], z: [0,0] };
  private high = { co: [1,0,0,0,0], z: [0,0] };

  constructor() {
    super();
    this.port.onmessage = (e) => {
      const m = e.data; if (!m) return;
      if (m.reset) { this.hp.z=[0,0]; this.low.z=[0,0]; this.mid.z=[0,0]; this.high.z=[0,0]; }
      if (m.band === 'low' && m.gain !== undefined) this.setLowshelf(this.low, m.gain, m.freq ?? 200, m.q ?? 0.7);
      else if (m.band === 'mid' && m.gain !== undefined) this.setPeaking(this.mid, m.gain, m.freq ?? 1000, m.q ?? 1.0);
      else if (m.band === 'high' && m.gain !== undefined) this.setHighshelf(this.high, m.gain, m.freq ?? 6000, m.q ?? 0.7);
      else if (m.band === 'hp') this.setHighpass(this.hp, m.freq ?? 20, m.q ?? 0.707);
    };
  }

  // --- Biquad-Setups (RBJ Cookbook) ---
  private setHighpass(f: any, freq: number, q: number) {
    const w = 2 * Math.PI * freq / sampleRate;
    const a = Math.sin(w)/(2*q);
    const cw = Math.cos(w);
    const b0 = (1+cw)/2, b1 = -(1+cw), b2 = b0;
    const a0 = 1+a, a1 = -2*cw, a2 = 1-a;
    f.co = [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0];
  }
  private setLowshelf(f: any, gain: number, freq: number, q: number) {
    const w = 2*Math.PI*freq/sampleRate; const a = Math.pow(10, gain/40);
    const cw = Math.cos(w), sn = Math.sin(w);
    const alpha = sn/2 * Math.sqrt((a + 1/a)*(1/q - 1) + 2);
    const twoSA = 2*Math.sqrt(a)*alpha;
    const b0 = a*((a+1) - (a-1)*cw + twoSA);
    const b1 = 2*a*((a-1) - (a+1)*cw);
    const b2 = a*((a+1) - (a-1)*cw - twoSA);
    const a0 = (a+1) + (a-1)*cw + twoSA;
    const a1 = -2*((a-1) + (a+1)*cw);
    const a2 = (a+1) + (a-1)*cw - twoSA;
    f.co = [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0];
  }
  private setHighshelf(f: any, gain: number, freq: number, q: number) {
    const w = 2*Math.PI*freq/sampleRate; const a = Math.pow(10, gain/40);
    const cw = Math.cos(w), sn = Math.sin(w);
    const alpha = sn/2 * Math.sqrt((a + 1/a)*(1/q - 1) + 2);
    const twoSA = 2*Math.sqrt(a)*alpha;
    const b0 = a*((a+1) + (a-1)*cw + twoSA);
    const b1 = -2*a*((a-1) + (a+1)*cw);
    const b2 = a*((a+1) + (a-1)*cw - twoSA);
    const a0 = (a+1) - (a-1)*cw + twoSA;
    const a1 = 2*((a-1) - (a+1)*cw);
    const a2 = (a+1) - (a-1)*cw - twoSA;
    f.co = [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0];
  }
  private setPeaking(f: any, gain: number, freq: number, q: number) {
    const w = 2*Math.PI*freq/sampleRate; const a = Math.pow(10, gain/40);
    const cw = Math.cos(w), sn = Math.sin(w);
    const alpha = sn/(2*q);
    const b0 = 1 + alpha*a, b1 = -2*cw, b2 = 1 - alpha*a;
    const a0 = 1 + alpha/a, a1 = -2*cw, a2 = 1 - alpha/a;
    f.co = [b0/a0, b1/a0, b2/a0, a1/a0, a2/a0];
  }

  // Biquad übertragen (DF2T)
  private biquad(f: any, x: number): number {
    const [b0,b1,b2,a1,a2] = f.co;
    const y = b0*x + f.z[0];
    f.z[0] = b1*x - a1*y + f.z[1];
    f.z[1] = b2*x - a2*y;
    return y;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0]) return true;
    for (let ch = 0; ch < output.length; ch++) {
      const inCh = input[ch] || input[0];
      const outCh = output[ch];
      for (let i = 0; i < outCh.length; i++) {
        let s = inCh[i] ?? 0;
        s = this.biquad(this.hp, s);
        s = this.biquad(this.low, s);
        s = this.biquad(this.mid, s);
        s = this.biquad(this.high, s);
        outCh[i] = s;
      }
    }
    return true;
  }
}
registerProcessor('eq-processor', EqProcessor);
