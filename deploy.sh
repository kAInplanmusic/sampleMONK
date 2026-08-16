#!/usr/bin/env bash
# ============================================================================
# deploy.sh – sampleMONK auf Hetzner deployen (Google/Firebase-frei)
# ----------------------------------------------------------------------------
# Automatisiert den kompletten Deployment-Prozess auf eine Hetzner-Instanz:
#   1. Abhaengigkeiten installieren (falls noetig)
#   2. Produktions-Build erzeugen
#   3. Build auf die Ziel-Instanz kopieren (rsync/ssh)
#   4. Remote starten (entweder Docker oder direkt via Node)
#
# Voraussetzungen:
#   - Ausfuellebar machen:  chmod +x deploy.sh
#   - Ziel definieren via env (alternativ in ein .env.deploy gestellt):
#        DEPLOY_HOST=root@1.2.3.4
#        DEPLOY_SSH_KEY=/pfad/zum/key
#        DEPLOY_MODE=node|docker        (Voreinstellung: node)
#        DEPLOY_REMOTE_DIR=/opt/samplemonk
#
#   - Auf der Ziel-Instanz einmalig:
#        cp .env.hetzner.example .env   && .env befuellen
# ============================================================================
set -euo pipefail

# --- Konfiguration (aus env, sonst Prompt) ---
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"
DEPLOY_MODE="${DEPLOY_MODE:-node}"
DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/opt/samplemonk}"

if [[ -z "$DEPLOY_HOST" ]]; then
  echo -n "Ziel-Host (user@host): "
  read -r DEPLOY_HOST
fi
if [[ -z "$DEPLOY_SSH_KEY" ]]; then
  echo -n "Pfad zum SSH-Key (leer fuer ~/.ssh/id_ed25519): "
  read -r DEPLOY_SSH_KEY
  DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519}"
fi

SSH=(ssh -i "$DEPLOY_SSH_KEY" -o StrictHostKeyChecking=accept-new)
SCP_OPTS=(-i "$DEPLOY_SSH_KEY" -o StrictHostKeyChecking=accept-new)

echo "=== [1/4] Abhaengigkeiten & Build ==="
npm install
npm run build

echo "=== [2/4] Remote-Verzeichnis vorbereiten ($DEPLOY_HOST:$DEPLOY_REMOTE_DIR) ==="
"${SSH[@]}" "$DEPLOY_HOST" "mkdir -p $DEPLOY_REMOTE_DIR"

echo "=== [3/4] Build hochladen (rsync) ==="
rsync -az --delete -e "${SSH[*]}" \
  ./dist ./package.json ./package-lock.json ./services ./scripts \
  ./Dockerfile.hetzner ./docker-compose.hetzner.yml \
  "$DEPLOY_HOST:$DEPLOY_REMOTE_DIR/" 2>/dev/null || \
  { echo "rsync fehlt? Versuche scp-Fallback..."; \
    "${SSH[@]}" "$DEPLOY_HOST" "rm -rf $DEPLOY_REMOTE_DIR/dist"; \
    scp "${SCP_OPTS[@]}" -r ./dist "$DEPLOY_HOST:$DEPLOY_REMOTE_DIR/"; }

echo "=== [4/4] Remote starten (Modus: $DEPLOY_MODE) ==="
if [[ "$DEPLOY_MODE" == "docker" ]]; then
  "${SSH[@]}" "$DEPLOY_HOST" "cd $DEPLOY_REMOTE_DIR && \
     cp -n .env.hetzner.example .env 2>/dev/null || true; \
     docker compose -f docker-compose.hetzner.yml up -d --build"
else
  "${SSH[@]}" "$DEPLOY_HOST" "cd $DEPLOY_REMOTE_DIR && \
     cp -n .env.hetzner.example .env 2>/dev/null || true; \
     bash scripts/hetzner/start-prod.sh"
fi

echo ""
echo "✅ Deployment abgeschlossen: https://$DEPLOY_HOST"
echo "   (Konfiguration: .env; optional Auto-Shutdown: bash scripts/hetzner/install-idle-shutdown.sh)"
