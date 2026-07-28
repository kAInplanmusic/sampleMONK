# Master TODO List

## 1. Audio Engine Core
- [x] Migrate DSP modules to AudioWorklet (Worklet-Pipeline)
- [x] Implement Lazy Init for Engine components
- [x] Ensure absolute paths for Worklets
- [x] Implement SAB-Metering for real-time analysis
- [x] Audit memory usage in AudioEngine (Implemented isPlaying flag and dispose mechanism)

## 2. Spatial Surround Engine
- [x] Implement Fallback-PannerNode
- [x] Ensure Safe-State in Canvas rendering
- [x] Implement SAB-Positions-Update

## 3. Mischpult / Mixer
- [x] Standard-Master-Bus
- [x] Synchronisation mit routing.json
- [x] Implement Transaktions-Cleanup
- [x] Implement Routing-Validator

## 4. WAM Host & WASM Loader
- [x] Add try/catch for every Import
- [x] Generate Fallback-Plugin
- [x] Implement Cache-Validierung

## 5. WebRTC & Signaling Sync
- [x] Implement Offline-Modus
- [x] Implement Listener-Cleanup
- [x] Integrate WebTransport
- [x] Implement Turn-Server-Fallback (Added ICE servers)
- [x] State-Synchronization via WebRTC DataChannel (Implemented DataChannel listener)

## 6. DSP Processor Worklet
- [x] Pre-compilation as JS in public/
- [x] Ensure MIME-Types

## 7. Synthesizer Terminal
- [x] Define Default-Values for all parameters
- [x] Implement robuste State-Prüfung

## 8. Sampler Terminal
- [x] Buffer-Decoding only after AudioContext Release
- [x] Implement Fortschrittsanzeige

## 9. Sequencer Engine
- [x] Switch to Lookahead-Scheduler (Web-Audio-Clock)
- [x] Add visuelles Feedback

## 10. Stem AI Extractor
- [x] Add robustes Error-Handling
- [x] Implement Mock-Fallback
- [x] Add Streaming-Response (SSE)

## 11. Library AI & Semantic Search
- [x] Implement Paginierung (9 items per page)
- [x] Implement asynchrone Suche (With Debouncing)
- [x] Local ONNX-Embeddings optional (Structural implementation with mock)

## 12. Metering & LUFS Analyzer
- [x] Implement SAB-Integration (Zero-latency waveform rendering via OffscreenCanvas)
- [x] Implement Rendering-Stopp bei Inaktivität (Worker loop stops when audio is silent)

## 13. Mastering Overlay
- [x] Gain-Smoothing beim Preset-Wechsel

## 14. Voice Generator Terminal
- [x] Add Feature-Flag zum Deaktivieren (Centralized config)
- [x] Add API-Mock (Robust fallback)
- [x] Plan SLM-Integration (Created VOICE_SLM_PLAN.md)

## 15. MIDI & HID Controller
- [x] Implement HTTPS-Check für requestMIDIAccess
- [x] Add detaillierte Fehlermeldung

## 16. Plugin Registry & Container
- [x] Wrap Jedes Modul in SafeModuleBoundary
- [x] Implement automatische Modul-Erkennung (Manifest-based discovery)

## 17. General Performance & Production Readiness
- [x] Schema-Validator (Zod) for Gemini presets (Added GeminiPresetSchema)
- [x] Error-Recovery for AI API hooks (Added useAIStatus)
- [x] Refine system prompts for HyperSonicMOA (Expanded producer context)
- [x] Rendering-Optimization (React.memo/useCallback in Mixer/Drum components)
- [x] Type-Safety Audit (tsc --noEmit) (Cleaned up major issues)
