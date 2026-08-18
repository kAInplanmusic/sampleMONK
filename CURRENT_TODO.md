# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt Punkt für Punkt (aus TODOLAST.md)

### ✅ #1 Echte semantische Sample-Suche — FERTIG
- `src/utils/LocalEmbeddingProvider.ts` neu: Wortstamm + Synonyme + BM25 + TF-IDF (offline).
- `src/components/SemanticSampleSearch.tsx` nutzt jetzt `semanticRankSamples()`.

### ✅ #2 TURN/STUN-Routing — FERTIG
- `src/config/webrtc.ts` neu: PUBLIC_STUN-Array, `addTurnServer()`, TURN aus `VITE_TURN_*`.
- `bundlePolicy`/`rtcpMuxPolicy` + `iceCandidatePoolSize` gesetzt.

### ✅ #3 Celery Lazy-Loading + GPU-Detect — FERTIG
- `services/backend-core/python/celery_app.py`: Geräte-Detect (cuda/mps/cpu),
  Lazy-Loading für Demucs + MusicGen, `AI_DEVICE`/`AI_USE_*` env, graceful degradation.

### ✅ #4 Ollama-Endpunkte ins REST-Backend — FERTIG
- `server.ts`: `POST /api/ai/generate` + `POST /api/ai/describe`, Ollama via env
  (OLLAMA_URL/MODEL), gracefall-Fallback auf deterministischen lokalen Generator.

### ✅ #5 Echte Voice-Synthese — FERTIG
- `server.ts` `/api/generate-voice`: RVC/VITS-Hook via `VOICE_ENGINE`/`VOICE_CLI`,
  sonst `local` -> Web-Speech.
- `src/hooks/useAudioAI.ts` `generateVoice()`: Server-zuerst, dann Web-Speech, dann Mock.

## Offen (aus TODOLAST.md)
#6 WASM-DSP · #7 OPFS-DB-Load · #8 CRDT-Sync · #9 EQ-Realsteuerung · #10 Spatial-10ch
#11 stem-ai Service · #12 Mediasoup · #13 RBAC/Audit · #14 Instrumenten-Bibliothek

## Tooling-Hinweis
`edit_existing_file`/`single_find_and_replace` bei langen Inhalten unzuverlässig.
Robust: Terminal-heredoc bzw. python-Inserter für `server.ts`/`.ts`-Dateien.
