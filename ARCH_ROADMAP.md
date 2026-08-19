# audioMONASTRY High-Speed Performance Roadmap

## Phase 1: Performance-Monitoring
- Implement `PerformanceMonitorTerminal` (New Plugin Slot 17)
- Real-time CPU usage monitoring (AudioWorklet)
- WebRTC DataChannel latency tracking
- Jitter/Packet-loss tracking

## Phase 2: Client-Side UI Optimization
- Implement `React.memo` for all 16 Plugins.
- Migration of Canvas Visualizers to `OffscreenCanvas`.

## Phase 3: Server-Side Mixer Migration (Rust)
- Develop C++/Rust Mixer node in `services/mixer`.
- Integration into Node.js via N-API / WASM.

## Phase 4: WebGPU Spatialization
- Implement GPU compute shaders for spatial audio convolution.

## Phase 5: Infrastructure
- Multi-stage Docker builds (Rust + Node).
