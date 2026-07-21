import * as Tone from 'tone';
import { TrackType, MUSIC_SCALES } from '../types';
import { calculate10ChannelPan } from './spatialMath';
import { ClockSync } from './ClockSync';
import { PhaseLockedLoop } from './PhaseLockedLoop';
import { LatencyMonitor } from './LatencyMonitor';

class AudioEngine {
  public initialized = false;
  private clockSync = new ClockSync();
  private pll = new PhaseLockedLoop();
  private latencyMonitor = new LatencyMonitor();
  
  // Audio Nodes
  private masterBus!: Tone.Volume; 
  private masterVolume!: Tone.Volume;
  private dspNode!: AudioWorkletNode;
  private lufsNode!: AudioWorkletNode;
  public analyzerNode!: AudioWorkletNode;
  
  public onWaveformUpdate: (data: Float32Array) => void = () => {};
  public onLufsUpdate: (lufs: number) => void = () => {};
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
  private currentStep = 0;
  private loopId: number | null = null;
  private eventQueue: Array<{ time: number; type: string; track: TrackType; velocity: number }> = [];

  constructor() {
    this.masterBus = new Tone.Volume(0);
  }

  public async init() {
    if (this.initialized) return;

    await Tone.start();
    this.ctx = Tone.context.rawContext;
    
    // --- WORKLET SETUP ---
    await Tone.context.audioWorklet.addModule('/src/audio/worklets/dspProcessor.js');
    this.dspNode = new AudioWorkletNode(Tone.context.rawContext, 'dsp-processor');
    
    await Tone.context.audioWorklet.addModule('/src/audio/worklets/analyzerProcessor.js');
    this.analyzerNode = new AudioWorkletNode(Tone.context.rawContext, 'analyzer-processor');
    this.analyzerNode.port.onmessage = (e) => this.onWaveformUpdate(e.data.waveform);
    
    await Tone.context.audioWorklet.addModule('/src/audio/worklets/lufsProcessor.js');
    this.lufsNode = new AudioWorkletNode(Tone.context.rawContext, 'lufs-processor');
    this.lufsNode.port.onmessage = (e) => this.onLufsUpdate(e.data.lufs);

    // Mastering Chain
    this.masterMePreGain = new Tone.Volume(0);
    this.masterMeHighpass = new Tone.Filter(20, 'highpass');
    this.masterMeCompressor = new Tone.Compressor({ threshold: -14, ratio: 4, attack: 0.005, release: 0.08, knee: 12 });
    this.masterMeMultiband = new Tone.MultibandCompressor({
      lowFrequency: 150, highFrequency: 3000,
      low: { threshold: -12, ratio: 4 }, mid: { threshold: -14, ratio: 3 }, high: { threshold: -16, ratio: 2 }
    });
    this.masterMeLimiter = new Tone.Limiter(-1);

    for (let i = 0; i < 12; i++) {
      this.toneShiftEqBands.push(new Tone.Filter(1000, 'peaking'));
    }
    this.toneShiftTilt = new Tone.Filter(1000, 'highshelf');

    this.masterVolume = new Tone.Volume(-6);
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
    
    // Connect Worklets & Chain
    this.toneShiftTilt.connect(this.dspNode);
    this.dspNode.connect(this.lufsNode);
    this.lufsNode.connect(this.analyzerNode);
    this.analyzerNode.toDestination();
    
    for(let i=0; i<12; i++) { this.toneShiftEqBands[i].gain.value = 0; }
    this.toneShiftTilt.gain.value = 0;

    this.analyser = new Tone.Analyser('waveform', 256);
    this.masterVolume.connect(this.analyser);

    // Synth setup ... (abbreviated)
    this.kickSynth = new Tone.MembraneSynth().connect(this.masterVolume);
    this.hatSynth = new Tone.MetalSynth().connect(this.masterVolume);
    this.clapFilter = new Tone.Filter(1800, 'bandpass').connect(this.masterVolume);
    this.clapSynth = new Tone.NoiseSynth().connect(this.clapFilter);
    this.bassFilter = new Tone.Filter({ type: 'lowpass', frequency: 600 }).connect(this.masterVolume);
    this.bassDelay = new Tone.FeedbackDelay({ delayTime: '8n.', feedback: 0.25, wet: 0.3 }).connect(this.bassFilter);
    this.bassSynth = new Tone.MonoSynth().connect(this.bassDelay);

    this.loopId = Tone.Transport.scheduleRepeat((time) => this.tick(time), '16n');

    this.initialized = true;
  }

  public adjustLatency(oneWayLatency: number) {
      Tone.Transport.lookAhead = oneWayLatency / 1000 + 0.05; 
  }

  public setWorkletParam(name: string, value: number) {
    if (!this.dspNode) return;
    this.dspNode.parameters.get(name)?.setValueAtTime(value, Tone.now());
  }

  public setGranularParams(params: { grainSize: number; density: number; position: number }) {
    console.log("AudioEngine: Applying Granular Params", params);
  }

  public setDrumKit(kit: string) {
    // ... kit logic
  }

  public updateToneShiftEQ(params: any) {
    console.log("EQ Updated", params);
  }
  public updateMasterMe(params: any) {
    console.log("Mastering Updated", params);
  }

  public syncClock(pingTime: number, pongTime: number) {
      this.clockSync.handlePong(pongTime, pingTime);
      const drift = this.pll.update(pongTime - pingTime); 
      Tone.Transport.seconds += drift;
  }
  
  private tick(time: number) {
    // ...
    this.currentStep = (this.currentStep + 1) % 16;
  }
  
  public triggerEvent(track: TrackType, velocity: number = 1.0) {
      // ...
  }
  
  public async play() { await this.init(); Tone.Transport.start(); }
  public stop() { Tone.Transport.stop(); this.currentStep = 0; }
  
  public loadTrackSample(track: TrackType, url: string | null) {
      // ...
  }
  
  public setSpatialPosition(track: TrackType, x: number, y: number) {
    // ...
  }
}

export const audioEngine = new AudioEngine();
