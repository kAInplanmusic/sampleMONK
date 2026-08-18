# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt Punkt für Punkt (aus TODOLAST.md)

✅ #1 Semantische Suche  ✅ #2 TURN/STUN  ✅ #3 Celery-Lazy-Load  ✅ #4 Ollama
✅ #5 Voice-Synthese     ✅ #9 EQ-Realsteuerung   ✅ #8 CRDT-Sync

### ✅ #8 CRDT-Sync für DataChannel (Zero-Desync) — FERTIG
- Neu `src/utils/crdt.ts`: CrdtClock (Lamport), CrdtLwwMap (Last-Writer-Wins),
  CrdtClockMerger (2ms-Schwelle + 4s-Plausibilitätslimit, verhindert 10Hz-Desync).
- `AudioContext.tsx`: Sender stampft CLOCK_SYNC (Lamport), Empfänger merged
  CLOCK_SYNC über CrdtClockMerger und PLUGIN_STATE_UPDATE über CrdtLwwMap.

## GECOMMITTET
- 1af327a: Stufe-1 (P1–P5), 8 Dateien +751/-157
- f9624ea: P9 EQ-Realsteuerung
- Nächster Commit: P8 CRDT-Sync

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack)  #7 OPFS-DB-Load  #10 Spatial-10ch
#11 stem-ai Service  #12 Mediasoup  #13 RBAC/Audit  #14 Instrumenten-Bibliothek

## Tooling-Hinweis
`edit_existing_file`/`single_find_and_replace` bei langen Inhalten unzuverlässig.
Robust: Terminal-heredoc bzw. python-Inserter.
