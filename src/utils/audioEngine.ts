import * as Tone from 'tone';
import { TrackType, MUSIC_SCALES } from '../types';
import { calculate10ChannelPan } from './spatialMath';
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
  public currentStep = 0;
  public onStepUpdate: (step: number) => void = () => {};
  
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

  private advanceNote() {
    const secondsPerBeat = 60.0 / Tone.Transport.bpm.value;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th note
  }

  private loopId: number | null = null;
  private eventQueue: Array<{ time: number; type: string; track: TrackType; velocity: number }> = [];

  constructor() {
    ['GLOBAL_MASTER', 'USER_1', 'USER_2', 'USER_3', 'USER_4'].forEach(bus => {
      this.masterBuses[bus] = new Tone.Volume(0);
    });
  }

  public async init() {
    if (this.initialized) return;

    // Load routing.json
    try {
      const response = await fetch('/routing.json');
      const rawRoutingConfig = await response.json();
      
      const routingConfig = validatePreset(rawRoutingConfig);

      if (!validateRouting(routingConfig as any)) {
        throw new Error("Invalid routing configuration");
      }
      
      // console.log('Loaded routing config:', routingConfig);
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

    this.initialized = true;
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

  public syncClock(pingTime: number, pongTime: number) {
      this.clockSync.handlePong(pongTime, pingTime);
      const drift = this.pll.update(pongTime - pingTime); 
      Tone.Transport.seconds += drift;
  }
  
  private tick(time: number) {
    this.currentStep = (this.currentStep + 1) % 16;
    this.onStepUpdate(this.currentStep);
  }
  
  public triggerEvent(track: TrackType, velocity: number = 1.0) {
      // ...
  }
  
  public async play() { 
    await this.init(); 
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.nextNoteTime = Tone.context.currentTime + 0.1;
    this.scheduler();
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
    // ...
  }
}

export const audioEngine = new AudioEngine();
