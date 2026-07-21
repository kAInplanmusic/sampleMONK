import * as Tone from 'tone';
import { TrackType, MUSIC_SCALES } from '../types';
import { calculate10ChannelPan } from './spatialMath';

class AudioEngine {
  public initialized = false;
  private ctx!: AudioContext;
  private masterBus!: Tone.Volume; // Explicitly defined masterBus
  
  // Synthesizers & FX Nodes
  private kickSynth!: Tone.MembraneSynth;
  private hatSynth!: Tone.MetalSynth;
  private clapSynth!: Tone.NoiseSynth;
  private clapFilter!: Tone.Filter;
  private bassSynth!: Tone.MonoSynth;
  private bassFilter!: Tone.Filter;
  private bassDelay!: Tone.FeedbackDelay;
  
  // Players for custom samples
  private samplePlayers: Record<string, Tone.Player> = {};
  private trackSampleUrl: Record<TrackType, string | null> = {
    channel1: null,
    channel2: null,
    channel3: null,
    channel4: null,
    channel5: null,
    channel6: null,
    channel7: null,
    channel8: null
  };

  // Visualizer Analyser
  public analyser!: Tone.Analyser;
  private masterVolume!: Tone.Volume;
  
  // Mastering Chain
  private masterMePreGain!: Tone.Volume;
  private masterMeHighpass!: Tone.Filter;
  private masterMeCompressor!: Tone.Compressor;
  private masterMeMultiband!: Tone.MultibandCompressor;
  private masterMeLimiter!: Tone.Limiter;
  
  // ToneShiftEQ
  private toneShiftEqBands: Tone.Filter[] = [];
  private toneShiftTilt!: Tone.Filter;


  // Active state / sequencing
  private patterns: Record<TrackType, boolean[]> = {
    channel1: Array(16).fill(false),
    channel2: Array(16).fill(false),
    channel3: Array(16).fill(false),
    channel4: Array(16).fill(false),
    channel5: Array(16).fill(false),
    channel6: Array(16).fill(false),
    channel7: Array(16).fill(false),
    channel8: Array(16).fill(false)
  };
  private mutedStems: Record<TrackType, boolean> = {
    channel1: false,
    channel2: false,
    channel3: false,
    channel4: false,
    channel5: false,
    channel6: false,
    channel7: false,
    channel8: false
  };
  private synthNotes: number[] = Array(16).fill(0);
  private currentScaleName: keyof typeof MUSIC_SCALES = 'C Minor (Acid)';
  
  // Callback to update UI beat index
  private onBeatCallback: ((step: number) => void) | null = null;
  private currentStep = 0;
  private loopId: number | null = null;

  // Event queue
  private eventQueue: Array<{ time: number; type: string; track: TrackType; velocity: number }> = [];

  constructor() {
    this.masterBus = new Tone.Volume(0); // Initialize masterBus
  }

  public async init() {
    if (this.initialized) return;

    await Tone.start();
    this.ctx = Tone.context.rawContext;
    
    // --- WORKLET SETUP ---
    await Tone.context.audioWorklet.addModule('/src/audio/worklets/dspProcessor.js');
    this.dspNode = new AudioWorkletNode(Tone.context.rawContext, 'dsp-processor');
    
    // Core limiters & analyzer
    
    // --- MASTERING CHAIN SETUP ---
    // master_me
    this.masterMePreGain = new Tone.Volume(0);
    this.masterMeHighpass = new Tone.Filter(20, 'highpass');
    this.masterMeCompressor = new Tone.Compressor({
      threshold: -14,
      ratio: 4,
      attack: 0.005,
      release: 0.08,
      knee: 12
    });
    this.masterMeMultiband = new Tone.MultibandCompressor({
      lowFrequency: 150,
      highFrequency: 3000,
      low: { threshold: -12, ratio: 4 },
      mid: { threshold: -14, ratio: 3 },
      high: { threshold: -16, ratio: 2 }
    });
    this.masterMeLimiter = new Tone.Limiter(-1);

    // ToneShiftEQ (12 bands + Tilt)
    for (let i = 0; i < 12; i++) {
      this.toneShiftEqBands.push(new Tone.Filter(1000, 'peaking'));
    }
    this.toneShiftTilt = new Tone.Filter(1000, 'highshelf'); // Tilt sim

    // Connect Chain
    this.masterVolume = new Tone.Volume(-6);
    this.masterVolume.connect(this.masterMePreGain);
    this.masterMePreGain.connect(this.masterMeHighpass);
    this.masterMeHighpass.connect(this.masterMeCompressor);
    this.masterMeCompressor.connect(this.masterMeMultiband);
    this.masterMeMultiband.connect(this.masterMeLimiter);
    
    // Connect to EQ chain
    let prevNode: any = this.masterMeLimiter;
    for (let i = 0; i < 12; i++) {
      prevNode.connect(this.toneShiftEqBands[i]);
      prevNode = this.toneShiftEqBands[i];
    }
    prevNode.connect(this.toneShiftTilt);
    this.toneShiftTilt.connect(this.dspNode); // Connect to Worklet
    this.dspNode.toDestination();
    
    // Reset EQ to flat initially
    for(let i=0; i<12; i++) {
      this.toneShiftEqBands[i].gain.value = 0;
    }
    this.toneShiftTilt.gain.value = 0;

    this.analyser = new Tone.Analyser('waveform', 256);
    this.masterVolume.connect(this.analyser);

    // 1. Kick Synth
    this.kickSynth = new Tone.MembraneSynth({
      envelope: {
        attack: 0.002,
        decay: 0.35,
        sustain: 0.01,
        release: 0.35
      },
      octaves: 8,
      pitchDecay: 0.04
    }).connect(this.masterVolume);

    // 2. Hi-Hat Synth
    this.hatSynth = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.08,
        release: 0.08
      },
      harmonicity: 5.1,
      resonance: 6500,
      modulationIndex: 28
    }).connect(this.masterVolume);
    this.hatSynth.volume.value = -8; 

    // 3. Clap Synth & Bandpass filter
    this.clapFilter = new Tone.Filter(1800, 'bandpass').connect(this.masterVolume);
    this.clapSynth = new Tone.NoiseSynth({
      noise: {
        type: 'pink'
      },
      envelope: {
        attack: 0.002,
        decay: 0.18,
        sustain: 0,
        release: 0.1
      }
    }).connect(this.clapFilter);
    this.clapSynth.volume.value = -4;

    // 4. Bass Acid Synth + Filter + Delay
    this.bassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 600,
      Q: 6
    }).connect(this.masterVolume);

    this.bassDelay = new Tone.FeedbackDelay({
      delayTime: '8n.',
      feedback: 0.25,
      wet: 0.3
    }).connect(this.bassFilter);

    this.bassSynth = new Tone.MonoSynth({
      oscillator: {
        type: 'sawtooth'
      },
      envelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.3,
        release: 0.2
      },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.3,
        baseFrequency: 180,
        octaves: 3.5,
        exponent: 2
      }
    }).connect(this.bassDelay);
    this.bassSynth.volume.value = -3;

    // Setup repeating sequence
    this.loopId = Tone.Transport.scheduleRepeat((time) => {
      this.tick(time);
    }, '16n');

    this.initialized = true;
  }

  public triggerEvent(track: TrackType, velocity: number = 1.0) {
    const time = Tone.now();
    this.eventQueue.push({ time, type: 'trigger', track, velocity });
  }

  private processEvent(event: { time: number; type: string; track: TrackType; velocity: number }, time: number) {
    console.log(`Triggering ${event.track} at ${time}`);
    if (event.track === 'channel1') this.kickSynth.triggerAttackRelease('C1', '8n', time, event.velocity);
  }

  private tick(time: number) {
    const step = this.currentStep;

    this.eventQueue = this.eventQueue.filter(event => {
      if (event.time <= time) {
        this.processEvent(event, time);
        return false;
      }
      return true;
    });

    if (this.patterns.channel1[step] && !this.mutedStems.channel1) {
      this.kickSynth.triggerAttackRelease('C1', '8n', time);
    }

    if (this.onBeatCallback) {
      Tone.Draw.schedule(() => {
        this.onBeatCallback?.(step);
      }, time);
    }

    this.currentStep = (this.currentStep + 1) % 16;
  }

  public setBpm(bpm: number) {
    Tone.Transport.bpm.value = bpm;
  }

  public setMutedStems(muted: Record<TrackType, boolean>) {
    this.mutedStems = { ...muted };
  }

  public setPatterns(patterns: Record<TrackType, boolean[]>) {
    this.patterns = { ...patterns };
  }

  public setSynthNotes(notes: number[]) {
    this.synthNotes = [...notes];
  }

  public setScale(scaleName: keyof typeof MUSIC_SCALES) {
    this.currentScaleName = scaleName;
  }

  public updateBassSynth(cutoff: number, resonance: number, decay: number) {
    if (!this.initialized) return;
    this.bassFilter.frequency.rampTo(cutoff, 0.05);
    this.bassFilter.Q.rampTo(resonance, 0.05);
    this.bassSynth.envelope.decay = decay;
    this.bassSynth.filterEnvelope.decay = decay;
  }

  public updateDelayWet(wet: number) {
    if (!this.initialized) return;
    this.bassDelay.wet.rampTo(wet, 0.1);
  }

  public updateDelayTime(timeValue: number) {
    if (!this.initialized) return;
    this.bassDelay.delayTime.rampTo(timeValue, 0.1);
  }

  private dspNode!: AudioWorkletNode;

  public setWorkletParam(name: string, value: number) {
    if (!this.dspNode) return;
    this.dspNode.parameters.get(name)?.setValueAtTime(value, Tone.now());
  }


  public setGranularParams(params: { grainSize: number; density: number; position: number }) {
    if (!this.initialized) return;
    console.log("AudioEngine: Applying Granular Params", params);
  }

  public async loadTrackSample(track: TrackType, url: string | null) {
    this.trackSampleUrl[track] = url;
    if (url && !this.samplePlayers[url]) {
      const player = new Tone.Player(url).connect(this.masterVolume);
      await player.load(url);
      this.samplePlayers[url] = player;
    }
  }

  public async previewSample(category: 'bass' | 'mids' | 'highs', frequency?: number, url?: string) {
    await this.init();
    const time = Tone.now();
    
    if (url) {
      if (!this.samplePlayers[url]) {
        const player = new Tone.Player(url).connect(this.masterVolume);
        await player.load(url);
        this.samplePlayers[url] = player;
      }
      this.samplePlayers[url].start(time);
      return;
    }
  }

  public async play() {
    await this.init();
    Tone.Transport.start();
  }

  public pause() {
    Tone.Transport.pause();
  }

  public stop() {
    Tone.Transport.stop();
    this.currentStep = 0;
  }

  public setOnBeatCallback(callback: (step: number) => void) {
    this.onBeatCallback = callback;
  }

  public dispose() {
    if (this.loopId !== null) {
      Tone.Transport.clear(this.loopId);
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    this.kickSynth?.dispose();
    this.hatSynth?.dispose();
    this.clapSynth?.dispose();
    this.clapFilter?.dispose();
    this.bassSynth?.dispose();
    this.bassFilter?.dispose();
    this.bassDelay?.dispose();
    this.analyser?.dispose();
    this.masterVolume?.dispose();
    this.masterMeLimiter?.dispose();
    this.masterMeMultiband?.dispose();
    this.masterMeCompressor?.dispose();
    this.masterMeHighpass?.dispose();
    this.masterMePreGain?.dispose();
    this.toneShiftTilt?.dispose();
    this.toneShiftEqBands.forEach(b => b.dispose());
    
    this.initialized = false;
  }
  
  public setDrumKit(kit: string) {
    if (!this.initialized) return;
    
    switch(kit) {
        case 'TR-909':
            this.kickSynth.set({ envelope: { decay: 0.25 } });
            this.hatSynth.set({ resonance: 8000 });
            break;
        case 'TR-8':
            this.kickSynth.set({ envelope: { decay: 0.3 } });
            this.hatSynth.set({ resonance: 6000 });
            break;
        case 'MPC-60':
            this.kickSynth.set({ envelope: { decay: 0.15 } });
            this.hatSynth.set({ resonance: 4000 });
            break;
        case '808-Classic':
            this.kickSynth.set({ envelope: { decay: 0.4 } });
            this.hatSynth.set({ resonance: 5000 });
            break;
        case 'Elektro-Box':
            this.kickSynth.set({ envelope: { decay: 0.2 } });
            this.hatSynth.set({ resonance: 9000 });
            break;
        case 'BoomBap-HipHop':
            this.kickSynth.set({ envelope: { decay: 0.18 } });
            this.hatSynth.set({ resonance: 3500 });
            break;
        case 'Lo-Fi M8':
            this.kickSynth.set({ envelope: { decay: 0.1 } });
            this.hatSynth.set({ resonance: 2000 });
            break;
        default:
            this.kickSynth.set({ envelope: { decay: 0.35 } });
            break;
    }
  }

  public setEffectParams(params: { type: string; wet: number; power: boolean }) {
    if (!this.initialized) return;
    console.log('AudioEngine: Applying FX', params);
  }

  public addRemoteStream(stream: MediaStream) {
    if (!this.ctx) return;
    const source = this.ctx.createMediaStreamSource(stream);
    source.connect(this.masterBus);
    console.log('Remote WebRTC audio stream connected to master bus');
  }
}

export const audioEngine = new AudioEngine();
