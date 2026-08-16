#!/usr/bin/env bash
# sampleMONK Hetzner idle check. Runs every CHECK_INTERVAL minutes.
set -uo pipefail
LOG="${LOG:-/var/log/samplemonk-idle-shutdown.log}"
STATE_FILE="${STATE_FILE:-/run/samplemonk-idle-count}"
IDLE_MINUTES="${IDLE_MINUTES:-30}"
CHECK_INTERVAL="${CHECK_INTERVAL:-5}"
IDLE_CYCLES=$(( IDLE_MINUTES / CHECK_INTERVAL ))
ts() { date -u +%FT%TZ; }

HTTP_ACTIVE=$(ss -tn state established '( sport = :8080 )' 2>/dev/null | grep -c 8080 || true)
SSH_SESSIONS=$(who 2>/dev/null | grep -c pts/ || true)
LOAD1=$(cut -d' ' -f1 /proc/loadavg 2>/dev/null | cut -d'.' -f1 || echo 0)

echo "[idle-check] $(ts)  HTTP=$HTTP_ACTIVE SSH=$SSH_SESSIONS LOAD1=$LOAD1" >> "$LOG"

if [[ "$HTTP_ACTIVE" -gt 0 || "$SSH_SESSIONS" -gt 0 || "${LOAD1:-0}" -ge 1 ]]; then
  echo "0" > "$STATE_FILE"
  exit 0
fi

CURRENT=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
NEXT=$(( CURRENT + 1 ))
echo "$NEXT" > "$STATE_FILE"

if [[ "$NEXT" -ge "$IDLE_CYCLES" ]]; then
  echo "[idle-check] $(ts)  ** IDLE - shutting down **" >> "$LOG"
  shutdown -h now "sampleMONK: idle shutdown after ${IDLE_MINUTES} min"
fi
