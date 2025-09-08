#!/usr/bin/env bash
set -euo pipefail

# ========= helpers =========
log() { printf "[%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
err() { printf "[%s] ERROR: %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }
die() {
  err "$*"
  exit 1
}
req() { : "${!1:?Environment variable "$1" must be set}"; }

# ========= required env =========
req IMAGE_REGISTRY
req GITHUB_REPOSITORY
req IMAGE_TAG
req COMPOSE_PROFILES
req VAULT_ADDR
req VAULT_ROLE_ID
req VAULT_SECRET_ID

# Optional: GHCR auth
: "${GHCR_USER:="${GITHUB_ACTOR:-}"}"
: "${GHCR_TOKEN:="${GHCR_RO_TOKEN:-}"}"

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

# ========= sanity: docker present =========
command -v docker >/dev/null 2>&1 || die "docker not installed"
docker version >/dev/null 2>&1 || die "docker daemon not responding"

# ========= login to GHCR (best-effort) =========
if [ -n "${GHCR_TOKEN}" ]; then
  log "Logging into ghcr.io as ${GHCR_USER:-<none>}"
  docker login ghcr.io -u "${GHCR_USER:-}" -p "${GHCR_TOKEN}" >/dev/null 2>&1 ||
    log "Warning: GHCR login failed (continuing)"
fi

# ========= export image/env for compose =========
export IMAGE_REGISTRY
export GITHUB_REPOSITORY
export IMAGE_TAG
export VAULT_ADDR
export VAULT_ROLE_ID
export VAULT_SECRET_ID

# ========= validate compose resolves to services =========
log "Rendering compose config…"
if ! $COMPOSE config >/tmp/compose.yml 2>/dev/null; then
  die "Failed to render docker compose config"
fi
if ! grep -q '^services:' /tmp/compose.yml; then
  die "No services resolved for COMPOSE_PROFILES='${COMPOSE_PROFILES}'"
fi

# ========= pull + up =========
log "Pulling images…"
$COMPOSE pull

log "Starting/updating services…"
$COMPOSE up -d --remove-orphans

# ========= basic health checks =========
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

# pgbouncer ping (if enabled)
if $COMPOSE ps pgbouncer >/dev/null 2>&1; then
  # best-effort: check process alive inside container
  check_cmd "pgbouncer alive" docker exec "$($COMPOSE ps -q pgbouncer)" sh -lc 'pgrep -x pgbouncer'
fi

# ========= logout & done =========
if [ -n "${GHCR_TOKEN}" ]; then
  docker logout ghcr.io >/dev/null 2>&1 || true
fi

$health_ok || die "One or more health checks failed"
log "Deploy complete ✅"
