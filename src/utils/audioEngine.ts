import * as Tone from 'tone';
import { TrackType, MUSIC_SCALES } from '../types';

class AudioEngine {
  public initialized = false;
  
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
    kick: null,
    hat: null,
    clap: null,
    synth: null,
    snare: null,
    tom: null,
    perc: null,
    bass: null
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
    kick: Array(16).fill(false),
    hat: Array(16).fill(false),
    clap: Array(16).fill(false),
    synth: Array(16).fill(false),
    snare: Array(16).fill(false),
    tom: Array(16).fill(false),
    perc: Array(16).fill(false),
    bass: Array(16).fill(false)
  };
  private mutedStems: Record<TrackType, boolean> = {
    kick: false,
    hat: false,
    clap: false,
    synth: false,
    snare: false,
    tom: false,
    perc: false,
    bass: false
  };
  private synthNotes: number[] = Array(16).fill(0);
  private currentScaleName: keyof typeof MUSIC_SCALES = 'C Minor (Acid)';
  
  // Callback to update UI beat index
  private onBeatCallback: ((step: number) => void) | null = null;
  private currentStep = 0;
  private loopId: number | null = null;

  constructor() {
    // Lazy loaded on first user interaction to satisfy browser security restrictions
  }

  public async init() {
    if (this.initialized) return;

    await Tone.start();
    
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
    this.toneShiftTilt.toDestination();
    
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
    this.hatSynth.volume.value = -8; // slightly quieter hats

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

  private tick(time: number) {
    const step = this.currentStep;

    // 1. Kick Trigger
    if (this.patterns.kick[step] && !this.mutedStems.kick) {
      if (this.trackSampleUrl.kick && this.samplePlayers[this.trackSampleUrl.kick]) {
        this.samplePlayers[this.trackSampleUrl.kick].start(time);
      } else {
        this.kickSynth.triggerAttackRelease('C1', '8n', time);
      }
    }

    // 2. Hat Trigger
    if (this.patterns.hat[step] && !this.mutedStems.hat) {
      if (this.trackSampleUrl.hat && this.samplePlayers[this.trackSampleUrl.hat]) {
        this.samplePlayers[this.trackSampleUrl.hat].start(time);
      } else {
        this.hatSynth.triggerAttack(time);
      }
    }

    // 3. Clap Trigger
    if (this.patterns.clap[step] && !this.mutedStems.clap) {
      if (this.trackSampleUrl.clap && this.samplePlayers[this.trackSampleUrl.clap]) {
        this.samplePlayers[this.trackSampleUrl.clap].start(time);
      } else {
        this.clapSynth.triggerAttack(time);
      }
    }

    // 4. Synth Bass Trigger
    if (this.patterns.synth[step] && !this.mutedStems.synth) {
      if (this.trackSampleUrl.synth && this.samplePlayers[this.trackSampleUrl.synth]) {
        this.samplePlayers[this.trackSampleUrl.synth].start(time);
      } else {
        const scale = MUSIC_SCALES[this.currentScaleName];
        const noteIndex = this.synthNotes[step] ?? 0;
        const note = scale[noteIndex % scale.length];
        
        if (step % 4 === 2) {
          this.bassSynth.triggerAttackRelease(note, '16n', time, 1.0);
        } else {
          this.bassSynth.triggerAttackRelease(note, '16n', time, 0.7);
        }
      }
    }

    if (this.patterns.snare && this.patterns.snare[step] && !this.mutedStems.snare) {
       this.clapSynth.triggerAttack(time, 0.5); // share clap for now
    }
    if (this.patterns.tom && this.patterns.tom[step] && !this.mutedStems.tom) {
       this.kickSynth.triggerAttackRelease('G2', '16n', time); // share kick tuned higher
    }
    if (this.patterns.perc && this.patterns.perc[step] && !this.mutedStems.perc) {
       this.hatSynth.triggerAttack(time, 0.3); // share hat
    }
    if (this.patterns.bass && this.patterns.bass[step] && !this.mutedStems.bass) {
       this.kickSynth.triggerAttackRelease('C1', '8n', time); // extra sub
    }

    // Callback to React UI thread
    if (this.onBeatCallback) {
      Tone.Draw.schedule(() => {
        this.onBeatCallback?.(step);
      }, time);
    }

    this.currentStep = (this.currentStep + 1) % 16;
  }

  // State / Pattern updates
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
    
    // Smoothly adjust frequency over 0.05 seconds to avoid clicks
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

  public setMasterVolume(val: number) {
    if (!this.initialized) return;
    // val is 0 to 100, scale to appropriate dB
    const db = Tone.gainToDb(val / 100);
    this.masterVolume.volume.rampTo(db, 0.1);
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
    
    if (category === 'bass') {
      // Trigger kick or a low bass sound
      const pitch = frequency ? (frequency < 100 ? frequency : 55) : 55;
      this.kickSynth.triggerAttackRelease(pitch, '8n', time);
    } else if (category === 'mids') {
      // Trigger clap/perc mid-range sound
      this.clapSynth.triggerAttack(time);
    } else if (category === 'highs') {
      // Trigger metallic high-hat sound
      this.hatSynth.triggerAttack(time);
    }
  }

  // Playback states
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
    
    // Dispose nodes
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

  // --- MASTERING CONTROL APIs ---
  public updateMasterMe(params: {
    input_gain?: number;
    highpass_freq?: number;
    target_loudness?: number;
    strength?: number;
    attack?: number;
    release?: number;
    limiter_threshold?: number;
  }) {
    if (!this.initialized) return;
    if (params.input_gain !== undefined) this.masterMePreGain.volume.rampTo(params.input_gain, 0.1);
    if (params.highpass_freq !== undefined) this.masterMeHighpass.frequency.rampTo(params.highpass_freq, 0.1);
    if (params.target_loudness !== undefined) this.masterMeCompressor.threshold.rampTo(params.target_loudness, 0.1);
    if (params.strength !== undefined) this.masterMeCompressor.ratio.rampTo(1 + (params.strength / 100) * 19, 0.1); // map 0-100 to 1-20 ratio
    if (params.attack !== undefined) this.masterMeCompressor.attack.rampTo(params.attack / 1000, 0.1);
    if (params.release !== undefined) this.masterMeCompressor.release.rampTo(params.release / 1000, 0.1);
    if (params.limiter_threshold !== undefined) this.masterMeLimiter.threshold.rampTo(params.limiter_threshold, 0.1);
  }

  public updateToneShiftEQ(params: {
    tilt_gain?: number;
    bands?: Array<{ freq: number; gain: number; q: number; type?: BiquadFilterType }>;
  }) {
    if (!this.initialized) return;
    if (params.tilt_gain !== undefined) this.toneShiftTilt.gain.rampTo(params.tilt_gain, 0.1);
    if (params.bands) {
      params.bands.forEach((b, i) => {
        if (i < 12) {
          this.toneShiftEqBands[i].frequency.rampTo(b.freq, 0.1);
          this.toneShiftEqBands[i].gain.rampTo(b.gain, 0.1);
          this.toneShiftEqBands[i].Q.rampTo(b.q, 0.1);
          if (b.type) this.toneShiftEqBands[i].type = b.type as any;
        }
      });
    }
  }

  public setMasterMeBypass(bypass: boolean) {
     if (!this.initialized) return;
     // simple volume toggle logic or similar
  }
public addRemoteStream(stream: MediaStream) {
  if (!this.ctx) return;
  const source = this.ctx.createMediaStreamSource(stream);
  // Connect to master bus (assuming masterBus is defined in class)
  source.connect(this.masterBus);
  console.log('Remote WebRTC audio stream connected to master bus');
}
}

export const audioEngine = new AudioEngine();
