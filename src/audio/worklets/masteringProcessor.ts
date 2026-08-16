/**
 * masteringProcessor – Mastering-Kette (AudioWorklet)
 * ----------------------------------------------------
 *  - Lookahead Brickwall-Limiter (5ms Delay) zur Peak-Erkennung.
 *  - Soft-Knee-Kompression + konfigurierbarer Threshold/Ratio/Attack/Release.
 *  - Steuerung über Port-Nachrichten.
 */
class MasteringProcessor extends AudioWorkletProcessor {
  private threshold = -14;  // dBFS (Kompressor-Grenze)
  private ratio = 3;
  private knee = 6;
  private attack = 0.005;
  private release = 0.08;
  private makeup = 1.0;

  private limiterCeiling = 0.98;
  private limiterAttack = 0.001;
  private limiterRelease = 0.05;
  private peak = 0;

  // Lookahead-Delay
  private lookaheadSamples = Math.round(0.005 * sampleRate); // 5ms
  private delayLine: Float32Array[] = [];
  private delayPos = 0;

  constructor() {
    super();
    // Delay-Line pro Kanal initialisieren
    this.port.onmessage = (e) => {
      const m = e.data; if (!m) return;
      if (m.reset) { this.peak = 0; this.delayPos = 0; this.delayLine = []; }
      if (typeof m.threshold === 'number') this.threshold = m.threshold;
      if (typeof m.ratio === 'number') this.ratio = Math.min(20, Math.max(1, m.ratio));
      if (typeof m.knee === 'number') this.knee = m.knee;
      if (typeof m.attack === 'number') this.attack = m.attack;
      if (typeof m.release === 'number') this.release = m.release;
      if (typeof m.makeup === 'number') this.makeup = m.makeup;
      if (typeof m.ceiling === 'number') this.limiterCeiling = m.limiterCeiling;
    };
  }

  // Soft-Knee-Kompression (Gain-Reduction in dB)
  private compress(gainReductionDb: number): number {
    if (gainReductionDb <= this.threshold - this.knee / 2) return 0;
    if (gainReductionDb >= this.threshold + this.knee / 2) {
      return (gainReductionDb - this.threshold) / this.ratio;
    }
    // Knee-Übergang (quadratisch)
    const overKnee = gainReductionDb - this.threshold + this.knee / 2;
    return (overKnee * overKnee) / (2 * this.knee * this.ratio);
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0]) return true;

    // Delay-Line für Kanäle vorbereiten
    const channels = Math.max(output.length, input.length);
    while (this.delayLine.length < channels) {
      this.delayLine.push(new Float32Array(this.lookaheadSamples));
    }

    for (let i = 0; i < output[0].length; i++) {
      // 1) Lesen aus Lookahead-Delay + Schreiben neuer Samples
      let peakSignal = 0;
      const delayed: number[] = [];
      for (let ch = 0; ch < channels; ch++) {
        const inChSample = (input[ch] || input[0])[i] || 0;
        const writeIdx = this.delayPos;
        const depth = this.delayLine[ch].length;
        // auslesen (an gleicher Position da linearer Lookahead mit Delay-Ring)
        const readIdx = (writeIdx) % depth;
        const delayedSample = this.delayLine[ch][readIdx];
        this.delayLine[ch][writeIdx] = inChSample;
        delayed.push(delayedSample);
        peakSignal = Math.max(peakSignal, Math.abs(delayedSample));
      }
      this.delayPos = (this.delayPos + 1) % this.lookaheadSamples;

      // 2) Kompression (Soft-Knee) auf das verzögerte Signal
      const dbPeak = 20 * Math.log10(Math.max(peakSignal, 1e-8));
      const grDb = this.compress(dbPeak);
      const gr = Math.pow(10, -grDb / 20); // < 1 für Kompression

      // 3) Lookahead-Limiter (Peak-Begrenzung)
      if (peakSignal > this.limiterCeiling) {
        if (peakSignal > this.peak) this.peak = peakSignal;
        // Gain-Reduction: Zielpegel = ceiling
        this.peak = Math.max(this.peak, peakSignal);
      } else {
        this.peak = Math.max(this.limiterCeiling, this.peak - this.limiterRelease);
      }
      let limiterGain = this.limiterCeiling / Math.max(this.peak, 1e-8);
      if (limiterGain > 1) limiterGain = 1;

      // 4) Schreibe Ausgang
      for (let ch = 0; ch < output.length; ch++) {
        const src = delayed[ch] ?? delayed[0] ?? 0;
        let out = src * gr * limiterGain * this.makeup;
        output[ch][i] = out;
      }
    }
    return true;
  }
}
registerProcessor('mastering-processor', MasteringProcessor);
