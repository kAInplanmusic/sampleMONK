# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt (aus TODOLAST.md / Professionalization)

✅ #1-#5 Stufe-1 · ✅ #7 OPFS · ✅ #8 CRDT · ✅ #9 EQ · ✅ #10 Spatial · ✅ #11 stem-ai
✅ #13 RBAC/Audit · ✅ #14 Instrumenten-Bibliothek

### ✅ #14 Native Instrumenten-Bibliothek (50 akustische Instrumente) — FERTIG
- Neu `src/data/instrumentSynths.ts`: 50 Patches (Piano, Violine, Sitar, Trompete,
  Flöte, Theremin, Timpani …) mit physikalischen Obertonspektren, Hüllkurven,
  Filter, Vibrato, Anblas-Noise, Detune je Familie.
- `audioEngine.ts`: `loadInstrument(id)` baut echten additiven Synthesizer
  (Partial-Oszillatoren + Formantfilter + Vibrato-Detune-LFO + Anblas-Noise),
  plus `instrumentNote`/`instrumentRelease`.
- `InstrumentsTerminal.tsx`: Vorschau-Keyboard (C4..C5) spielt Instrumente live.
- `InstrumentePlugin.tsx`: Pro-UI rendert echte `InstrumentsTerminal`.

## GECOMMITTET (Branch main)
1af327a Stufe-1 · f9624ea P9 · a3e82cc P8 · 84ecee3 P7 · 5560990 P11 · f21f534 P10
db049ae P13 · nächster Commit P14 (uncommitted)

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack/Rust-Build, hier nicht verfügbar)
#12 Mediasoup (große Infrastruktur – WebRTC-Routing-Umbau)

## Tooling-Hinweis
Robuste Dateiänderung: Terminal-heredoc bzw. python-Inserter.
