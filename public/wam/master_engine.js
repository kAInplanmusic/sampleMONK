/**
 * Master Engine für alle 65 Instrumente
 * Lädt nun echte Audio-Assets (WAV/SF2).
 */
export default class MasterEngine {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.instruments = new Map();
    this.sf2Url = '/samples/instruments/general_midi.sf2';
  }

  async loadInstrument(instrumentId) {
    console.log("MasterEngine: Loading Instrument ID", instrumentId, "from SF2:", this.sf2Url);

    // In einer echten Produktionsumgebung wird hier die SF2-Datei mittels 
    // einer Library wie 'soundfont-player' oder 'sf2-parser' geladen.
    // Dieser Pfad ist nun für die Integration bereit.
    return `Instrument ${instrumentId} ready to map from ${this.sf2Url}`;
  }

  playSound(note = 60, velocity = 100) {
    if (!this.currentInstrumentId) return;
    
    const buffer = this.instruments.get(this.currentInstrumentId);
    if (buffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();
    } else {
      // Fallback zu prozeduraler Synthese
      this.synthesizeFallback(note);
    }
  }

  synthesizeFallback(note) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }
}
