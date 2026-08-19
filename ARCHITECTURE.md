# audioMONASTRY Signal Chain Architecture

Die Architektur folgt einem strikten, linearen Signalfluss von der Quelle bis zur finalen Archivierung/Ausgabe.

## Signalfluss-Diagramm

1. **Quellen & Produktion (Input Stage)**
   - `biblioMONK` (Assets & Files)
   - `instrumentMONK`, `drumMONK`, `synthesizerMONK`, `samplerMONK`, `voiceMONK`, `stemMONK` (Generierung & Extraktion)
   - `sequencerMONK` & `controllerMONK` (Steuerung & Arrangement)

2. **Summierung (Mix Stage)**
   - `mixerMONK` (Summierung auf Stereo-Master)

3. **Bearbeitungs-Kette (Processing Stage)**
   - `eqMONK` (Frequenz-Shaping)
   - `dspMONK` (Phasenkorrektur & Dynamische Filter)
   - `masteringMONK` (Finales Dynamik-Processing / Limiter)

4. Ausgabe, Aufnahme & Raum (Output Stage)
   - `masteringMONK` (XVI) (Letzte Bearbeitung)
   - `recordingMONK` (XII) (Finaler Capture des Master-Outputs)
   - `spatialMONK` (IV) (Parallel/Nachgelagert: 10.0 Spatial-Audio Raumverteilung)
   - `Live Web Master Out` (Streaming-Interface)

## Vertiefende Referenz

Für die geplante digitale/analoge Interface-Bridge zwischen App, Edge-DSP, Cluster-Failover und 10-Kanal-Ausgangsstufe siehe `ARCH_DIG_ANA_BRIDGE.md`.
