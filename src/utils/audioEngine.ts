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
  public sharedWaveformBuffer!: Float32Array;
  public lufsBufferView!: Float32Array; // Added for LUFS SAB
  
  public onWaveformUpdate: (data: Float32Array) => void = () => {};
  public getLufsValue(): number {
      // Ensure lufsBufferView is initialized before reading
      if (this.lufsBufferView) {
          return Atomics.load(this.lufsBufferView, 0);
      }
      return 0; // Default or error value if not initialized
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
  private currentStep = 0;
  private loopId: number | null = null;
  private eventQueue: Array<{ time: number; type: string; track: TrackType; velocity: number }> = [];

  constructor() {
    this.masterBus = new Tone.Volume(0);
  }

  public async init() {
    if (this.initialized) return;

    // Load routing.json
    try {
      const response = await fetch('/routing.json'); // Fetch from public directory
      const routingConfig = await response.json();
      console.log('Loaded routing config:', routingConfig);

      // Apply global settings
      if (routingConfig.global) {
        if (routingConfig.global.tempo) {
          Tone.Transport.bpm.value = routingConfig.global.tempo;
        }
        // Assuming masterVolume refers to this.masterVolume.volume.value
        if (routingConfig.global.masterVolume !== undefined) {
          this.masterVolume.volume.value = routingConfig.global.masterVolume;
        }
      }
      
      // Apply track settings from routing.json to existing synths
      if (routingConfig.tracks && Array.isArray(routingConfig.tracks)) {
        routingConfig.tracks.forEach(trackConfig => {
          if (trackConfig.params) { // Only apply if params exist
            switch(trackConfig.instrument) {
              case "kickSynth":
                this.kickSynth.set(trackConfig.params);
                break;
              case "hatSynth":
                this.hatSynth.set(trackConfig.params); 
                break;
              case "clapSynth":
                this.clapSynth.set(trackConfig.params); 
                break;
              case "bassSynth":
                this.bassSynth.set(trackConfig.params);
                break;
              // Add more cases for other instruments
            }
          }
        });
      }

      // TODO: Apply effects and connections from routingConfig.buses and routingConfig.connections
      // This would require significant refactoring to dynamically create and manage nodes.
      // For now, we apply global and track-level settings to existing hardcoded elements.

    } catch (error) {
      console.error('Failed to load or parse routing.json:', error);
      // Fallback to default hardcoded settings
    }


    // Tone.start() and Worklets are now loaded centrally by AudioProvider
    // We only need to ensure Tone is ready and context is available before proceeding
    // Since AudioProvider ensures Tone.start() is called, we can directly access Tone.context.rawContext
    this.ctx = Tone.context.rawContext;
    
    // --- WORKLET NODE INSTANTIATION ---
    // Worklets are now loaded centrally by AudioProvider
    this.dspNode = new AudioWorkletNode(Tone.context.rawContext, 'dsp-processor');
    this.analyzerNode = new AudioWorkletNode(Tone.context.rawContext, 'analyzer-processor');
    
    // Initialize SharedArrayBuffer for visualization
    const sab = new SharedArrayBuffer(128 * 4);
    this.sharedWaveformBuffer = new Float32Array(sab);
    this.analyzerNode.port.postMessage({ buffer: sab });
    
    this.lufsNode = new AudioWorkletNode(Tone.context.rawContext, 'lufs-processor');
    const lufsSab = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT); // Single float for LUFS
    this.lufsBufferView = new Float32Array(lufsSab); // Create a view for reading
    this.lufsNode.port.postMessage({ buffer: lufsSab }); // Pass SAB to lufs Worklet

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

    this.masterVolume = new Tone.Volume(-6); // This is now part of the chain after masterBus

    // Connect masterBus to masterVolume, then masterVolume to the mastering chain
    this.masterBus.connect(this.masterVolume); 
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
    this.masterBus.connect(this.analyser); // Connect analyser to masterBus

    // Synth setup ... (abbreviated)
    this.kickSynth = new Tone.MembraneSynth().connect(this.masterBus); // Connect to masterBus
    this.hatSynth = new Tone.MetalSynth().connect(this.masterBus); // Connect to masterBus
    this.clapFilter = new Tone.Filter(1800, 'bandpass').connect(this.masterBus); // Connect to masterBus
    this.clapSynth = new Tone.NoiseSynth().connect(this.clapFilter);
    this.bassFilter = new Tone.Filter({ type: 'lowpass', frequency: 600 }).connect(this.masterBus); // Connect to masterBus
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
    // If there's an existing player for this track, dispose of it
    if (this.samplePlayers[track]) {
      this.samplePlayers[track].stop(); // Stop playback
      this.samplePlayers[track].disconnect(); // Disconnect from audio graph
      this.samplePlayers[track].dispose();    // Release resources
      delete this.samplePlayers[track];        // Remove reference
    }

    if (url) {
      const player = new Tone.Player(url).connect(this.masterBus);
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
