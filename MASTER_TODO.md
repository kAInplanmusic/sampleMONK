# audioMONASTRY – MASTER TODO

Status-Legende: `[x]` fertig · `[ ]` offen · `[~]` in Arbeit

## 🔴 Fundament (Priorität 1)
- [x] **T1** Einheitliches Track-Role-Datenmodell (types, audioEngine, Validatoren, presets)
- [x] **T2** AudioWorklet Lookahead-Scheduler (drumMONK + sequencerMONK, Swing, Gate)
- [x] **T3** Audio-I/O- & Device-Settings-Dialog (Soundkarte, SinkId, Buffer)
- [x] **T4** Monitor/Cue-Bus für 1–4 Personen + Rollen-Presets

## 🟠 Hardware & Klangerzeugung
- [x] **T5** MIDI Auto-Erkennung + Hotplug (controllerMONK, Device-Registry)
- [x] **T6** Canvas-Skin-Engine für MIDI-Geräte
- [x] **T7** synthesizerMONK: WASM/WAM-Synth-Kern (PolyBLEP, ADSR, Moog)
- [x] **T8** mixerMONK: Stereo/DAW-Routing + RMS/True-Peak-Metering

## 🟡 Effekte & Mixing
- [x] **T9** eqMONK: parametrischer EQ + Frequenzgang
- [x] **T10** dspMONK: Phasenkorrektur + dynamische Filter
- [x] **T11** masteringMONK: Lookahead-Limiter + LUFS (EBU R128)
- [x] **T12** effectMONK: Convolution-Reverb + WAM-Insert/Send-Matrix

## 🟢 Capture, Stems, Suche, Live
- [x] **T13** recordingMONK + voiceMONK: PCM-Record + TTS
- [x] **T14** stemMONK: Demucs-Integration
- [x] **T15** biblioMONK: OPFS/IndexedDB-Cache (Analyse/Waveform dokumentiert)
- [x] **T16** visMONK: Visualizer (Scope/Spektrogramm/Lissajous)
- [x] **T17** spatialMONK: HRTF-Spatial-Hub
- [x] **T18** Live-Session-UI (StreamLayout, useRoom/useWebRTC)
- [x] **T19** Echte lokale Embeddings (biblioMONK-Suche)

## 🟦 Performance, UX & Abschluss
- [x] **T20** AudioWorklet-Clock für Sync + PLL aktivieren
- [x] **T21** Modul-Zusammenführung (rekorder/voice, dsp/eq/effect, synth/instrument)
- [x] **T22** UX/Onboarding + Rollen-Start-Presets (DJ/Producer/Engineer/STEM)
- [x] **T23** Doku/README + CI erweitern + MASTER_TODO finalisieren
