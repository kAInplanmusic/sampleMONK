# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt (aus TODOLAST.md / Professionalization)

✅ #1 Semantische Suche · ✅ #2 TURN/STUN · ✅ #3 Celery-Lazy-Load · ✅ #4 Ollama
✅ #5 Voice-Synthese · ✅ #9 EQ-Realsteuerung · ✅ #8 CRDT-Sync · ✅ #7 OPFS-Load

### ✅ #7 OPFS-Sample-DB in SampleContext laden — FERTIG
- `src/context/SampleContext.tsx`: neuer Mount-Effekt ruft `listSamples()` (aus
  `opfs.ts`) auf und integriert vorhandene OPFS-Dateien als AudioSample-Einträge
  (Kategorie 'OPFS', keine Duplikate zu PRESET_DATABASE).

## GECOMMITTET
- 1af327a: Stufe-1 (P1–P5)    f9624ea: P9 EQ-Realsteuerung
- a3e82cc: P8 CRDT-Sync       nächster Commit: P7 OPFS-Load

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack/rust-Build)  #10 Spatial-10ch  #11 stem-ai Service
#12 Mediasoup  #13 RBAC/Audit  #14 Instrumenten-Bibliothek

## Tooling-Hinweis
`edit_existing_file`/`single_find_and_replace` bei langen Inhalten unzuverlässig.
Robust: Terminal-heredoc bzw. python-Inserter.
