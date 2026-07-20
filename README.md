# Sample-Monk Audio Ecosystem - Final Production Blueprint

## 1. System Architektur
Das System ist in zwei Ebenen getrennt:
* **Produktions-Ecosystem (Studio-Core):** MasterEngine (Audio), 16 Plugins (DSP, Instrumente, KI-Module), Mischpult (Routing-Matrix 1+4 Bus).
* **Monitoring-Endpunkt (Live-Player):** Entkoppelte Instanz zur hochqualitativen Live-Ausgabe (Master-Mix).

## 2. Audio-Matrix & Routing (1+4 Bus)
Die `MasterEngine` verwaltet 5 dedizierte Busse:
1. `GLOBAL_MASTER` (Main-Out Endstufe)
2. `USER_1` - `USER_4` (Dedizierte Hardware-Mains für User-Kopfhörer/Monitore)

Die Routing-Konfiguration erfolgt via `/public/data/routing.json`.

## 3. High-Speed Sync (UDP)
Alle Komponenten synchronisieren ihre Audio-Worklets via UDP-Broadcast (Port 9000).

## 4. Deployment
Starten des gesamten Systems (Production Build):
```bash
docker compose up --build -d
```
Der Webplayer ist unter `https://sample-monk.web.app/monitor` erreichbar.
Die Studio-Instanz ist unter `https://sample-monk.web.app` verfügbar.
EOF
