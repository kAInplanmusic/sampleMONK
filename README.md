# 🎛️ audioMONASTRY — Pro Audio Workstation für bis zu 4 Personen

**audioMONASTRY** (vormals *sampleMONK*) ist eine kollaborative, objektbasierte Audio-Workstation (OBA). Sie ist konzipiert als hochmodulares **16‑Modul‑System** für Echtzeit‑Musikproduktion, Live‑DJ‑Setups und Sound‑Engineering. Das System kombiniert KI‑gestützte Generierung, physikalisches Audio‑Routing, Spatial‑Audio und eine Low‑Latency‑Kollaborationsschicht für **bis zu 4 gleichzeitig aktive Benutzer**.

> **Google/firebase-frei:** Der gesamte Stack läuft in **einem Node-Prozess** (static App + REST‑API + WebRTC‑Signaling). Kein Firestore, kein GCS, keine Google‑Cloud‑AI. Optional wird ein selbstgehostetes Ollama‑LLM verwendet.

---

## 📘 Inhaltsverzeichnis

1. [Überblick & Architektur](#🚀-überblick--architektur)
2. [Das "Orchestra"-Prinzip & Low-Latency-Mandat](#🎼-das-orchestra-prinzip--low-latency-mandat)
3. [Dienste (Services)](#🖥️-dienste-services)
4. [Die 16 Plugins im Detail](#🧩-die-16-plugins-im-detail)
5. [Datenformat & Persistenz](#💾-datenformat--persistenz)
6. [Programmierung & Signalpfade](#⚙️-programmierung--signalpfade)
7. [REST-API-Referenz](#🔌-rest-api-referenz)
8. [WebRTC-Signaling & Kollaboration](#🤝-webrtc-signaling--kollaboration)
9. [RBAC & Audit-Logging](#🛡️-rbac--audit-logging)
10. [Deployment](#🚢-deployment)
11. [Projekt-Skripte](#🛠️-projekt-skripte)
12. [Konfiguration per Umgebungsvariablen](#⚙️-konfiguration-per-umgebungsvariablen)

---

## 🚀 Überblick & Architektur

| Ebene | Technologie | Aufgabe |
| :--- | :--- | :--- |
| **Frontend** | React + TypeScript + Vite + Tailwind CSS | Einheitliche Stream-Screen-Arbeitsfläche (Icon-Leiste oben, Workspace unten) |
| **Audio-Engine (Main Sound)** | Tone.js + Web Audio (AudioWorklets) | Kompiliert/mixt/rendert das finale Master-Signal, unter 10 ms Latenz-Ziel |
| **Backend "Orchestra"** | Node.js + Express + `tsx` | State-Synchronisation, REST-API, Rollen, Plugin-Lock (B2B) |
| **Signaling** | Socket.io (`/webrtc-signaling`) | WebRTC-Offer/Answer/ICE für Echtzeit-Kollaboration |
| **Datenhaltung** | localStorage / IndexedDB / Dateisystem | Presets, Sessions, Samples, Audit-Log |

**Struktur:**
```
services/          # Optional isolierte Dienste (funktional entkoppelt)
  backend-core/    # Node+Python Backend-Kern, Session & Asset Schemas
  library-ai/      # Semantische Sample-Suche / Embedding
  master-player/   # Master-Abspielpfad
  mixer/           # Mischpult-Service
  signaling/       # Standalone-Signaling (Express + Socket.io)
  stem-ai/         # Stem-Trennung (Demucs-artig)
  turn/            # TURN-Server-Konfig
src/
  audio/           # worklets, dsp-engine
  components/      # Terminals (UI der 16 Plugins), Layouts, Dialoge
  config/          # runtime, feature-flags, webrtc, midi, rbac-roles
  context/         # ModuleState, PluginManager, AudioContext
  data/            # Standard-Samples-Metadaten
  hooks/           # useHID, useRoom, useAudioAI, etc.
  plugins/         # registry.ts + Modul-Basis (PluginBase, types)
  utils/           # audioEngine, db, rbac, collab, AuditLogger, webrtc, …
server.ts          # Einstiegspunkt: App + API + Signaling + Worklets
```

**Start-Screen → Workspace:** Beim Betreten lädt `server.ts` + `audioEngine` einen vorkonfigurierten Tech‑Preset (synthetische Drums), sodass **Play sofort Musik liefert** — ohne dass Sample‑Dateien vorliegen müssen.

---

## 🎼 Das "Orchestra"-Prinzip & Low-Latency-Mandat

1. **Der Backend-Orchestrator** verwaltet State, Routing, Synchronisation und Multi-User-Eingaben.
2. **Der Main Sound** (Audio-Engine) lebt im Core und produziert/kompiliert das finale Master-Signal.
3. **Plugins** sind entkoppelte Module mit standardisierter Schnittstelle (`PluginBase`, `registry.ts`); die Engine interessiert sich nicht für den internen Stack eines Plugins.
4. **B2B-Lock (Busy Mode):** Sobald ein Benutzer ein Plugin bedient, wird es für die anderen 3 Benutzer gesperrt (UI gedimmt). Diese können nur die lokale Ansicht (Icon/Terminal) toggeln, keine Parameter ändern.
5. **4 identische Screens:** Jeder Benutzer sieht in Echtzeit eine 100 % identische Haupt-UI.

**Latency-Regel:** Alle Routing-Entscheidungen, Pakete und Buffer-Berechnungen zielen auf **sub‑Millisekunden**. Der **Mastering-Tool**-Knoten hat höchste Priorität; Latenz-Akkumulation über Plugins ist eine kritische Fehlbedingung.

---

## 🖥️ Dienste (Services)

Die Dienste unter `services/` sind optional isoliert betreibbare Teile der Orchestra-Architektur. Die App funktioniert aber auch ohne sie (lokal eingebettet).

| Dienst | Technologie | Aufgabe |
| :--- | :--- | :--- |
| **backend-core** | Node + Python | Session-/Asset-Schema, Kernlogik (siehe `SESSION_DB_SCHEMA.md`, `ASSET_DB_SCHEMA.md`) |
| **library-ai** | Node/Python | Semantische Suche über Samples, lokale Embeddings |
| **master-player** | Node | Master-Abspielpfad / Waveform |
| **mixer** | Node | Zentrales Routing- und Misch-Modul |
| **signaling** | Express + Socket.io | Standalone-WebRTC-Signaling (Fallback zu `server.ts`) |
| **stem-ai** | FastAPI/Demucs-artig | Echtzeit-Stem-Trennung (5 Stems) |
| **turn** | TURN-Server | NAT-Traversal für Peer-Verbindungen |

---

## 🧩 Die 16 Plugins im Detail

Alle Plugins nutzen die gemeinsame Registry (`src/plugins/registry.ts`) mit Komponenten-, Icon- und Metadaten-Mapping. Jede Anzeige kann `OFF`, `AUTO_AI` oder `PRO` sein.

| # | ID | Name | Funktion |
| :-: | :--- | :--- | :--- |
| 1 | `mixer` | **Mischpult (DJ-Mixer)** | 10‑Kanal-Pro-Mixer à la Pioneer-Hardware; Fader/Pan steuern echte Per-Kanal-Gains/Pans der AudioEngine; LUFS-Metering |
| 2 | `controller` | **MIDI-Controller** | Plug‑&-Play-Mapping für Standard-MIDI-Controller, Profil-Spiegelung |
| 3 | `sequencer` | **Sequenzer** | Touch-optimierter Step-Sequenzer, 16 Steps × 8 Tracks; lookahead-basiert, mit der AudioEngine synchronisiert |
| 4 | `spatial` | **Spatial Surround** | 2D/3D-Vektor-Panning-Array für mehrkanalige Ausgabe |
| 5 | `instrument` | **Instrumente** | 50+ akustische Instrumente (additiv per Oszillatoren) |
| 6 | `drum` | **Drum-Machine** | TR-808/909-artige Drums, leistungsstarke synthetische Kick/Hat/Clap |
| 7 | `effect` | **FX-Engine** | Multifx-Rack, hardware-artige Algorithmen (Worklet-basiert) |
| 8 | `synth` | **Synthesizer** | Subtraktiv/FM/Wavetable-Synthese (`synth-processor` Worklet) |
| 9 | `voice` | **KI-Vocalist** | TTS/Text-to-Sing; lokaler Web-Speech-Fallback |
| 10 | `visualizer` | **Vis/Beat-Waveform** | Wellenform-/Analyzer-Anzeige des Masters |
| 11 | `stem` | **Stem-Extractor** | Import & Aufteilung in Gesang/Lows/Mids/Highs/Melodie; Auto-Warp/BPM-Match |
| 12 | `recording` | **Recorder** | Capture & Mastering-Export |
| 13 | `library` | **Sample-/Sound-Bibliothek** | Zentrale Asset-Verwaltung; semantische Suche |
| 14 | `eq` | **Equalizer** | Parametrischer EQ, Frequenz-Shaping (an Audio-Kette verdrahtet) |
| 15 | `dsp` | **DSP-Engine** | Phasenkorrektur, dynamische Filter, Worklet-Verarbeitung |
| 16 | `mastering` | **Mastering-Tool** | Limiter, Soft-Knee-Kompressor, Multiband, LUFS — höchste Latenz-Priorität |

> **Konsolidierung (Metamodule):** Einige Module sind per `METAMODULE_GROUPS` zusammenführbar (z. B. `dsp + eq + effect` → primär `effect`), sodass nur ein Terminal gerendert wird, während die Funktionen erhalten bleiben.

---

## 💾 Datenformat & Persistenz

### Session-Zustand (localStorage + `ModuleStateContext`)
- Key: `audiomonastry_module_states`
- Form: `Record<ModulID, 'OFF' | 'AUTO_AI' | 'PRO'>`

### Session/User-Daten (`src/utils/collab.ts`)
- `audiomonastry_user_id` / `user_name` / `user_color` (localStorage)
- Session-Host: `SESSION_HOST_USER`

### Asset-Datenbank (`src/utils/db.ts`, IndexedDB `AudioMonastryDB`)
- ObjectStore `scratchpad` mit Key-Path `id`, Feld `lastModified`.
- `saveToDB(item)` / Load für Staging-Inhalte.

### Presets (`src/utils/firebase.ts`)
- Key `audiomonastry_local_presets` (localStorage) für benutzerdefinierte Presets.

### Audit-Log (`src/utils/AuditLogger.ts`)
- Key `audiomonastry_audit_log` (localStorage) — protokolliert Sicherheits-/Zugriffsereignisse.

### Sequenzer- und Preset-Datenformat (`src/presets.ts`, `src/types.ts`)
```ts
{
  id: string;        // z.B. "industrial"
  name: string;      // z.B. "Industrial Force"
  genre: string;
  bpm: number;       // z.B. 142
  key: string;       // z.B. "E Minor"
  description: string;
  patterns: {
    channel1: boolean[16]; // kick
    channel2: boolean[16]; // hat
    channel3: boolean[16]; // clap
    channel4..8: boolean[16]; // samples / lead
  };
  synthNotes: number[16]; // Tonhöhen-Index pro Step
  cutoff: number; resonance: number; delayTime: number; decay: number;
}
```

### AudioEngine-Patterns (`src/utils/audioEngine.ts`)
- `patterns: Record<TrackType, boolean[]>` → `channel1..channel8`.
- Rollen-Zuordnung: `TRACK_ROLE_MAP` (kick/hat/clap/bass/…).
- Drum-Synthese ohne Sample-Dateien (MembraneSynth, MetalSynth, NoiseSynth, MonoSynth).

---

## ⚙️ Programmierung & Signalpfade

### Audio-Kette (Master)
```
Per-Track-Synth/Sampler
   → channelGains[track]  (Tone.Volume)
   → channelPans[track]   (Tone.Panner)
   → GLOBAL_MASTER-Bus
   → masterMe… (Highpass → Compressor → Multiband → Limiter)
   → masterVolume → Destination (Output)
   → (paralleler Cue-Mix → MON1..4 für bis zu 4 Benutzer)
```

### Per-Kanal-APIs der AudioEngine
- `setChannelGain(track, gain01)`, `setChannelPan(track, pan)` — echte Knoten-Steuerung.
- `loadPatterns(patterns, synthNotes?, bpm?)` — lädt Sequenzer-Inhalte in die Engine.
- `ensureDemoPattern()` — liefert einen eingebauten Drum-Loop, falls keine Patterns gesetzt sind.
- `play()/stop()` — startet/stoppt Transport + Scheduler.
- Worklet-Clock (`clock-processor`) mit PLL-Drift-Kompensation für jitterfreien Takt.

### UI → Audio-Bindung (App.tsx)
- **Play-/Stop-Buttons** rufen `audioEngine.play()/stop()` und synchronisieren `isPlaying`.
- **Sequenzer-Toggles** rufen `audioEngine.loadPatterns(...)` → hörbar synchron.
- **Mischpult-Fader** rufen `setChannelGain`/`setChannelPan` pro Track.

---

## 🔌 REST-API-Referenz

Alle Endpunkte unter `/api` sind durch `express-rate-limit` (60 req/min pro IP) geschützt.

| Methode | Pfad | Funktion |
| :--- | :--- | :--- |
| GET | `/api/health` | Health-Check (`{ status: 'ok' }`) |
| POST | `/api/ai/compose` | Deterministischer lokaler Preset-Generator `{ prompt }` (kein externes LLM) |
| POST | `/api/ai/generate` | Ollama-gestützte KI-Komposition mit lokalem Fallback |
| POST | `/api/ai/describe` | Ollama-Text (max 2 Sätze), Fallback bei Nicht-Erreichbarkeit |
| POST | `/api/separate-stems` | SSE-Stem-Stream; bei `ENABLE_STEMS=1` Proxy an lokales `stem-ai` |
| POST | `/api/generate-voice` | Lokale Voice-Synthese; falls `VOICE_ENGINE`+`VOICE_CLI` gesetzt, sonst Web-Speech |

**Worklets-Serving:** `/worklets/*.js` werden explizit als `application/javascript` ausgeliefert (Dev: `public/worklets` + `dist/worklets`), damit AudioWorklets korrekt geladen werden.

---

## 🤝 WebRTC-Signaling & Kollaboration

- Pfad: `/webrtc-signaling` (Socket.io), Same-Origin in Dev & Prod.
- Events: `offer`, `answer`, `ice-candidate`, `activity`.
- Idle-Timeout (Default 20 min, steuerbar via `SIGNALING_IDLE_TIMEOUT_MS`): Client wird getrennt, wenn zu lange inaktiv.
- `ALLOWED_ORIGINS` (CSV) verhindern Cross-Origin-Zugriff; leer = nur Same-Origin.
- `WebRTCManager.ts` baut pro Peer eine `RTCPeerConnection` mit Data-Channel (`plugin-sync`) für State- und Clock-/Latency-Ping/Pong.

> **Mediasoup (optional):** `mediasoup`/`mediasoup-client` sind als Dependencies installiert (nativer `mediasoup-worker` via postinstall). Für eine SFU-Zentralisierung (anstatt Full-Mesh) kann ein Mediasoup-Router ergänzt werden — die Signaling-Achse ist bereits vorbereitet.

---

## 🛡️ RBAC & Audit-Logging

- **Rollen:** `admin` (3), `producer` (2), `engineer` (1), `guest` (0). Numerisch absteigende Rechte.
- `can(role, action)` prüft die Hierarchie; `roleForUser(userId, roomHostId)` ermittelt die Rolle (Host-Quellen aus `SESSION_HOST_USER` oder optionalem Storage).
- **Audit-Logger** (`AuditLogger.ts`) schreibt Berechtigungs-/Sicherheitsereignisse in den lokalen Audit-Log (localStorage).

---

## 🚢 Deployment

Ziel-Umgebung: **eigene Cloud-Instanz (z. B. Hetzner)**, stundenabgerechnet, ein Prozess pro Port.

```bash
# Produktions-Build (Vite + Worklets + Server-Bundle)
npm run build

# Produktions-Server starten (node dist/server.cjs)
PORT=8080 NODE_ENV=production node dist/server.cjs
# oder
npm run start

# Entwicklungsmodus (tsx server.ts, Hot-Reload)
npm run dev
```

- **Static-Delivery:** `dist/` wird ausgeliefert; SPA-Fallback auf `index.html`.
- **Optionaler Auto-Shutdown:** `scripts/hetzner/install-idle-shutdown.sh` stoppt die Instanz nach Inaktivität (Kostenschutz).

---

## 🛠️ Projekt-Skripte

| Skript | Befehl | Aktion |
| :--- | :--- | :--- |
| `dev` | `tsx server.ts` | Dev-Server (App + API + Signaling) |
| `build` | `vite build && node build-worklets.mjs && esbuild server.ts …` | Produktions-Build (Bundle + Worklets + `dist/server.cjs`) |
| `start` | `node dist/server.cjs` | Startet Produktions-Bundle |
| `worker` | `tsx services/taskWorker.ts` | Hintergrund-Task-Worker |
| `lint` | `tsc --noEmit` | TypeScript-Check (0 Fehler-Ziel) |
| `clean` | `rm -rf dist server.js` | Build-Artefakte löschen |

---

## ⚙️ Konfiguration per Umgebungsvariablen

| Variable | Default | Bedeutung |
| :--- | :--- | :--- |
| `PORT` | `8080` | HTTP-Port des Servers |
| `NODE_ENV` | — | `production` = static `dist/`, sonst Vite-Dev |
| `ENABLE_STEMS` | leer | `1` aktiviert den echten `stem-ai`-Proxy |
| `STEM_AI_URL` | `http://stem-ai:8000` | Adresse des Stem-AI-Service |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Lokales Ollama-LLM für KI-Generierung |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Ollama-Modell-Name |
| `VOICE_ENGINE` | leer | `rvc`/`vits` — lokaler Voice-CLI bevorzugt |
| `VOICE_CLI` | leer | Pfad zum Voice-Vorhersage-CLI |
| `SIGNALING_IDLE_TIMEOUT_MS` | `1200000` (20 min) | Idle-Timeout für Signaling-Clients |
| `SIGNALING_ALLOWED_ORIGINS` | leer | Erlaubte CORS-Origins (CSV), leer = Same-Origin |

---

## ✅ Status-Übersicht

- **TypeScript:** `tsc --noEmit` = **0 Fehler**; kein `--noUnusedLocals`-Rauschen.
- **Build:** `npm run build` bündelt Frontend, 8 Arbeitlets (Worklets) und `dist/server.cjs` fehlerfrei.
- **Hörbare Kernroute:** Play/Stop, Sequenzer-Toggles, Mischpult-Fader sind an die AudioEngine verdrahtet und liefern sofort synthetischen Drum-Sound.
- **Offen (Infrastruktur):** Mediasoup-SFU-Serverlogik (#12), WASM-DSP (#6), offener Erweiterungs-Slot (#13).

---

*Dokumentation für **audioMONASTRY**. Frühere Bezeichnung *sampleMONK* ist veraltet.*
