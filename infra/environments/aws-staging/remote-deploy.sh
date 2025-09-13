#!/usr/bin/env bash
set -euo pipefail

log() { printf "[%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
err() { printf "[%s] ERROR: %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }
die() {
  err "$*"
  exit 1
}
req() { : "${!1:?Environment variable "$1" must be set}"; }

req IMAGE_REGISTRY
req GITHUB_REPOSITORY
req IMAGE_TAG
req COMPOSE_PROFILES
req VAULT_ADDR
req VAULT_ROLE_ID
req VAULT_SECRET_ID
req VAULT_ENV

# If a token is provided but no user, default to GitHub App's username convention.
GHCR_TOKEN="${GHCR_TOKEN:-${GHCR_RO_TOKEN:-}}"
GHCR_USER="${GHCR_USER:-}"
if [[ -n "${GHCR_TOKEN}" && -z "${GHCR_USER}" ]]; then
  GHCR_USER="x-access-token"
fi

ROOT="/opt/phyt"
COMPOSE="docker compose" # force v2 syntax
export COMPOSE_PROFILES

log "Starting remote deploy"
log "Working dir: ${ROOT}"
log "Profiles: ${COMPOSE_PROFILES}"
log "Repo: ${GITHUB_REPOSITORY}"
log "Tag: ${IMAGE_TAG}"

[ -d "$ROOT" ] || die "Directory ${ROOT} not found"
cd "$ROOT"

command -v docker >/dev/null 2>&1 || die "docker not installed"
docker version >/dev/null 2>&1 || die "docker daemon not responding"

if [[ -n "${GHCR_TOKEN}" ]]; then
  log "Logging into ghcr.io as ${GHCR_USER}"
  # Use password-stdin to avoid token in argv/history
  if ! echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin >/dev/null 2>&1; then
    log "Warning: GHCR login failed (continuing)"
  fi
else
  log "No GHCR_TOKEN provided; pulls for private images may fail"
fi

export IMAGE_REGISTRY
export GITHUB_REPOSITORY
export IMAGE_TAG
export VAULT_ADDR
export VAULT_ROLE_ID
export VAULT_SECRET_ID
export VAULT_ENV

log "Rendering compose config…"
# Prefer v2 output flag if available
if $COMPOSE config -o /tmp/compose.yml >/dev/null 2>&1; then
  :
else
  # Fallback for older compose: redirect stdout
  $COMPOSE config >/tmp/compose.yml 2>/dev/null || die "Failed to render docker compose config"
fi

grep -q '^services:' /tmp/compose.yml || die "No services resolved for COMPOSE_PROFILES='${COMPOSE_PROFILES}'"

log "Pulling images…"
$COMPOSE pull

log "Starting/updating services…"
$COMPOSE up -d --remove-orphans

health_ok=true

check_url() {
  local name="$1" url="$2"
  if curl -fsS --max-time 5 "$url" >/dev/null; then
    log "Health OK: ${name} (${url})"
  else
    err "Health FAIL: ${name} (${url})"
    health_ok=false
  fi
}

check_cmd() {
  local name="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    log "Health OK: ${name}"
  else
    err "Health FAIL: ${name}"
    health_ok=false
  fi
}

# nginx (if enabled)
if $COMPOSE ps nginx >/dev/null 2>&1; then
  check_url "nginx" "http://127.0.0.1:8080/nginx-health"
fi

# hono-api (if enabled)
if $COMPOSE ps hono-api >/dev/null 2>&1; then
  check_url "hono-api" "http://127.0.0.1:8000/health"
fi

# redis ping (if enabled)
if $COMPOSE ps redis >/dev/null 2>&1; then
  check_cmd "redis ping" docker exec "$($COMPOSE ps -q redis)" redis-cli -h 127.0.0.1 ping
fi

if [[ -n "${GHCR_TOKEN}" ]]; then
  docker logout ghcr.io >/dev/null 2>&1 || true
fi

$health_ok || die "One or more health checks failed"
log "Deploy complete ✅"
