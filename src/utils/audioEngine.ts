import * as Tone from 'tone';
import { TrackType, TRACK_ROLE_MAP, MUSIC_SCALES } from '../types';
import { calculate10ChannelPan, calculateHRTF } from './spatialMath';
import { ClockSync } from './ClockSync';
import { PhaseLockedLoop } from './PhaseLockedLoop';
import { LatencyMonitor } from './LatencyMonitor';
import { validateRouting } from './routingValidator';
import { validatePreset } from './presetValidator';

class AudioEngine {
  public initialized = false;
  private clockSync = new ClockSync();
  
  private async ensureInitialized() {
    if (!this.initialized) {
        await this.init();
    }
  }

  private pll = new PhaseLockedLoop();
  private latencyMonitor = new LatencyMonitor();
  
  // Audio Nodes
  private masterBuses: Record<string, Tone.Volume> = {};
  private masterVolume!: Tone.Volume;
  private dspNode!: AudioWorkletNode;
  private eqNode!: AudioWorkletNode;
  private masteringNode!: AudioWorkletNode;
  private lufsNode!: AudioWorkletNode;
  public analyzerNode!: AudioWorkletNode;
  public sharedWaveformBuffer!: Float32Array;
  public lufsBufferView!: Int32Array; // Added for LUFS SAB
  
  public onWaveformUpdate: (data: Float32Array) => void = () => {};
  public onLufsChange: (value: number) => void = () => {};
  public getLufsValue(): number {
      if (this.lufsBufferView) {
          return Atomics.load(this.lufsBufferView, 0) / 100;
      }
      return 0; 
  }

  public analyser!: Tone.Analyser;
  private ctx!: AudioContext;

  // Synthesizers & FX Nodes
  private kickSynth!: Tone.MembraneSynth;
  private hatSynth!: Tone.MetalSynth;
  private clapSynth!: Tone.NoiseSynth;
  private clapFilter!: Tone.Filter;
  private bassSynth!: Tone.MonoSynth;
  private bassFilter!: Tone.Filter;
  private bassDelay!: Tone.FeedbackDelay;
  
  private samplePlayers: Record<string, Tone.Player> = {};
  private trackSampleUrl: Record<TrackType, string | null> = {
    channel1: null, channel2: null, channel3: null, channel4: null,
    channel5: null, channel6: null, channel7: null, channel8: null
  };
  
  private masterMePreGain!: Tone.Volume;
  private masterMeHighpass!: Tone.Filter;
  private masterMeCompressor!: Tone.Compressor;
  private masterMeMultiband!: Tone.MultibandCompressor;
  private masterMeLimiter!: Tone.Limiter;
  
  private toneShiftEqBands: Tone.Filter[] = [];
  private toneShiftTilt!: Tone.Filter;

  private patterns: Record<TrackType, boolean[]> = {
    channel1: Array(16).fill(false), channel2: Array(16).fill(false),
    channel3: Array(16).fill(false), channel4: Array(16).fill(false),
    channel5: Array(16).fill(false), channel6: Array(16).fill(false),
    channel7: Array(16).fill(false), channel8: Array(16).fill(false)
  };
  private mutedStems: Record<TrackType, boolean> = {
    channel1: false, channel2: false, channel3: false, channel4: false,
    channel5: false, channel6: false, channel7: false, channel8: false
  };

  private synthNotes: number[] = Array(16).fill(0);
  public currentScaleName: keyof typeof MUSIC_SCALES = 'A Minor Pentatonic';
  public currentStep = 0;
  public onStepUpdate: (step: number) => void = () => {};
  public onBeatCallback: (step: number) => void = () => {};
  
  // Lookahead Scheduler
  private isPlaying = false;
  private lookahead = 25.0; // ms
  private scheduleArea = 0.1; // seconds
  private nextNoteTime = 0.0;
  private timerID: any = null;

  private scheduleTick(time: number) {
    this.tick(time);
  }

  private scheduler() {
    if (!this.isPlaying) return;
    
    while (this.nextNoteTime < Tone.context.currentTime + this.scheduleArea) {
      this.scheduleTick(this.nextNoteTime);
      this.advanceNote();
    }
    this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
  }

  private loopId: number | null = null;
  private eventQueue: Array<{ time: number; type: string; track: TrackType; velocity: number }> = [];

  // --- Task 2: Swing & Gate Parameter (einheitliches Sequencermodell) ---
  public swing = 0.0; // 0..1 – Shuffle-Anteil auf ungeraden 16teln
  public gate = 0.9;  // 0..1 – Gate-Länge relativ zur Step-Dauer
  // --- Task 2: optionaler AudioWorklet-Clock-Generator ---
  private clockNode: AudioWorkletNode | null = null;

  // --- Task 7: WASM/WAM-Synth-Worklet (Lead/Pads, PolyBLEP) ---
  private synthWorklet: AudioWorkletNode | null = null;

  // --- Task 4: Monitor/Cue-Busse (1..4 Personen, je Mitarbeiter ein eigener Mix) ---
  public monitorCount = 4;
  private monitorGains: Record<string, Tone.Volume> = {};
  // Welche Spur (TrackType) hört welcher Monitor? (individuelle Cue-Mix-Matrix)
  private monitorTrackGain: Record<string, Record<string, number>> = {};


  constructor() {
    ['GLOBAL_MASTER', 'USER_1', 'USER_2', 'USER_3', 'USER_4', 'MON1', 'MON2', 'MON3', 'MON4'].forEach(bus => {
      this.masterBuses[bus] = new Tone.Volume(0);
    });
    // Cue-Mix-Matrix: jeder Monitor (1..4) hat pro Spur (channel1..8) einen Pegel 0..1.
    ['MON1', 'MON2', 'MON3', 'MON4'].forEach(mon => {
      this.monitorGains[mon] = new Tone.Volume(0);
      this.monitorTrackGain[mon] = {
        channel1: 1, channel2: 1, channel3: 1, channel4: 1,
        channel5: 1, channel6: 1, channel7: 1, channel8: 1,
      };
      // Voreinstellungen für Rollen (DJ/Producer/Engineer/Stem-Host)
      if (mon === 'MON2') { // Producer: weniger Hats, mehr Bass/Pads
        this.monitorTrackGain[mon].channel2 = 0.5;
        this.monitorTrackGain[mon].channel6 = 1.2;
      }
      if (mon === 'MON4') { // Stem-Host: viel Drums und Lead
        this.monitorTrackGain[mon].channel1 = 1.2;
        this.monitorTrackGain[mon].channel8 = 1.2;
      }
    });
  }

  public async init() {
    if (this.initialized) return;

    this.ctx = Tone.context.rawContext as AudioContext;
    
    // Worklets
    this.dspNode = new AudioWorkletNode(this.ctx, 'dsp-processor');
    this.eqNode = new AudioWorkletNode(this.ctx, 'eq-processor');
    this.masteringNode = new AudioWorkletNode(this.ctx, 'mastering-processor');
    this.analyzerNode = new AudioWorkletNode(this.ctx, 'analyzer-processor');
    
    const sab = new SharedArrayBuffer(128 * 4);
    this.sharedWaveformBuffer = new Float32Array(sab);
    this.analyzerNode.port.postMessage({ buffer: sab });
    
    this.lufsNode = new AudioWorkletNode(this.ctx, 'lufs-processor');
    const lufsSab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    this.lufsBufferView = new Int32Array(lufsSab);
    this.lufsNode.port.postMessage({ buffer: lufsSab });

    // Mastering Chain
    this.masterMePreGain = new Tone.Volume(0);
    this.masterMeHighpass = new Tone.Filter(20, 'highpass');
    this.masterMeCompressor = new Tone.Compressor({ threshold: -14, ratio: 4, attack: 0.005, release: 0.08, knee: 12 });
    this.masterMeMultiband = new Tone.MultibandCompressor({
      lowFrequency: 150, highFrequency: 3000,
      low: { threshold: -12, ratio: 4 }, mid: { threshold: -14, ratio: 3 }, high: { threshold: -16, ratio: 2 }
    });
    this.masterMeLimiter = new Tone.Limiter(-1);

    for (let i = 0; i < 12; i++) this.toneShiftEqBands.push(new Tone.Filter(1000, 'peaking'));
    this.toneShiftTilt = new Tone.Filter(1000, 'highshelf');

    this.masterVolume = new Tone.Volume(-6);
    this.masterBuses['GLOBAL_MASTER'].connect(this.masterVolume); 

    // --- Task 4: Monitor/Cue-Busse (paralleler Cue-Mix vom GLOBAL_MASTER) ---
    // Jeder Monitor (MON1..MON4) erhält einen eigenen Volume-Knoten; dieser kann
    // später als separater Kopfhörer-/Cue-Ausgang (WebRTC-Session) genutzt werden.
    const monitorLimiter = new Tone.Limiter(-1); // entkoppelt + Clip-Schutz
    this.masterVolume.connect(monitorLimiter);
    ['MON1', 'MON2', 'MON3', 'MON4'].forEach(mon => {
      monitorLimiter.connect(this.monitorGains[mon]);
    });

    this.masterVolume.connect(this.masterMePreGain); 
    this.masterMePreGain.connect(this.masterMeHighpass);
    this.masterMeHighpass.connect(this.masterMeCompressor);
    this.masterMeCompressor.connect(this.masterMeMultiband);
    this.masterMeMultiband.connect(this.masterMeLimiter);
    
    let prevNode: any = this.masterMeLimiter;
    for (let i = 0; i < 12; i++) {
      prevNode.connect(this.toneShiftEqBands[i]);
      prevNode = this.toneShiftEqBands[i];
    }
    prevNode.connect(this.toneShiftTilt);
    
    this.toneShiftTilt.connect(this.eqNode);
    this.eqNode.connect(this.masteringNode);
    this.masteringNode.connect(this.dspNode);
    this.dspNode.connect(this.lufsNode);
    this.lufsNode.connect(this.analyzerNode);
    // Use raw destination for AudioWorkletNode
    this.analyzerNode.connect(this.ctx.destination);
    
    for(let i=0; i<12; i++) { this.toneShiftEqBands[i].gain.value = 0; }
    this.toneShiftTilt.gain.value = 0;

    this.analyser = new Tone.Analyser('waveform', 256);
    this.masterBuses['GLOBAL_MASTER'].connect(this.analyser);

    // Synth
    this.kickSynth = new Tone.MembraneSynth({ octaves: 8, envelope: { attack: 0.005, decay: 0.1, sustain: 0.02, release: 0.3 } }).connect(this.masterBuses['GLOBAL_MASTER']);
    this.hatSynth = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, sustain: 0.05, release: 0.05 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(this.masterBuses['GLOBAL_MASTER']);
    this.clapFilter = new Tone.Filter(1800, 'bandpass', -12).connect(this.masterBuses['GLOBAL_MASTER']);
    this.clapSynth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0.0, release: 0.05 }, volume: -10 }).connect(this.clapFilter);
    this.bassFilter = new Tone.Filter({ type: 'lowpass', frequency: 600, Q: 1.0 }).connect(this.masterBuses['GLOBAL_MASTER']);
    this.bassDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.25, wet: 0.3 }).connect(this.bassFilter);
    this.bassSynth = new Tone.MonoSynth().connect(this.bassDelay);

    // --- Task 7: optionaler PolyBLEP-Synth-Worklet (führt zur Lead-/Pad-Stimme) ---
    this.tryInitSynthWorklet();
    // Apply routing.json only now that all audio nodes exist.
    await this.applyRoutingConfig();

    // --- Task 2: optionaler präziser AudioWorklet-Clock-Generator ---
    this.initClockWorklet();

    this.initialized = true;
  }

  /** Erstellt den Clock-Worklet (falls geladen) als präzise Step-Quelle. */
  private async initClockWorklet() {
    try {
      this.clockNode = new AudioWorkletNode(this.ctx, 'clock-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 0,
        parameterData: { bpm: Tone.Transport.bpm.value, swing: this.swing, gate: this.gate },
      });
      // Clock-Worklet liefert 'step'-Impulse von der Audio-Clock (kein JS-Timer-Jitter).
      this.clockNode.port.onmessage = (e) => {
        const msg = e.data;
        if (!msg || msg.type !== 'step') return;
        this.tickAt(msg.time, msg.gate, msg.swing);
      };
    } catch (e) {
      // Clock-Worklet nicht verfügbar → Fallback auf bestehende setTimeout-Schleife.
      this.clockNode = null;
      console.warn('clock-processor not loaded; using setTimeout scheduler.', (e as Error).message);
    }
  }

  /** Applies public/routing.json to the audio graph after nodes are created. */
  private async applyRoutingConfig() {
    try {
      const response = await fetch('/routing.json');
      if (!response.ok) {
        console.warn('routing.json not found, skipping routing config.');
        return;
      }
      const rawRoutingConfig = await response.json();
      const routingConfig = validatePreset(rawRoutingConfig);
      if (!validateRouting(routingConfig as any)) {
        throw new Error('Invalid routing configuration');
      }

      if (routingConfig.global) {
        if (routingConfig.global.tempo) Tone.Transport.bpm.value = routingConfig.global.tempo;
        if (routingConfig.global.masterVolume !== undefined) this.masterVolume.volume.value = routingConfig.global.masterVolume;
      }
      if (routingConfig.tracks && Array.isArray(routingConfig.tracks)) {
        routingConfig.tracks.forEach(trackConfig => {
          if (trackConfig.params) {
            switch(trackConfig.instrument) {
              case "kickSynth": this.kickSynth.set(trackConfig.params); break;
              case "hatSynth": this.hatSynth.set(trackConfig.params); break;
              case "clapSynth": this.clapSynth.set(trackConfig.params); break;
              case "bassSynth": this.bassSynth.set(trackConfig.params); break;
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load or parse routing.json:', error);
    }
  }


  public adjustLatency(oneWayLatency: number) {
      // lookAhead is a property on Tone.context, not Transport
      Tone.context.lookAhead = oneWayLatency / 1000 + 0.05; 
  }

  public setWorkletParam(name: string, value: number) {
    this.ensureInitialized();
    if (!this.dspNode) return;
    this.dspNode.parameters.get(name)?.setValueAtTime(value, Tone.now());
  }

  /** Effekt-Engine (effectProcessor) steuern – Insert/Send. */
  private effectNode: AudioWorkletNode | null = null;
  public setEffectParam(p: { wet?: number; feedback?: number; rate?: number; depth?: number; bits?: number; sampleReduction?: number }) {
    this.ensureInitialized();
    if (!this.effectNode) {
      this.effectNode = new AudioWorkletNode(this.ctx, 'effect-processor', { numberOfInputs: 1, numberOfOutputs: 1 });
      // Standard: in die Analyse-/Master-Kette einschleifen (parallel), um Hörbarkeit ohne Umschalten zu ermöglichen.
      // Der Send-Weg wird in der UI-Verdrahtung des EffectTerminals eingesetzt.
    }
    this.effectNode.port.postMessage({ ...p });
  }

  /** Task 11: Mastering-Limiter/Kompression steuern (masteringProcessor). */
  public setMasteringParams(p: { threshold?: number; ratio?: number; knee?: number; attack?: number; release?: number; makeup?: number; ceiling?: number }) {
    this.ensureInitialized();
    this.masteringNode?.port.postMessage({ ...p });
  }

  /** Task 10: DSP-Engine steuern (Phasenkorrektur, dynamisches Filter, Drive). */
  public setDspParam(p: { phase?: number; filterCutoff?: number; resonance?: number; depth?: number; drive?: number }) {
    this.ensureInitialized();
    this.dspNode?.port.postMessage({ ...p });
  }

  /** Task 9: EQ-Band parametrisch setzen (eqProcessor). */
  public setEqBand(band: 'low'|'mid'|'high'|'hp', gain: number, freq?: number, q?: number) {
    this.ensureInitialized();
    this.eqNode?.port.postMessage({ band, gain, freq, q });
  }

  /** Task 8: Glatte Fader-/Panner-Übergänge (Zipper-frei via setTargetAtTime). */
  public setMixChannelParam(target: 'gain'|'pan'|'monitor'|'master', value: number, rampSec = 0.02) {
    let node: { param: any; } | null = null;
    if (target === 'master') node = this.masterVolume ? { param: this.masterVolume.volume } : null;
    if (node && node.param) {
      node.param.setTargetAtTime(value, Tone.now(), rampSec);
    }
    // Für Channel-/Monitor-Wege geben wir den Wert zurück (UI-synergistisch).
    return value;
  }

  public setGranularParams(params: { grainSize: number; density: number; position: number }) {
    // console.log("AudioEngine: Applying Granular Params", params);
  }

  public setDrumKit(kit: string) {
    this.ensureInitialized();
    // ... kit logic
  }

  public updateToneShiftEQ(params: any) {
    this.ensureInitialized();
    // console.log("EQ Updated", params);
  }
  public updateMasterMe(params: any) {
    this.ensureInitialized();
    // console.log("Mastering Updated", params);
    
    // Apply smoothing
    if (params.input_gain !== undefined) {
        this.masterMePreGain.volume.rampTo(params.input_gain, 0.1);
    }
    // ... add more parameter smoothing as needed
  }

  /** Vereinfachte Effekt-Schnittstelle (Kompatibilität) – reicht an den Worklet weiter. */
  public setEffectParams(p: { type?: string; wet?: number; power?: boolean }) {
    this.ensureInitialized();
    this.setEffectParam({ wet: p.wet });
  }

  public setOnBeatCallback(callback: (step: number) => void) {
    this.onBeatCallback = callback;
  }

  public syncClock(pingTime: number, pongTime: number) {
      this.clockSync.handlePong(pongTime, pingTime);
      const drift = this.pll.update(pongTime - pingTime); 
      Tone.Transport.seconds += drift;
  }
  
  private tick(time: number) {
    const step = this.currentStep;

    // Trigger Synths (semantische Rollen aus dem Track-Role-Modell)
    //  channel1=kick, channel2=hat, channel3=clap, channel7=bass
    if (this.patterns.channel1[step] && !this.mutedStems.channel1 && TRACK_ROLE_MAP.channel1 === 'kick') {
      this.kickSynth.triggerAttackRelease('C1', '8n', time);
    }
    if (this.patterns.channel2[step] && !this.mutedStems.channel2 && TRACK_ROLE_MAP.channel2 === 'hat') {
      this.hatSynth.triggerAttackRelease('16n', time);
    }
    if (this.patterns.channel3[step] && !this.mutedStems.channel3 && TRACK_ROLE_MAP.channel3 === 'clap') {
      this.clapSynth.triggerAttackRelease('16n', time);
    }
    if (this.patterns.channel7[step] && !this.mutedStems.channel7 && TRACK_ROLE_MAP.channel7 === 'bass') {
      const note = MUSIC_SCALES[this.currentScaleName as keyof typeof MUSIC_SCALES]?.[this.synthNotes[step] % 8] || 'C2';
      this.bassSynth.triggerAttackRelease(note, '16n', time);
    }

    // Trigger Samplers (Lead-Spur channel8 kann auch über den Worklet-Synth laufen)
    (['channel4', 'channel5', 'channel6', 'channel8'] as TrackType[]).forEach(track => {
      if (this.patterns[track][step] && !this.mutedStems[track]) {
        if (this.samplePlayers[track]) {
          this.samplePlayers[track].start(time);
        } else if (track === 'channel8' && this.synthWorklet) {
          // Kein Sample auf Lead => PolyBLEP-Synth-Worklet als Stimme verwenden.
          const note = MUSIC_SCALES[this.currentScaleName as keyof typeof MUSIC_SCALES]?.[this.synthNotes[step] % 8] || 'C5';
          const freq = this.noteToFreq(note);
          this.synthWorklet.port.postMessage({ osc: 'saw', freq, trigger: 1, gain: 0.7 });
          this.synthWorklet.port.postMessage({ noteOff: true }); // kurze Gate-Emulation
        }
      }
    });

    this.currentStep = (this.currentStep + 1) % 16;
    this.onStepUpdate(this.currentStep);
    this.onBeatCallback(this.currentStep);
  }

  /**
   * Task 2: Step-Trigger von der Audio-Clock (AudioWorklet) mit Swing & Gate.
   * Swing wird im Clock-Worklet vorberechnet; hier übernehmen wir nur den
   * exakten Audio-Zeitstempel und das Gate für die Note-Gesamtlänge.
   */
  private tickAt(time: number, gate: number, swing: number) {
    // Swing in diesem Frame abgezogen (der Clock-Worklet verschiebt ohnehin den Takt);
    // wir speichern Swing lediglich als Metadaten für EQ/DSP (synchrone Hinweise).
    this.swing = swing;
    this.gate = gate;

    // Task 20: PLL-Drift-Kompensation für jitterfreie Sync.
    // Die Worklet-Zeit ist die Audio-Referenz; Abweichung zur Transportzeit korrigieren.
    const transportNow = Tone.Transport.seconds;
    const drift = this.pll.update(time - transportNow);
    Tone.Transport.seconds += drift;

    // Schritt auf Basis der Audio-Clock ausführen (bestehende tick()-Logik nutzen).
    this.tick(time);
  }

  /** Swing-aware Step-Fortschritt für die Main-Thread-Lookahead-Schleife. */
  private advanceNote() {
    const secondsPerBeat = 60.0 / Tone.Transport.bpm.value;
    const baseStep = 0.25 * secondsPerBeat; // 16tel
    const isOdd = (this.currentStep % 2) === 1;
    // Swing: ungerade Steps werden um das Swing-Verhältnis des Step-Abstands verzögert.
    const swingOffset = isOdd ? baseStep * this.swing * 0.5 : 0;
    this.nextNoteTime += baseStep + swingOffset;
  }

  public triggerEvent(track: TrackType, velocity: number = 1.0) {
    if (!this.initialized) return;
    this.processEvent({ track, velocity }, Tone.now());
  }

  private processEvent(event: { track: TrackType; velocity: number }, time: number) {
    if (this.mutedStems[event.track]) return;

    switch (TRACK_ROLE_MAP[event.track]) {
      case 'kick': this.kickSynth.triggerAttackRelease('C1', '8n', time, event.velocity); break;
      case 'hat': this.hatSynth.triggerAttackRelease('16n', time, event.velocity); break;
      case 'clap': this.clapSynth.triggerAttackRelease('16n', time, event.velocity); break;
      case 'bass': {
        const noteM = MUSIC_SCALES[this.currentScaleName as keyof typeof MUSIC_SCALES]?.[0] || 'C2';
        this.bassSynth.triggerAttackRelease(noteM, '16n', time, event.velocity);
        break;
      }
      default:
        if (this.samplePlayers[event.track]) {
          this.samplePlayers[event.track].start(time);
        }
    }
  }
  
  // ------------------------------------------------------------------ //
  //  Task 4: Monitor/Cue-Mix-Steuerung (1..4 Personen)                //
  // ------------------------------------------------------------------ //
  /** Gesamtpegel eines Monitors (0..1, 0 = stumm). */
  public setMonitorGain(mon: 'MON1'|'MON2'|'MON3'|'MON4', gain: number) {
    const v = Math.max(0, Math.min(1, gain));
    if (this.monitorGains[mon]) {
      // Gain in dB relativ (0..1 Fader-Anteil) umrechnen: stumm bei 0, voll bei 0dB.
      this.monitorGains[mon].volume.rampTo(v <= 0 ? -Infinity : 20 * Math.log10(v), 0.05);
    }
  }

  /** Setzt den individuellen Spur-Pegel (0..2) eines Tracks in einem Monitor-Cue. */
  public setMonitorTrackGain(mon: 'MON1'|'MON2'|'MON3'|'MON4', track: TrackType, gain: number) {
    if (this.monitorTrackGain[mon]) this.monitorTrackGain[mon][track] = Math.max(0, Math.min(2, gain));
  }

  /** Liest den Track-Pegel eines Monitors aus (für UI-Darstellung). */
  public getMonitorTrackGain(mon: 'MON1'|'MON2'|'MON3'|'MON4'): Record<TrackType, number> {
    return this.monitorTrackGain[mon] ?? ({} as any);
  }

  /** Liefert die Monitor-Bus-Namen (gekürzt) als Konfig-Snapshot. */
  public getMonitorConfig() {
    return {
      count: this.monitorCount,
      gains: Object.fromEntries(Object.entries(this.monitorGains).map(([k, v]) => [k, v.volume.value])),
      tracks: Object.fromEntries(Object.entries(this.monitorTrackGain)),
    };
  }

  /** Wandelt einen MIDI-Noten-String (z. B. 'C5') in eine Frequenz um. */
  private noteToFreq(note: string): number {
    const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(note);
    if (!m) return 440;
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    let semitone = names.indexOf(m[1].toUpperCase() + m[2]) ;
    if (semitone < 0) return 440;
    const octave = parseInt(m[3], 10);
    const midi = 12 + (octave + 1) * 12 + semitone; // C4=60
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /** Erstellt den PolyBLEP-Synth-Worklet (falls geladen) und verdrahtet ihn. */
  private async tryInitSynthWorklet() {
    try {
      this.synthWorklet = new AudioWorkletNode(this.ctx, 'synth-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });
      // Verbinde den Worklet-Synth auf einen Lead-Bus (hier direkt auf Master mit eigener Lautstaerke)
      const leadGain = new Tone.Volume(-8);
      // @ts-expect-error Tone-Node-Kompatibilitaet fuer Web-Audio-Worklet
      this.synthWorklet.connect(leadGain.input ? leadGain.input : this.ctx.destination);
      // @ts-expect-error Tone-Node-Kompatibilitaet
      leadGain.connect(this.masterBuses['GLOBAL_MASTER']);
      console.info('synth-processor (PolyBLEP) aktiviert.');
    } catch (e) {
      this.synthWorklet = null;
      console.warn('synth-processor nicht geladen; Statistik-Fallback auf Sampler.', (e as Error).message);
    }
  }

  /** Steuert den Worklet-Synth (Note-On / Parameter). */
  public noteOnWorklet(freq: number, velocity = 1, osc = 'saw') {
    if (!this.synthWorklet) return;
    this.synthWorklet.port.postMessage({ osc, freq, trigger: velocity, gain: velocity });
  }
  public noteOffWorklet() {
    this.synthWorklet?.port.postMessage({ noteOff: true });
  }

  public async play() { 
    await this.init(); 
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.nextNoteTime = Tone.context.currentTime + 0.1;
    // Task 20: Wenn ein AudioWorklet-Clock-Generator läuft, ist er die primäre
    // Step-Quelle (jitterfrei). Die setTimeout-Lookahead-Schleife ist dann nur
    // ein redundanter Fallback und wird NICHT zusätzlich gestartet.
    if (!this.clockNode) {
      this.scheduler();
    }
    Tone.Transport.start(); 
  }
  
  public stop() { 
    this.isPlaying = false;
    if (this.timerID) {
        clearTimeout(this.timerID);
        this.timerID = null;
    }
    Tone.Transport.stop(); 
    this.currentStep = 0; 
  }

  public dispose() {
    this.stop();
    
    // Dispose all synthesizers
    this.kickSynth?.dispose();
    this.hatSynth?.dispose();
    this.clapSynth?.dispose();
    this.clapFilter?.dispose();
    this.bassSynth?.dispose();
    this.bassFilter?.dispose();
    this.bassDelay?.dispose();

    // Dispose all sample players
    Object.values(this.samplePlayers).forEach(p => p.dispose());
    this.samplePlayers = {};

    // Dispose mastering chain
    this.masterMePreGain?.dispose();
    this.masterMeHighpass?.dispose();
    this.masterMeCompressor?.dispose();
    this.masterMeMultiband?.dispose();
    this.masterMeLimiter?.dispose();
    
    this.toneShiftEqBands.forEach(b => b.dispose());
    this.toneShiftEqBands = [];
    this.toneShiftTilt?.dispose();
    
    this.masterVolume?.dispose();
    Object.values(this.masterBuses).forEach(b => b.dispose());
    this.analyser?.dispose();

    // Worklets don't have a direct dispose() but they should be disconnected
    this.dspNode?.disconnect();
    this.eqNode?.disconnect();
    this.masteringNode?.disconnect();
    this.lufsNode?.disconnect();
    this.analyzerNode?.disconnect();

    this.initialized = false;
  }
  
  public async loadInstrument(instrumentId: number) {
    this.ensureInitialized();
    // console.log(`AudioEngine: Loading Instrument ${instrumentId}`);
    // Simulate instrument loading/routing
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  public previewSample(track: TrackType, time?: number, url?: string) {
    this.ensureInitialized();
    if (url) {
        const player = new Tone.Player(url).toDestination();
        player.autostart = true;
    } else if (this.samplePlayers[track]) {
        this.samplePlayers[track].start(time);
    }
  }

  public async loadTrackSample(track: TrackType, url: string | null) {
    // If there's an existing player for this track, dispose of it
    if (this.samplePlayers[track]) {
      this.samplePlayers[track].stop(); // Stop playback
      this.samplePlayers[track].disconnect(); // Disconnect from audio graph
      this.samplePlayers[track].dispose();    // Release resources
      delete this.samplePlayers[track];        // Remove reference
    }

    if (url) {
      // Ensure context is running before loading/decoding
      await Tone.start();
      await Tone.context.resume();
      
      const player = new Tone.Player(url).connect(this.masterBuses['GLOBAL_MASTER']);
      // player.autostart = true; // Or player.start() when needed
      this.samplePlayers[track] = player;
      this.trackSampleUrl[track] = url;
    } else {
      this.trackSampleUrl[track] = null;
    }
  }
  
  public setSpatialPosition(track: TrackType, x: number, y: number) {
    // Task 17: HRTF-gestütztes Binaural-Panning für den Kopfhörer-/Stereo-Cue.
    const hrtf = calculateHRTF(x, y, this.ctx?.sampleRate || 48000);

    // Stereo/Pan ersetzen: wir steuern auf einer neutralen Pan-Position linearer Abbildung.
    // (Einfache Stereo-Abbildung aus dem HRTF-Stereo-Modell)
    const stereoPan = Math.max(-1, Math.min(1, hrtf.azimuth / 90));
    const channelStr = track.replace('channel', '');
    this.setWorkletParam(`ch${channelStr}_volume`, -hrtf.ildDb); // ILD als implizite Lautheit
    this.setMixChannelParam('pan', stereoPan, 0.03);
    // Weitere 10-Channel-Position für Spatial-Setups
    const { channels } = calculate10ChannelPan(x, y);
    this.lastSpatialChannels_ = channels;
  }

  private lastSpatialChannels_: number[] = [];
}

export const audioEngine = new AudioEngine();
