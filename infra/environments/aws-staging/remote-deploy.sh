#!/usr/bin/env bash
set -euo pipefail

log() { printf "[%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
err() { printf "[%s] ERROR: %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }
die() {
  err "$*"
  exit 1
}

req() { : "${!1:?Environment variable "$1" must be set}"; }

# Required environment variables
req IMAGE_REGISTRY
req GITHUB_REPOSITORY
req IMAGE_TAG
req COMPOSE_PROFILES
req VAULT_ADDR
req VAULT_ROLE_ID
req VAULT_SECRET_ID
req VAULT_ENV

ROOT="/opt/phyt"
COMPOSE="docker compose" # force v2 syntax

export COMPOSE_PROFILES
export IMAGE_REGISTRY
export GITHUB_REPOSITORY
export IMAGE_TAG
export VAULT_ADDR
export VAULT_ROLE_ID
export VAULT_SECRET_ID
export VAULT_ENV

log "Starting remote deploy"
log "Working dir: ${ROOT}"
log "Profiles: ${COMPOSE_PROFILES}"
log "Repo: ${GITHUB_REPOSITORY}"
log "Tag: ${IMAGE_TAG}"

# Validate environment
[ -d "$ROOT" ] || die "Directory ${ROOT} not found"
cd "$ROOT"

command -v docker >/dev/null 2>&1 || die "docker not installed"
docker version >/dev/null 2>&1 || die "docker daemon not responding"

# Validate compose configuration
log "Rendering compose config…"
$COMPOSE config -o /tmp/compose.yml >/dev/null || die "Failed to render docker config"

# Pull latest images
log "Pulling images…"
$COMPOSE pull

# Stop existing services cleanly
log "Stopping existing services…"
$COMPOSE down --remove-orphans

# Start services
log "Starting services…"
$COMPOSE up -d --remove-orphans

# Clean up GHCR login
if [[ -n "${GHCR_TOKEN}" ]]; then
  docker logout ghcr.io >/dev/null 2>&1 || true
fi

log "Deploy complete - services started"
log "Use 'docker compose ps' and 'docker compose logs <service>' to monitor health"
