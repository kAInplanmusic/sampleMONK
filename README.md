# Sample Monk Pro Audio Workstation

Sample Monk ist eine kollaborative, objektbasierte Audio-Workstation (OBA), konzipiert als modulares 16-Modul-System. Sie ermöglicht Echtzeit-Musikproduktion durch eine Kombination aus KI-gestützter Generierung, physikalischem Audio-Routing, Spatial-Audio (10.0) und einer Full-Mesh WebRTC-Kollaborationsschicht für bis zu 4 User.

## 1. Architektur & Modul-System
Sample Monk basiert auf einem modularen Container-Konzept (OFF, AUTO_AI, PRO).

| ID | Name | Funktion |
| :--- | :--- | :--- |
| I | mixerMONK | Stereo-Summierer (10 Kanäle), Volume/Panning. |
| II | controllerMONK | MIDI/HID-Integration, Hardware-Mappings. |
| III | sequencerMONK | 16-Step/8-Kanal Touch-Sequenzer. |
| IV | spatialMONK | 10.0 Spatial-Audio, 2D-Vektor-Panning. |
| V | instrumentMONK | WAM2/iPlug2-Host für virtuelle Instrumente. |
| VI | drumMONK | Drum-Sampler-Engine. |
| VII | effectMONK | Modulares FX-Rack (Delay, Reverb, etc.). |
| VIII | synthesizerMONK | Subtraktiv, FM, Wavetable Synthese-Engines. |
| IX | voiceMONK | KI-Vocal-Synthese, TTS & Vokoder. |
| X | samplerMONK | Granular-Synthese & KI-Sample-Manipulation. |
| XI | stemMONK | KI-gestützte Echtzeit-Stem-Trennung. |
| XII | recordingMONK | Finaler Capture des Master-Out-Signals. |
| XIII | biblioMONK | Semantischer File-Explorer & Asset-Datenbank. |
| XIV | eqMONK | Parametrischer EQ (Frequenz-Shaping). |
| XV | dspMONK | Phasenkorrektur & Dynamische Filter. |
| XVI | masteringMONK | Limiter, Loudness (LUFS) & Dynamics. |

## 2. Signal Chain (End-to-End)
Der Signalfluss ist strikt linear definiert:
1. **Quellen & Produktion:** Quellen (Assets, Instrumente) gesteuert durch Sequenzer & Controller.
2. **Summierung:** `mixerMONK` (I) -> Stereo-Summe.
3. **Bearbeitungs-Kette:** `eqMONK` (XIV) -> `dspMONK` (XV) -> `masteringMONK` (XVI).
4. **Ausgabe & Raum:** `recordingMONK` (XII) (Capture) -> `spatialMONK` (IV) (10.0-Raumverteilung).

## 3. Technologie-Stack
- **Frontend:** React, TailwindCSS, Tone.js, Web Audio API, AudioWorklets.
- **Backend:** Node.js (Signaling/API), Python/FastAPI/Celery (AI-Audio-Processing).
- **Infrastruktur:** Firestore (Assets/Session), Full-Mesh WebRTC (Kollaboration), Web MIDI/HID.

## 4. Lokaler Start
Zum Starten des Backend-Cores und der Hauptanwendung:
```bash
# Start Backend-Core (Node.js & Python)
cd services/backend-core && npm start
# Start Main App
npm run dev
```
