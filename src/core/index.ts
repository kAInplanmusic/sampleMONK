/**
 * audioMONASTRY · Core-Abstraktionen (Public API)
 * ----------------------------------------------
 * Zentral erreichbarer Einstiegspunkt der Phase-1-Abstraktionsschichten und
 * der erweiterten Kern-Bausteine (WebGPU, Worker-Pool, SFU, instrumentMONK).
 */
export * from './interfaces';
export { WebAudioBackend, webAudioBackend } from './WebAudioBackend';
export {
  WebRTCTransport, webRTCTransport,
  AIRuntime, aiRuntime,
  ComputeBackend, computeBackend,
  SpatialRenderer, spatialRenderer,
  WebMIDIAdapter, webMIDIAdapter,
  createBackends,
} from './adapters';
export type { Backends } from './adapters';

// WebGPU-Beschleuniger (4.1.1)
export { WebGPUKernel, getGPUKernel } from './gpu/WebGPUKernel';

// Worker-Pool (2.2.2)
export { workerPool } from './workers/WorkerPool';
export { computeLocal } from './computeLocal';

// SFU / Kollaborations-Transport (3.1.1)
export { MediasoupTransport, sfuTransport } from './transport/MediasoupTransport';

// instrumentMONK: Instrumenten-Engine (Plugin #5)
export type { IInstrumentBackend } from './instrument/IInstrumentBackend';
export { InstrumentBackend, instrumentBackend } from './instrument/InstrumentBackend';
export {
  INSTRUMENT_CATALOG, getInstrument, listByCategory, catalogStats,
  ACOUSTIC_INSTRUMENTS, SYNTHESIS_INSTRUMENTS,
} from './instrument/catalog';
export type {
  InstrumentDefinition, InstrumentPreset, InstrumentChannel,
  InstrumentCategory, SynthKind, NoteInput,
  SynthDef, FmDef, DrumDef, FxDef, AcousticDef,
} from './instrument/types';
