# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt (aus TODOLAST.md / Professionalization)

✅ #1 Semantische Suche · ✅ #2 TURN/STUN · ✅ #3 Celery-Lazy-Load · ✅ #4 Ollama
✅ #5 Voice-Synthese · ✅ #9 EQ-Realsteuerung · ✅ #8 CRDT-Sync · ✅ #7 OPFS-Load
✅ #11 stem-ai Service · ✅ #10 Spatial-Mehrkanal (2/4.0/6/8/10/12/14/16/18.x)

### ✅ #10 Spatial Surround → 2/4.0/6/8/10/12/14/16/18.x Kanäle + Dropdown — FERTIG
- `src/utils/spatialMath.ts`: generisches Amplituden-Panning (VBAP-artig, 360°-Ring),
  `SPATIAL_SETUPS` (2.0..18.2 mit LFE), `calculateChannelPan(x,y,setupId)`,
  LFE-Ableitung, HRTF bleibt.
- `audioEngine.ts`: `setSpatialPosition` nutzt jetzt `calculateChannelPan` + wendet
  N-Kanal-Gewichte auf einen WebAudio `ChannelSplitter`/`GainNode[]`/`ChannelMerger`
  Subgraph an (`buildSpatialBus`, `setSpatialSetup`, `getSpatialSetups`).
- `SpatialSurroundPlugin.tsx`: Dropdown `<select>` der Setups, steuert
  `audioEngine.setSpatialSetup(id)`.
- `SpatialPluginTerminal.tsx`: useEffect reicht Positionen real an Engine weiter
  (kein No-Op), Imports bereinigt.

## GECOMMITTET (Branch main)
1af327a Stufe-1(P1-5) · f9624ea P9-EQ · a3e82cc P8-CRDT · 84ecee3 P7-OPFS · 5560990 P11-stem-ai
Nächster Commit: P10 Spatial (uncommitted)

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack/Rust) · #12 Mediasoup · #13 RBAC/Audit · #14 Instrumenten-Bibliothek

## Tooling-Hinweis
Robuste Dateiänderung: Terminal-heredoc bzw. python-Inserter.
