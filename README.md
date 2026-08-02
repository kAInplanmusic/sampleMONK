# Sample Monk Pro Audio Workstation

Sample Monk ist eine kollaborative, objektbasierte Audio-Workstation (OBA), konzipiert als hochmodulares 16-Modul-System. Sie ermöglicht Echtzeit-Musikproduktion durch eine Kombination aus KI-gestützter Generierung, physikalischem Audio-Routing, Spatial-Audio (10.0) und einer Full-Mesh WebRTC-Kollaborationsschicht.

## 🚀 Live-Systeme
*   **Applikation:** [https://sample-monk.web.app](https://sample-monk.web.app)
*   **Backend API:** [https://audio-backend-293043362808.europe-west1.run.app](https://audio-backend-293043362808.europe-west1.run.app)

---

## 🛠 Modul-Architektur
Das System besteht aus 16 dedizierten Modulen, die über den `MischpultMONK` (I) zentral verwaltet werden.

| ID | Name | Funktion |
| :--- | :--- | :--- |
| I | mixerMONK | Zentrales Routing, Stereo-Summe, Gain-Staging. |
| II | controllerMONK | MIDI/HID-Integration, Hardware-Mappings. |
| III | sequencerMONK | Touch-optimierter Lookahead-Step-Sequenzer. |
| IV | spatialMONK | 10.0 Spatial-Audio, 2D/3D-Vektor-Panning. |
| V | instrumentMONK | WAM2/iPlug2-Host für virtuelle Instrumente. |
| VI | drumMONK | Drum-Sampler-Engine & Kit-Management. |
| VII | effectMONK | Modulares FX-Rack (Hardware-Emulation). |
| VIII | synthesizerMONK | Subtraktiv, FM, Wavetable Synthese-Engines. |
| IX | voiceMONK | KI-Vocal-Synthese, TTS & Vokoder. |
| X | samplerMONK | Granular-Synthese & Sample-Manipulation. |
| XI | stemMONK | KI-gestützte Echtzeit-Stem-Trennung. |
| XII | recordingMONK | Finaler Capture & Mastering-Export. |
| XIII | biblioMONK | Semantischer File-Explorer & Asset-Datenbank. |
| XIV | eqMONK | Parametrischer EQ, Frequenz-Shaping. |
| XV | dspMONK | Phasenkorrektur, Dynamische Filter. |
| XVI | masteringMONK | Limiter, Soft-Knee-Kompression, LUFS-Metering. |

### Architektur-Vertiefungen
* `ARCHITECTURE.md` – lineare Signalfluss-Architektur
* `ARCH_WEBRTC.md` – Kollaboration und Kontrollpfade
* `ARCH_DIG_ANA_BRIDGE.md` – 10-Kanal-Spatial-Audio-Bridge mit Edge-DSP, Failover und Netzwerkpfaden

---

## ☁️ Infrastruktur & Integration
Sample Monk ist vollständig in das Google Cloud Ecosystem integriert:

### 1. Firebase (Frontend & Daten)
*   **Hosting:** Statische Assets und Single-Page Application.
*   **Firestore:** Datenbank für Preset-Metadaten, User-Sessions und Routing-Konfigurationen.
*   **Storage (GCS):** Speicherung von WAV-Samples und generierten Vocal-Takes.
*   **Auth:** Firebase Authentication für User-Management und Workspace-Sicherheit.

### 2. Google Cloud Platform (Backend & AI)
*   **Cloud Run:** Bereitstellung des Node.js/Python-Backends (via Docker-Container).
*   **Cloud Build:** Automatisierte CI/CD-Pipeline.
*   **Secret Manager:** Sichere Verwaltung von API-Keys (Gemini AI, HuggingFace).

---

## 🔌 API-Referenz
Das Backend stellt eine REST-API bereit, die zur Erweiterung des Systems genutzt werden kann:

*   `POST /api/generate-preset`: Generiert Synthesizer-Presets via Gemini AI.
*   `POST /api/import-zip`: Importiert Sample-Packs (Cloud-Background-Processing).
*   `GET /api/samples`: Listet Assets aus Firestore und lokaler Bibliothek auf.
*   `POST /api/huggingface/generate`: Generiert Audio mittels MusicGen/HuggingFace.

---

## 🚀 Entwicklung & Start

### Lokale Entwicklung
```bash
# 1. Backend-Dependencies
cd services/backend-core && npm install

# 2. Main App Start (Vite Dev Server)
npm run dev
```

### Deployment
Für Deployment-Updates in der Cloud:
```bash
# 1. Firebase Deploy
firebase deploy --only hosting,firestore,storage

# 2. Backend Build & Deploy (Cloud Run)
gcloud builds submit --tag gcr.io/sample-monk/audio-backend
gcloud run deploy audio-backend --image gcr.io/sample-monk/audio-backend --platform managed --region europe-west1
```

---

## ⚖️ Copyright & Branding
**audioMONASTRY** by **monkMONASTRY**
*(inspiriert vom PRAIN Cluster; alle Rechte AnunnakiTools 2026 by Patrick Hilf)*

****
