/**
 * effectProcessor – Effekt-Engine (AudioWorklet)
 * ------------------------------------------------
 * Enthält:
 *  - Feedback-Delay-Netz (diffuser Reverb, IR-ähnlich ohne Convolver-Last).
 *  - Chorus / Flanger (modulierte Delay-Linien).
 *  - Bitcrusher (Sample-Rate + Bit-Tiefe Reduktion).
 *
 * Steuerung über Port-Nachrichten (Insert/Send):
 *   { wet, feedback, time, rate, depth, bits, sampleReduction, reset }
 */
class EffectProcessor extends AudioWorkletProcessor {
  private comb1 = new Float32Array(1200);
  private comb2 = new Float32Array(1513);
  private comb1Pos = 0;
  private comb2Pos = 0;
  private all1 = new Float32Array(583);
  private all2 = new Float32Array(311);
  private all1Pos = 0;
  private all2Pos = 0;
  private combFeedback = 0.6;
  private wet = 0.3;

  private chorusDelay = new Float32Array(4000);
  private chorusPos = 0;
  private chorusRate = 0.5;
  private chorusDepth = 0.5;

  private crushBits = 8;
  private crushHold = 0;
  private crushReduction = 1;   // Sample-Rate-Reduktion (Hold-Samples)
  private crushCounter = 0;     // Zähler für Hold

  constructor() {
    super();
    this.port.onmessage = (e) => {
      const m = e.data; if (!m) return;
      if (m.reset) { this.comb1Pos=0; this.comb2Pos=0; this.all1Pos=0; this.all2Pos=0; this.chorusPos=0; }
      if (typeof m.wet === 'number') this.wet = Math.max(0, Math.min(1, m.wet));
      if (typeof m.feedback === 'number') this.combFeedback = Math.max(0, Math.min(0.9, m.feedback));
      if (typeof m.rate === 'number') this.chorusRate = m.rate;
      if (typeof m.depth === 'number') this.chorusDepth = Math.max(0, Math.min(1, m.depth));
      if (typeof m.bits === 'number') this.crushBits = Math.max(2, Math.min(16, m.bits));
      if (typeof m.sampleReduction === 'number') this.crushReduction = Math.max(1, Math.min(64, m.sampleReduction)); this.crushCounter = 0;
    };
  }

  private reverb(x: number): number {
    const c1out = this.comb1[this.comb1Pos];
    this.comb1[this.comb1Pos] = x + c1out * this.combFeedback;
    this.comb1Pos = (this.comb1Pos + 1) % this.comb1.length;
    const c2out = this.comb2[this.comb2Pos];
    this.comb2[this.comb2Pos] = x + c2out * this.combFeedback;
    this.comb2Pos = (this.comb2Pos + 1) % this.comb2.length;
    const diff = c1out + c2out;
    const a1read = this.all1[this.all1Pos];
    this.all1[this.all1Pos] = diff + a1read * 0.5;
    this.all1Pos = (this.all1Pos + 1) % this.all1.length;
    const a2read = this.all2[this.all2Pos];
    this.all2[this.all2Pos] = diff + a2read * 0.5;
    this.all2Pos = (this.all2Pos + 1) % this.all2.length;
    return (a1read + a2read) * 0.5;
  }

  private chorus(x: number, sr: number): number {
    const lfo = Math.sin(2 * Math.PI * this.chorusRate * ((currentFrame % sr) / sr));
    const delaySamples = 1 + this.chorusDepth * 1500 * (0.5 + 0.5 * lfo);
    this.chorusDelay[this.chorusPos] = x;
    const readPos = (this.chorusPos - Math.round(delaySamples) + this.chorusDelay.length) % this.chorusDelay.length;
    const delayed = this.chorusDelay[readPos];
    this.chorusPos = (this.chorusPos + 1) % this.chorusDelay.length;
    return delayed;
  }

  private crush(x: number): number {
    if (--this.crushCounter <= 0) {
      this.crushCounter = this.crushReduction;
      this.crushHold = x;
    }
    const levels = Math.pow(2, Math.round(this.crushBits));
    return Math.round(this.crushHold * levels) / levels;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0]) return true;
    const sr = sampleRate;
    const wetAmt = this.wet;
    for (let i = 0; i < output[0].length; i++) {
      for (let ch = 0; ch < output.length; ch++) {
        const x = (input[ch] || input[0])[i] ?? 0;
        const rvb = this.reverb(x);
        const chrs = this.chorus(x, sr);
        const crs = this.crush(x);
        const eff = rvb * 0.6 + chrs * 0.2 + crs * 0.2;
        output[ch][i] = x * (1 - wetAmt) + eff * wetAmt;
      }
    }
    return true;
  }
}
registerProcessor('effect-processor', EffectProcessor);
