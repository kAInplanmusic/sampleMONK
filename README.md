# Sample-Monk Audio Ecosystem

High-End Audio-Produktionsumgebung, basierend auf einer verteilten Micro-Plugin-Architektur.

## 1. System Architektur
Das System besteht aus einem zentralen Hub und 16 autarken Plugin-Containern.

*   **Synchronisation:** UDP-Broadcast (OSC-Protokoll) über Port 9000.
*   **Asset-Management:** Zentrales Asset-Repository unter `/public/wam/` und `/public/data/`.
*   **Audio-Engine:** MasterEngine verwaltet AudioBuffer und prozedurale Synthese bei 48kHz/24bit.

## 2. Plugin-Verzeichnis (Blueprint)
Alle Plugins folgen dem `Plugin`-Interface in `src/plugins/`:

1. **instrumente**: Host für 65 akustische/hybride Instrumente.
2. **sequenzer**: Taktgeber (BPM/Swing/Grid).
3. **mischpult**: 5-Kanal Matrix mit Monitor/Master-Routing.
4. **mastering-tool**: LUFS-Normalisierung & Limiter.
5. **voice-generator**: Vertex AI-basierte Text-to-Speech Engine.
6. **dsp-engine**: Spektrale Dynamik-Anpassung.
7. **fx-engine**: Modulations-Effekte.
8. **spatial-surround**: 3D-Panning-Engine.
9. **drum-synths**: Prozedurale Percussion-Synthese.
10. **recorder**: Input-Staging & Normalisierung.
11. **midi-controller**: Hardware-CC-Mapping.
12. **custom-slot**: Dynamische Plugin-Container.
13. **extension-slot**: Host-Erweiterungen.
14. **equalizer**: Frequenz-Contouring.
15. **sample-bibliothek**: Asset-Index-Management.
16. **stem-extractor**: KI-Source-Separation.

## 3. Pro-Plugin-Interface
Jedes Plugin implementiert das folgende Interface für maximale Stabilität:

```typescript
export interface Plugin {
  config: { id: string, name: string, colorScheme: string };
  init(ctx: AudioContext): void;
  handleClock(timestamp: number): void; // Sync via UDP-Master-Clock
  updateState(newState: PluginState): void;
}
```

## 4. Deployment
Starten des gesamten Stacks:
```bash
docker compose up --build -d
```
EOF
