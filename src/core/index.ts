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
