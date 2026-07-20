# WebRTC High-Performance Audio Blueprint (sampleMONK)

## Ziel
Transformation der `sampleMONK` Plattform in ein High-Speed-Audio-Produktions-Monster mit <10ms Latenz und professioneller Audio-Qualität für bis zu 4 User gleichzeitig.

## 1. Architektur-Änderungen (Signaling & Transport)
- **Alt:** HTTP/REST (API) + WebSocket (Monitor).
- **Neu:** 
    - **Signaling Server:** Node.js + Socket.io zur Initialisierung der WebRTC-Peer-Verbindungen.
    - **Control Plane:** WebRTC DataChannels (für alle Plugin-Parameter-Änderungen/State-Sync).
    - **Audio Plane:** WebRTC MediaStreamTracks (für Echtzeit-Audio-Übertragung mit dem Opus-Codec).
    - **SFU (Selective Forwarding Unit):** Zentraler Node (Media Server), der Audio-Streams von den 4 Usern empfängt, mischt (DSP-Server) und an die User zurücksendet.

## 2. Hardware & Skalierung
- **Client-Side:** browser-native Web Audio Worklets für lokale DSP (keine Latenz bei der Eingabe).
- **Server-Side (SFU/Mixer):**
    - Phase 1: Leistungsstarker Cloud-Node (CPU-fokussiert für Audio-Mixing).
    - Phase 2: GPU-Computing-Integration (C++/Rust für massiv parallele DSP-Algorithmen via WebAssembly, optional Hardware-beschleunigt in der Cloud).

## 3. Protokoll-Standardisierung
- **Daten:** JSON (für Parameter), Protobuf (optional, falls JSON zu schwerfällig wird).
- **Audio:** PCM (lokal), Opus (WebRTC-Übertragung).

## 4. Implementierungsphasen
1. **Signaling:** Austausch des REST-Backends durch einen WebRTC-Signaling-Server.
2. **DataChannel:** Integration des WebRTC-Control-Buses zur Parameter-Synchronisation.
3. **MediaStream:** Implementierung des bidirektionalen Audio-Streamings.
4. **Server-Mixing:** Aufbau der SFU/Mixer-Instanz für die 4-User-Kollaboration.
