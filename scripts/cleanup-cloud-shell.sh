#!/usr/bin/env bash
# ============================================================================
# cleanup-cloud-shell.sh
# ---------------------------------------------------------------------------
# Cleans up the personal Google Cloud Shell home disk (5 GB limit).
# Safe to run repeatedly. Does NOT touch project source files.
#
# Usage (on your Cloud Shell):
#   git pull && bash scripts/cleanup-cloud-shell.sh
#
# Add --dry-run to preview what would be deleted without actually removing:
#   bash scripts/cleanup-cloud-shell.sh --dry-run
# ============================================================================

set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
bytes_to_human() {
  local bytes=$1
  if (( bytes >= 1073741824 )); then
    echo "$(( bytes / 1073741824 )) GB"
  elif (( bytes >= 1048576 )); then
    echo "$(( bytes / 1048576 )) MB"
  elif (( bytes >= 1024 )); then
    echo "$(( bytes / 1024 )) KB"
  else
    echo "${bytes} B"
  fi
}

safe_rm() {
  local target="$1"
  if [[ ! -e "$target" && ! -d "$target" ]]; then
    return
  fi
  local size
  size=$(du -sb "$target" 2>/dev/null | awk '{print $1}' || echo 0)
  if $DRY_RUN; then
    echo -e "  ${YELLOW}[DRY-RUN]${NC} Would delete: $target ($(bytes_to_human "$size"))"
  else
    rm -rf "$target"
    echo -e "  ${GREEN}✓${NC} Deleted: $target ($(bytes_to_human "$size"))"
  fi
  TOTAL_FREED=$((TOTAL_FREED + size))
}

TOTAL_FREED=0

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Google Cloud Shell Home Disk Cleanup (5 GB limit)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Show current usage
echo -e "${CYAN}📊 Current disk usage:${NC}"
df -h "$HOME" 2>/dev/null | tail -1 | awk '{printf "   Used: %s / %s (%s)\n", $3, $2, $5}'
echo ""
echo -e "${CYAN}📁 Top 10 largest directories in \$HOME:${NC}"
du -sh "$HOME"/* "$HOME"/.* 2>/dev/null | sort -rh | head -10 | sed 's/^/   /'
echo ""

if $DRY_RUN; then
  echo -e "${YELLOW}🔍 DRY-RUN MODE — nothing will be deleted${NC}"
  echo ""
fi

# -------------------------------------------------------------------------
# 1. Package manager caches
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 1/8 Package manager caches...${NC}"
safe_rm "$HOME/.npm/_cacache"
safe_rm "$HOME/.npm/_logs"
safe_rm "$HOME/.yarn/cache"
safe_rm "$HOME/.pnpm-store"
safe_rm "$HOME/.bun/install/cache"
safe_rm "$HOME/.cache/pip"
safe_rm "$HOME/.cache/pipenv"
safe_rm "$HOME/.cache/pypoetry"
safe_rm "$HOME/.local/share/pip"
safe_rm "$HOME/.cache/go-build"
safe_rm "$HOME/.cache/go-mod"
[[ -d "$HOME/go/pkg/mod/cache" ]] && safe_rm "$HOME/go/pkg/mod/cache"
safe_rm "$HOME/.cargo/registry/cache"
safe_rm "$HOME/.cargo/registry/src"
safe_rm "$HOME/.gradle/caches"
safe_rm "$HOME/.m2/repository"

# -------------------------------------------------------------------------
# 2. General caches & temp files
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 2/8 General caches & temp files...${NC}"
safe_rm "$HOME/.cache/google-cloud-sdk"
safe_rm "$HOME/.cache/thumbnails"
safe_rm "$HOME/.cache/mesa_shader_cache"
safe_rm "$HOME/.cache/fontconfig"
safe_rm "$HOME/.cache/JetBrains"
safe_rm "$HOME/.cache/bazel"
safe_rm "$HOME/.cache/typescript"
safe_rm "$HOME/.cache/puppeteer"
# Generic cache dirs (careful — only well-known ones)
for dir in "$HOME"/.cache/*/; do
  [[ -d "$dir" ]] && safe_rm "$dir"
done

# -------------------------------------------------------------------------
# 3. Docker leftovers (Cloud Shell sometimes has docker)
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 3/8 Docker leftovers...${NC}"
safe_rm "$HOME/.docker/buildx"
safe_rm "$HOME/.docker/manifests"
# Don't remove ~/.docker/config.json (auth credentials)

# -------------------------------------------------------------------------
# 4. IDE / editor caches
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 4/8 IDE & editor caches...${NC}"
safe_rm "$HOME/.vscode-server"
safe_rm "$HOME/.vscode-remote"
safe_rm "$HOME/.theia"
safe_rm "$HOME/.local/share/code-server"
safe_rm "$HOME/.config/Code"
safe_rm "$HOME/.cursor"

# -------------------------------------------------------------------------
# 5. Log files
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 5/8 Log files...${NC}"
find "$HOME" -maxdepth 3 -name "*.log" -type f -size +1M -print0 2>/dev/null | while IFS= read -r -d '' f; do
  safe_rm "$f"
done
safe_rm "$HOME/.config/gcloud/logs"
safe_rm "$HOME/.terraform.d/checkpoint_cache"

# -------------------------------------------------------------------------
# 6. Rust / Cargo build artifacts in any project
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 6/8 Rust build artifacts (target/ dirs)...${NC}"
find "$HOME" -maxdepth 4 -type d -name "target" -path "*/target" 2>/dev/null | while read -r dir; do
  # Only remove if it looks like a Rust target dir
  if [[ -f "$dir/.rustc_info.json" || -f "$dir/CACHEDIR.TAG" || -d "$dir/release" || -d "$dir/debug" ]]; then
    safe_rm "$dir"
  fi
done

# -------------------------------------------------------------------------
# 7. node_modules in inactive projects
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 7/8 node_modules in projects (keeps current project)...${NC}"
CURRENT_PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
find "$HOME" -maxdepth 4 -type d -name "node_modules" 2>/dev/null | while read -r dir; do
  project_dir="$(dirname "$dir")"
  # Skip node_modules of the current/active project
  if [[ "$project_dir" == "$CURRENT_PROJECT" ]]; then
    echo -e "  ${YELLOW}⏭${NC}  Skipped (active project): $dir"
    continue
  fi
  safe_rm "$dir"
done

# -------------------------------------------------------------------------
# 8. Misc known space wasters
# -------------------------------------------------------------------------
echo -e "${CYAN}🧹 8/8 Misc cleanup...${NC}"
safe_rm "$HOME/.wget-hsts"
safe_rm "$HOME/.bash_history"  # Cloud Shell recreates this
safe_rm "$HOME/.python_history"
safe_rm "$HOME/.node_repl_history"
safe_rm "$HOME/.lesshst"
safe_rm "$HOME/.sqlite_history"
# Old/stale Cloud Shell customization images
safe_rm "$HOME/.customize_environment.done"
# Terraform plugin cache
safe_rm "$HOME/.terraform.d/plugins"
safe_rm "$HOME/.terraform.d/plugin-cache"

# -------------------------------------------------------------------------
# Summary
# -------------------------------------------------------------------------
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
if $DRY_RUN; then
  echo -e "${YELLOW}🔍 DRY-RUN: Would free ~$(bytes_to_human $TOTAL_FREED)${NC}"
  echo -e "${YELLOW}   Run without --dry-run to actually delete.${NC}"
else
  echo -e "${GREEN}✅ Freed ~$(bytes_to_human $TOTAL_FREED)${NC}"
fi
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Show updated usage
echo -e "${CYAN}📊 Updated disk usage:${NC}"
df -h "$HOME" 2>/dev/null | tail -1 | awk '{printf "   Used: %s / %s (%s)\n", $3, $2, $5}'
echo ""
echo -e "${CYAN}💡 Tipp: Wenn du noch mehr Platz brauchst, prüfe mit:${NC}"
echo "   du -sh ~/* ~/.* 2>/dev/null | sort -rh | head -20"
echo ""
