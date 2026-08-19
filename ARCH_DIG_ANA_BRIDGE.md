# Dig/Ana & App/Intf Bridge

Forschungsbericht und Umsetzungsleitfaden für ein netzwerkbasiertes, adaptives 10-Kanal-Spatial-Audio-Interface mit 360°-Bewegung, Edge-DSP, klickfreiem Failover und niedriger Latenz.

## Zielbild

- 10 unabhängige Spatial-Audio-Kanäle
- 360°-Bewegung über Vektor-/Metadaten statt Raw-Audio-Steuerung
- Edge-basierte DSP-Verarbeitung mit Standby-Failover
- adaptive Netzwerkpfade über 5G, Wi‑Fi 6E oder Ethernet
- digitale und analoge Bridge zwischen App, Cluster und Ausgangsstufe

## Kernerkenntnisse

### DSP: Hardware vs. Software

| Hardware-DSP | Software-DSP |
| :--- | :--- |
| dedizierter Chip / SIP-Block | Firmware, Plugin oder Standalone-Service |
| deterministische Latenz im Mikrosekundenbereich | CPU- und OS-abhängige Latenz |
| kein Betriebssystem-Overhead | flexibler aktualisierbar |
| ideal für Live-Echtzeit | ideal für schnelle Iteration |

### Relevante Technologiebausteine

- **Cloud-/Virtual-DSP:** gut für Skalierung, aber für Live-Audio nur mit Edge-Unterstützung sinnvoll
- **Audio over IP:** Dante und AVB bleiben Referenzpfade für professionelle Integration
- **Embedded Audio:** Raspberry-Pi-Cluster eignet sich als Edge- und Failover-Plattform
- **Multiplexer:** MAX4617 für analoge Failover-Umschaltung, CS8416 für digitalen S/PDIF-Pfad
- **5G/Edge-AI:** reduziert Bandbreite, wenn die App nur Bewegungsdaten und Audio-Metadaten sendet

## Empfohlene Zielarchitektur

Die App bleibt Orchestrator für Bewegungsvektoren, Routing-Status und Session-Logik. Die zeitsensible Berechnung läuft am Edge.

```text
┌─────────────────────────────────────────────────────────────────┐
│                   APP / SPATIAL AUDIO ENGINE                   │
│            sendet Vektoren, Panning, BPM, Key, Status          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ 5G / Wi‑Fi 6E / Ethernet
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│           EDGE GATEWAY (Pi 5 / vergleichbare Edge-Node)        │
│     Empfang, Health-Monitoring, Routing, Failover-Steuerung    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Pi-Cluster    │ │ Pi-Cluster    │ │ Pi-Cluster    │
│ Master        │ │ Standby 1     │ │ Standby 2     │
│ DSP + KI      │ │ DSP + KI      │ │ DSP + KI      │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        └─────────────────┼─────────────────┘
                          │ I2S / S/PDIF
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│        MULTIPLEXER-MATRIX (MAX4617 x2 + CS8416 optional)       │
│   analoges Failover, digitaler Bridge-Pfad, Heartbeat-Switch   │
└─────────────────────────┬───────────────────────────────────────┘
                          ▼
                  10 Verstärker / 10 Lautsprecher
```

## Rollen der Komponenten

### 1. App / Interface Bridge

- sendet **Bewegungsvektoren statt rohem Audio**
- hält Session-, Plugin- und Mehrnutzerstatus synchron
- triggert Routing- und Failover-Zustände
- bleibt kompatibel zur bestehenden `spatialMONK`- und `dspMONK`-Topologie

### 2. Edge Gateway

- nimmt Metadaten aus der App an
- überwacht Heartbeats aller Cluster-Knoten
- schaltet bei Ausfall auf Standby-Knoten um
- priorisiert den aktiven Master-Pfad zur Wahrung der Phasenstabilität

### 3. Cluster-Knoten

- berechnen Spatial-DSP in Echtzeit
- können eine leichte KI-Prädiktion für die nächsten Millisekunden verwenden
- arbeiten parallel, aber nur **ein** Master wird zur Ausgangsstufe durchgeschaltet

### 4. Multiplexer-/Digital-Analog-Bridge

- **MAX4617 #1:** Kanäle 1–8
- **MAX4617 #2:** Kanäle 9–10 plus Reserve
- **CS8416:** optionaler digitaler S/PDIF-/DAW-Pfad
- GPIO-Heartbeat erlaubt ultraschnelles Umschalten ohne hörbaren Klick

## Latenz- und Bandbreitenmodell

### Simulationsannahmen

- 48 kHz Sample-Rate
- 64 Samples Blockgröße (~1,33 ms)
- Edge-DSP < 1 ms pro Block
- Multiplexer-Umschaltung < 100 ns

### Worst-Case-Pfad

```text
App → 5G (8 ms) → Gateway (0,5 ms) → Cluster (1 ms)
→ Multiplexer (0,0001 ms) → Verstärker (0,5 ms) → Lautsprecher (0,5 ms)
= ~10,5 ms Gesamtlatenz
```

### Bewertung

- **Spatial-Playback:** praktikabel
- **Live-Instrumente:** nur mit aggressiver Puffer- und Blockoptimierung empfehlenswert
- **Metadaten statt Raw Audio:** spart massiv Bandbreite und stützt das adaptive Netzwerkmodell

## Failover-Prinzip

1. Heartbeat des Masters fällt aus
2. Gateway erkennt den Ausfall innerhalb des Kontrollfensters
3. Multiplexer schaltet auf Standby-Pfad um
4. Nur ein aktiver Pfad bleibt hörbar, wodurch Klicks und Phasensummen vermieden werden

## Umsetzung in audioMONASTRY

### Bestehende Anknüpfungspunkte

- `src/components/SpatialPluginTerminal.tsx`
- `src/components/DSPTerminal.tsx`
- `src/utils/spatialMath.ts`
- `src/utils/ClockSync.ts`
- `src/utils/LatencyMonitor.ts`
- `src/context/PluginManagerContext.tsx`

### Architekturregeln für die Umsetzung

- keine zusätzliche Latenz vor `masteringMONK`
- 4-User-State-Sync und Plugin-Locking bleiben unverändert
- Standby-Knoten dürfen nicht parallel summiert werden
- Netzwerkpfade bleiben adaptiv, Audio-Pfade deterministisch

## Umsetzungsphasen

1. **Hardware-Aufbau:** Edge-Gateway, Cluster, MUX, Verstärker, Lautsprecher
2. **Cluster-Konfiguration:** Echtzeit-Kernel, Clock-Sync, Heartbeats, DSP-Workers
3. **Bridge-Logik:** Routing, Failover, S/PDIF-/Analogpfade
4. **App-Integration:** Vektorsteuerung, Monitoring, Cluster-Status, adaptive Pfadwahl
5. **Validierung:** Einzelkanäle, Umschaltverhalten, Latenzmessung, Mehrnutzer-Sync

## Fazit

Für audioMONASTRY ist ein **hybrides Edge-/Cluster-/MUX-System** die realistischste Zielarchitektur für ein netzwerkbasiertes 10-Kanal-Spatial-Audio-Interface. Es verbindet App-gesteuerte Spatial-Metadaten, ausfallsichere DSP-Pfade und eine digitale/analoge Bridge, ohne die zentrale Anforderung an niedrige Latenz, Master-Priorität und kollaborative Echtzeit-Synchronisation aufzugeben.
