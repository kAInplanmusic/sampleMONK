# Phase 1 · Core-Abstraktionsschichten

> audioMONASTRY – Modulärer Kern. Ziel von Phase 1: Die 16 Kernmodule sprechen
> keinerlei Browser-/Provider-APIs mehr direkt an, sondern ausschließlich über
> die Interfaces in [`interfaces.ts`](./interfaces.ts). Dadurch wird jedes
> Backend (Audio, KI, Compute, Spatial, Hardware, Transport) austauschbar, ohne
> die Kernmodule refaktorieren zu müssen.

## 1.1.1 · `IAudioBackend`
Abstrahiert Klangsynthese, Sample-Aufruf, Mixer, Effekte und tempo.

| Beschreibung | Datei |
|---|---|
| Interface | [`interfaces.ts`](./interfaces.ts) |
| Referenz | [`WebAudioBackend.ts`](./WebAudioBackend.ts) – wrapper um die Tone.js/Engine-Kette |

**Erfolgskriterium 1.1.1:** Kernmodule kommunizieren nur noch über dieses Interface.

## 1.1.2 · `IAIRuntime`
Abstrahiert KI-Inferenz: lokal (WebGPU/ONNX/WASM) / remote (API) / deterministisch.

| Beschreibung | Datei |
|---|---|
| Interface + `AIBackendKind`/`AIResult` | [`interfaces.ts`](./interfaces.ts) |
| Referenz | [`adapters.ts`](./adapters.ts) → `AIRuntime` (Fallback deterministisch) |

**Nächste Schritte:** stemMONK (Stem-Separation), voiceMONK (TTS/Sing), biblioMONK
(Embedding) als lokale/remote Adapter an diese Schnittstelle hängen.

## 1.1.3 · `IComputeBackend`
Trennt **Live**- (kurz, Main-Thread) und **Offline**- (lange, Web-Worker) Jobs, damit
der Audio-/Echtzeitpfad nie blockiert wird.

| Beschreibung | Datei |
|---|---|
| Interface + `ComputeMode`/`IComputeJob` | [`interfaces.ts`](./interfaces.ts) |
| Referenz | [`adapters.ts`](./adapters.ts) → `ComputeBackend` (Worker mit Fallback) |

## 1.1.4 · `ISpatialRenderer`
Objektbasiertes Spatial-Modell (Position/Gain/Spread/Rotation), renderer-unabhängig.

| Beschreibung | Datei |
|---|---|
| Interface + `SpatialSource` | [`interfaces.ts`](./interfaces.ts) |
| Referenz | [`adapters.ts`](./adapters.ts) → `SpatialRenderer` (wrapper um `spatialMath`) |

**Ziel** (Phase 5): StereoSpatialRenderer / BinauralSpatialRenderer / MultichannelRenderer
bis 18.2 aus derselben Szene.

## 1.1.5 · `IHardwareAdapter`
Abstrahiert MIDI / HID / OSC über ein generisches `ControlMessage`-Modell.

| Beschreibung | Datei |
|---|---|
| Interface + `ControlMessage` | [`interfaces.ts`](./interfaces.ts) |
| Referenz | [`adapters.ts`](./adapters.ts) → `WebMIDIAdapter` |

## 1.1.6 · `ITransport`
Abstrahiert Kollaborations-Transport: aktuell WebRTC Full-Mesh (P2P), zukünftig SFU.

| Beschreibung | Datei |
|---|---|
| Interface + `TransportMode` | [`interfaces.ts`](./interfaces.ts) |
| Referenz | [`adapters.ts`](./adapters.ts) → `WebRTCTransport` (wrapper um `WebRTCManager`) |

## Zentraler Einstieg / Hot-Swapping

- [`index.ts`](./index.ts) exportiert die öffentliche Core-API.
- [`adapters.ts`](./adapters.ts) → `createBackends()` baut die Standard-Suite von Backends.

```
const backends = await createBackends();
backends.audio.setTempo(126);
backends.transport.broadcast({ type: 'tempo', value: 126 });
```

## Status in MASTER_TODO

- 1.1.1 – ✔ Interface + WebAudioBackend-Referenz
- 1.1.2 – ✔ Interface + AIRuntime-Referenz (deterministischer Fallback)
- 1.1.3 – ✔ Interface + ComputeBackend-Referenz (Worker mit Fallback)
- 1.1.4 – ✔ Interface + SpatialRenderer-Referenz (wrapper um spatialMath)
- 1.1.5 – ✔ Interface + WebMIDIAdapter-Referenz
- 1.1.6 – ✔ Interface + WebRTCTransport-Referenz (wrapper um WebRTCManager)

> **Ausstehend für volle Erfüllung der Phase-1-Gesamtziele:** Zur-Verfügung-Stellung
> der Core-Schnittstellen in allen 16 Modulen (validiert durch automatische
> Import-Analyse), sowie Interface-Dokumentation in alle Module überführen.
