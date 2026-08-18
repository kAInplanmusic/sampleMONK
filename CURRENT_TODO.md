# sampleMONK – Aktueller Arbeitsstatus (CURRENT_TODO)

## Fortschritt (aus TODOLAST.md / Professionalization)

✅ #1 Semantische Suche · ✅ #2 TURN/STUN · ✅ #3 Celery-Lazy-Load · ✅ #4 Ollama
✅ #5 Voice-Synthese · ✅ #9 EQ-Realsteuerung · ✅ #8 CRDT-Sync · ✅ #7 OPFS-Load
✅ #11 stem-ai Service

### ✅ #11 stem-ai Service (separater Demucs-Container) — FERTIG
- Neu `services/stem-ai/{main.py, requirements.txt}`: FastAPI-Demucs-Service mit
  GPU-Detect, Lazy-Loading (htdemucs), liefert 5 Stems (vocals/lows/mids/highs/melody).
- `docker-compose.yml`: Service `stem-ai` mit healthcheck + AI_DEVICE env.
- `server.ts`: `/api/separate-stems` proxied multipart-Upload an STEM_AI_URL,
  wenn ENABLE_STEMS=1 + STEM_AI_URL gesetzt; sonst bestehender CLI-Fallback.

## GECOMMITTET (Branch main)
1af327a Stufe-1(P1-5) · f9624ea P9-EQ · a3e82cc P8-CRDT · 84ecee3 P7-OPFS
Nächste Commits: P11 stem-ai (uncommitted)

## Offen (aus TODOLAST.md)
#6 WASM-DSP (braucht wasm-pack/Rust) · #10 Spatial-10ch · #12 Mediasoup
#13 RBAC/Audit · #14 Instrumenten-Bibliothek

## Tooling-Hinweis
Robuste Dateiänderung: Terminal-heredoc bzw. python-Inserter (edit-Tools
unter langen Inhalten unzuverlässig).
