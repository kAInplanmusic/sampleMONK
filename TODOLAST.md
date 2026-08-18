# TODOLAST.md – Umsetzungsliste Sample MONK Professionalization

**Bewertungsprinzip:** Prozentwert = **Aufwand-zu-Ertrag-Verhältnis** (höher = bessere Effizienz, implementiere zuerst).

Jeder Punkt enthält: **P%** (Effizienz-Score), Kurzbeschreibung, benötigte Konfiguration/Verknüpfungen.

---

## 🟢 PRIORITÄT 1 – Sofort umsetzbar (Woche 1–2)

### 1. 📊 **95%** – Echte semantische Sample-Suche mit Transformers.js
**Aufgabe:** In `package.json` das Paket `@xenova/transformers` (ONNX MiniLM-L6-v2) installieren. Die lokale Embedding-Logik in `src/utils/LocalEmbeddingProvider.ts` wird dadurch schlagartig von **Hash-Fallback** auf **echte Vektoren** gehoben (Code existiert bereits, nur das Paket fehlt!). Danach `src/components/SemanticSampleSearch.tsx` bereits voll funktionsfähig.
**Config:** `npm i @xenova/transformers`
**Verknüpfungen:** `LocalEmbeddingProvider.ts`, `cosineSimilarity()`, `SemanticSampleSearch.tsx`, `LibraryTerminal.tsx`

### 2. 📍 **90%** – Vollständige Kanal-Routing-Matrix für TURN + STUN
**Aufgabe:** `src/config/webrtc.ts` ist hart auf **NUR Google-STUN** gesetzt. Für Hetzner-Workloads firewallsicheren eigenen TURN-Server einbinden (`services/turn/` existiert bereits mit `turnserver.conf` und `deploy-turn.sh`). Ersetze Google-STUN-URLs durch eigene Hetzner-TURN-Endpoints.
**Config:** `.env` → `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`; `rtcConfig.iceServers`
**Verknüpfungen:** `WebRTCManager.ts`, `AudioContext.tsx`, `useWebRTC.ts`

### 3. ✅ **85%** – Must-have: Lazy-Loading für Celery-KI-Modelle
**Aufgabe:** `services/backend-core/python/celery_app.py` lädt **Demucs + MusicGen hart beim Import** – crasht den Worker wenn GPU/OOM. Modell-Loading in Lazy-Getter verlagern, GPU-Detect (torch.cuda.is_available) + CPU-Fallback einbauen.
**Config:** env `AI_DEVICE=cuda|cpu`, `AI_USE_DEMUCS=1`
**Verknüpfungen:** `celery_app.py`, `hypersonic_moa.py`, `Dockerfile.stem-ai`

### 4. 🔌 **80%** – Ollama-Endpunkte ins REST-Backend verdrahten (`server.ts`)
**Aufgabe:** `server.ts` hat `/api/ai/compose` als deterministischen Mock. HyperSonicMOA (`hypersonic_moa.py`) kann bereits Ollama, aber es gibt **keinen HTTP-Proxy**. Neue Endpunkte `/api/ai/patch` + `/api/ai/describe` einrichten, die via `fetch` die **backend-core python** API aufrufen.
**Config:** `OLLAMA_URL=http://127.0.0.1:11434`, `OLLAMA_MODEL=qwen2.5:7b`
**Verknüpfungen:** `server.ts`, `hypersonic_moa.py`, `useAudioAI.ts`

### 5. 🟨 **75%** – Echte Voice-Synthese statt Mock-Fallback
**Aufgabe:** `src/hooks/useAudioAI.ts` → `generateVoice()` fällt aktuell auf **Web-Speech-API** zurück. Für hochwertige Vocals (RVC/VITS) einen neuen Endpunkt `/api/voice/generate` in backend-core-python (FastAPI) einbauen, der RVC-Modell via Shell lädt.
**Config:** `.env` → `VOICE_MODEL=rvc`, `VOICE_CHECKPOINT=./models`
**Verknüpfungen:** `useAudioAI.ts`, `VoiceGenTerminal.tsx`, `services/backend-core/python`

---

## 🟡 PRIORITÄT 2 – Mittelfristig (Woche 3–4)

### 6. ⚡ **72%** – WASM-DSP-Kerne (Rust) statt JS-AudioWorklets
**Aufgabe:** `src/audio/wasm/` ist ein Stub. Den Rust-Kern aus `services/mixer/lib.rs` als Browser-WASM kompilieren (`wasm-pack`) und als `dsp-wasm` in den AudioWorklet-Pfad (`dspProcessor.ts`) einbinden.
**Config:** `wasm-pack build --target web` → `src/audio/wasm/*.wasm` → `public/wasm/`
**Verknüpfungen:** `WasmPluginHost.ts`, `dspProcessor.ts`, `plugin-manifest.json`

### 7. 🗄️ **70%** – OPFS-basierte Sample-DB in `SampleContext` laden
**Aufgabe:** `src/utils/opfs.ts` hat bereits `listSamples()`, aber `SampleContext.tsx` lädt die OPFS-Samples **nie beim Start** – es startet nur mit `PRESET_SAMPLE_DATABASE`. Beim Provider-Mount `listSamples()` ausführen und vorhandene Samples einbinden.
**Config:** Keine (browser-intern)
**Verknüpfungen:** `opfs.ts`, `SampleContext.tsx`, `SampleModuleWrapper.tsx`

### 8. 🔄 **68%** – CRDT-Sync für DataChannel (Zero-Desync)
**Aufgabe:** `AudioContext.tsx` sendet PLAIN state over datachannel (10Hz), kein Konfliktlösung. Für `CLOCK_SYNC` + `PLUGIN_STATE_UPDATE` ein leichtgewichtiges CRDT (z.B. Automerge-Light oder Yjs als Peer-Abstraktion) einbauen.
**Config:** `npm i yjs` oder `automerge`
**Verknüpfungen:** `WebRTCManager.ts`, `AudioContext.tsx`, `usePluginState.ts`

### 9. 🎚️ **65%** – EQPlugin-Bands tatsächlich an fuehrender Audio-Kette anbinden
**Aufgabe:** `EQPluginTerminal.tsx` ruft `audioEngine.updateToneShiftEQ()` auf, aber `audioEngine.updateToneShiftEQ` ist **No-Op** (`// console.log`). Die 8 EQ-Bänder müssen die `eqProcessor.ts`-Worklet-Parameter (`setEqBand`) real steuern.
**Config:** Keine
**Verknüpfungen:** `EQPluginTerminal.tsx`, `audioEngine.ts`, `eqProcessor.ts`

### 10. 🛰️ **60%** – Spatial Suround → 10.0-Kanal-Wegverdrahtung
**Aufgabe:** `spatialMath.ts` hat `calculate10ChannelPan()` aber `audioEngine.setSpatialPosition()` nutzt nur HRTF/Stereo-Pan, nicht die 10-Kanal-Matrix. WebAudio `ChannelMerger`+`ChannelSplitter` (10 Kanäle) implementieren und SpatialSurroundPlugin darauf verdrahten.
**Config:** Keine
**Verknüpfungen:** `spatialMath.ts`, `audioEngine.ts`, `SpatialSurroundPlugin.tsx`

---

## 🔵 PRIORITÄT 3 – Langfristig (Woche 5–8)

### 11. 🧠 **55%** – Echte KI-stem-Separation als Docker-Service
**Aufgabe:** `services/stem-ai/` hat nur eine leere Dockerfile. Demucs-HTDPy-Service als FastAPI implementieren, der als separater Container neben `backend-core` läuft und `/api/separate-stems` real serviert.
**Config:** `docker-compose.yml` → neue Service `stem-ai`, `ENABLE_STEMS=1`
**Verknüpfungen:** `server.ts`, `useAudioAI.ts`, `services/stem-ai/Dockerfile`

### 12. 🎙️ **50%** – Mediasoup für Skalierung & Audio-Konferenzen
**Aufgabe:** Für >4 Nutzer + Broadcasting auf Mediasoup-Router umbauen. Betrifft `services/backend-core` + `WebRTCManager.ts`.
**Config:** `MEDIASOUP_LISTEN_IP`, `MEDIASOUP_RTC_MIN_PORT=10000`, `MEDIASOUP_RTC_MAX_PORT=20000`
**Verknüpfungen:** `WebRTCManager.ts`, `services/signaling`

### 13. 🔒 **45%** – Audit-Log & RBAC für gesamte Session
**Aufgabe:** `src/utils/AuditLogger.ts` existiert, integriere ein zentrales Rollen-Berechtigungssystem (Host + 4 User) cross-plugin, nur Open Source (kein Vault).
**Config:** `SESSION_HOST_USER`, `SESSION_ROLE=admin|producer|engineer|guest`
**Verknüpfungen:** `AuditLogger.ts`, `useRoom.ts`, `rolePresets.ts`

### 14. 📦 **40%** – Native Instrumenten-Bibliothek (50+ echte Instrumente)
**Aufgabe:** `InstrumentePlugin.tsx` render nur `<div>Instrumente Terminal UI</div>`. Für 50 akustische Instrumente (Violine, Klavier, Sitar...) Sample-pack importieren oder Synthesizer-Kern basierend auf Fachphysik bauen.
**Config:** `public/instruments/*.wav` oder `strumenti presets`
**Verknüpfungen:** `InstrumentePlugin.tsx`, `InstrumentsTerminal.tsx`

---

## ✅ Zusammenfassung: Empfohlene Reihenfolge für Agenten-Modus

| Stufe | Punkte | Wirkung |
|---|---|---|
| **Stufe 1** | #1, #2, #3 | Sofort sichtbare Qualität & Stabilität |
| **Stufe 2** | #4, #5, #6 | KI + Performance-Boost |
| **Stufe 3** | #7, #8, #9, #10 | Kollaboration & Audio-Integration |
| **Stufe 4** | #11, #12, #13, #14 | Skalierung & Content |
