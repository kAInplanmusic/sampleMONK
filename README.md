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

## ☁️ Infrastruktur & Integration (Google/Firebase-frei)
Sample Monk läuft **ohne** Google Cloud / Firebase. Der gesamte Stack wird auf einer
eigenen Hetzner-Cloud-Instanz betrieben (stundenabgerechnet):

*   **Ein Prozess / ein Port:** App (static) + REST-API + WebRTC-Signaling via `server.ts`.
*   **Datenhaltung:** lokal (Dateisystem für Sample-Dateien, Browser localStorage/IndexedDB für Presets/Sessions) – kein Firestore, kein GCS.
*   **KI (optional):** selbstgehostetes lokales Ollama-LLM statt Gemini/HuggingFace/DeepSeek.
*   **Auto-Shutdown:** optionaler systemd-Timer (`scripts/hetzner/install-idle-shutdown.sh`) stoppt die Instanz nach Inaktivität, um Kosten zu sparen.

---

## 🔌 API-Referenz (Google-frei)
Das Backend stellt eine REST-API bereit (kein Google/Firebase):

*   `GET /api/health`: Health-Check.
*   `POST /api/ai/compose`: Lokaler, deterministischer Preset-Generator (kein externes LLM nötig).
*   `POST /api/separate-stems`: Stems-Stream (lokaler SSE-Stub, bei Bedarf an lokalen Demucs-Service anbindbar).
*   `POST /api/generate-voice`: lokaler Voice-Stub.

---

## 🚀 Entwicklung & Start

### Lokale Entwicklung
```bash
# 1. Backend-Dependencies
cd services/backend-core && npm install

# 2. Main App Start (Vite Dev Server)
npm run dev
```

### Deployment (Hetzner)
```bash
# Option A: Automatisiert via Skript
./deploy.sh          # baut + kopiert Build + startet remote

# Option B: Direkt auf der Instanz
cp .env.hetzner.example .env   # füllen
./scripts/hetzner/start-prod.sh
# oder
docker compose -f docker-compose.hetzner.yml up -d --build
```

Vollständige Anleitung siehe `.env.hetzner.example` und `scripts/hetzner/`.

---

## ⚖️ Copyright & Branding
**audioMONASTRY** by **monkMONASTRY**
*(inspiriert vom PRAIN Cluster; alle Rechte AnunnakiTools 2026 by Patrick Hilf)*

****

---

## ✨ Implementierungs-Highlights (Technical Refresh)

Dieses Repo enthält mehrere substanzielle Audio-/Backend-Verbesserungen, die parallel zu den Modulen eingebaut wurden:

- **AudioWorklet-DSP-Erweiterungen (T7–T12)**
  - `synthProcessor.ts` – PolyBLEP-Oszillator (Saw/Square/Triangle/Sine), ADSR-Hüllkurve + Moog-Ladder-Tiefpass im AudioWorklet.
  - `eqProcessor.ts` – 4-Band parametrischer EQ (HP/Lowshelf/Peaking/Highshelf, RBJ-Koeffizienten).
  - `dspProcessor.ts` – Phase-Tilt (Allpass) + Envelope-Follower-getriebenes dynamisches Filter + Soft-Clipper.
  - `masteringProcessor.ts` – Lookahead-Limiter (5 ms) + Soft-Knee-Kompression als AudioWorklet.
  - `effectProcessor.ts` – diffuser FDN-Reverb, Chorus/Flanger und Bitcrusher als Effekt-Worklet.
  - `clockProcessor.ts` – präziser AudioWorklet-Thread-Clock-Generator mit Swing/Gate (PLL-Drifts).

- **Audio-Engine (T2, T4, T8, T17, T20)**
  - Lookahead-Scheduler mit Swing/Gate und optionalem AudioWorklet-Clock-Quantizer.
  - 4 Monitor-/Cue-Busse (`MON1..MON4`) mit pro-Person-Track-Mix-Matrix und Rollen-Voreinstellungen.
  - Zipper-freie Fader via `setMixChannelParam` (`setTargetAtTime`).
  - HRTF-Berechnung für Kopfhörer-/Stereo-Cue (`calculateHRTF` → ITD/ILD).

- **Hetzner-Einzelcontainer-Deployment (environment)**
  - `Dockerfile.hetzner`, `docker-compose.hetzner.yml`, `scripts/hetzner/*`,
    `.env.hetzner.example` – gleiche Prozess liefert Frontend + REST + WebRTC-Signaling.
  - `server.ts` umfasst Socket.io-Signaling (defensive `await import`) + optionale Demucs-Stems (`ENABLE_STEMS=1`).

- **UX/Rollen & Daten**
  - `config/rolePresets.ts` – DJ / Producer / Engineer / STEM_Host Startprofile (Modul-Snapshots pro Rolle).
  - `utils/opfs.ts` + `SampleContext` – OPFS-Cache für aufgenommene Samples.
  - `utils/LocalEmbeddingProvider.ts` – reale lokale MiniLM-Embeddings (transformers.js) mit deterministischem Hash-Fallback.
  - `MIDI` Auto-Erkennung + Hotplug + generische Canvas-Skin-Engine.

Weitere Details: `MASTER_TODO.md`, `ARCHITECTURE.md`, `ARCH_WEBRTC.md`.
