# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Stand
✅ Stufe-1 Punkte 1-5 · ✅ P7-P14 · ✅ Logo-Einbindung + UI/UX
✅ ALLE TypeScript-Errors (17) + 108 unused-Warnungen auf 0 reduziert (aktueller Commit)

### ✅ TypeScript-Bereinigung – FERTIG (aktueller Commit)
- **17 harte Errors behoben:**
  - LocalEmbeddingProvider: STOPWORDS-Array vervollständigt + fallbackEmbedding implementiert.
  - server.ts: toter Demucs-Block (undefiniertes `file`) entfernt, spiwn-Import bereinigt.
  - App.tsx: moduleStateForRole -> Record<string, ModuleState> (rolePresets.ts).
  - Worklets: sampleRate/currentFrame/currentTime als AudioWorkletGlobalScope in web-apis.d.ts deklariert.
  - SafeModuleBoundary: moduleName aus State entfernt.
  - useMIDI: MIDIConnectionEvent -> event.port.state.
  - hubConnector: `export type { Role }` für isolatedModules.
  - SpatialSurroundPlugin: _positionBuffer-Typ ArrayBuffer|SharedArrayBuffer.
  - audioEngine: @ts-ignore statt unused @ts-expect-error; Tone.Filter Rolloff/Q korrigiert.
- **108 unused-Warnungen (--noUnusedLocals/Parameters) bereinigt:**
  - 14 unbenutzte React-Imports (react-jsx) entfernt.
  - ~60 unbenutzte lucide-Icons + Hooks (useEffect/useCallback/useRef/useSamples) entfernt.
  - Tote Felder (loopId/eventQueue/latencyMonitor/instrumentGains/instrumentNoiseEnv/…) entfernt.
  - _-Präfix für ungenutzte Parameter/Map-Indizes.
- `tsc --noEmit` (Standard) = 0 Errors · `--noUnusedLocals/Parameters` = 0 Warnungen.

## GECOMMITTET (Branch main)
1aa7a84 UI/UX Logo · 3ba5ce9 ModuleContainer · (aktuell: TS/0 zusammen)

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack/Rust-Build) · #12 Mediasoup (große Infrastruktur)

## Tooling
node via PATH: export PATH=/home/patrick/.nvm/versions/node/v24.19.0/bin:$PATH
