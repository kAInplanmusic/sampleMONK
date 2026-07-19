# Sample-Monk Audio Ecosystem

High-End Audio-Produktionsumgebung, basierend auf einer verteilten Micro-Plugin-Architektur.

## 1. System Architektur
Das System ist strikt in zwei Einheiten getrennt:
* **Produktions-Ecosystem (Hub + Plugins):** Zuständig für Sound-Generierung, Sequencing, DSP und Mixing. 
* **Web-Audio-Player (Monitoring):** Eine vollständig entkoppelte Instanz. Sie empfängt den finalen Master-Output (10.1 / 8.1) und validiert ausschließlich die OS-seitige Hardware-Konfiguration, bevor sie den Live-Stream ausgibt. Sie hat keine Steuerungsfunktion über das Ecosystem.

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

## 4. Audio Quick-Start Guide (Monitoring Endpunkt)
Der Webplayer validiert beim Start, ob dein OS die nötigen Kanäle bereitstellt:
1. **OS-Ebene:** Konfiguriere dein Audio-Interface/HDMI-Ausgang im Betriebssystem auf 8 oder 10 Kanäle.
2. **Web-Player:** Beim Start der App, rufe `checkAudioSystem()` aus `src/utils/audioDiagnostics.ts` in der Konsole auf, um die Kanalkonfiguration zu verifizieren.
3. **LFE-Modus:** Das Spatial-Plugin leitet das LFE-Signal (Kanal 9/11) transparent durch. Die Endstufe/der DSP muss die LFE-Übergangsfrequenz (Crossover) verarbeiten.

### Diagnose
```javascript
import { checkAudioSystem } from './utils/audioDiagnostics';
checkAudioSystem();
```
Falls "WARNUNG: System unterstützt weniger als 8 Kanäle" erscheint, ist die OS-Konfiguration fehlerhaft.

## 5. Deployment
Starten des gesamten Stacks:
```bash
docker compose up --build -d
```

