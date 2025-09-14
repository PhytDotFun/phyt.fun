#!/bin/sh
set -eu

log() { printf '%s\n' "[wait-for-secrets] $*"; }
getenv() { eval "printf '%s' \"\${$1-}\""; } # POSIX-safe "indirect"
mask() {
  n=$(printf '%s' "$1" | wc -c | tr -d ' ')
  printf '%*s' "$n" '' | tr ' ' '*'
}

FILE="${WAIT_FOR_SECRET_FILE:-}"
TIMEOUT="${WAIT_FOR_SECRET_TIMEOUT:-180}"
DEBUG_MASKED="${DEBUG_MASKED:-0}" # set to 1 to print masked vars on success

[ -n "$FILE" ] || {
  log "WAIT_FOR_SECRET_FILE not set"
  exit 1
}

log "Waiting for ${FILE} to exist and be non-empty (timeout ${TIMEOUT}s)..."
t=0
while [ ! -s "$FILE" ]; do
  if [ "$t" -ge "$TIMEOUT" ]; then
    log "Timeout; file missing or empty: ${FILE}"
    exit 1
  fi
  sleep 1
  t=$((t + 1))
done
log "Found: ${FILE}"

# Normalize & sanitize (no content echoed on failure paths)
tmpfile="$(mktemp)"
# remove CR, convert NBSP to space, trim trailing spaces, drop comments/blank
tr -d '\r' <"$FILE" |
  tr '\302\240' ' ' |
  sed -e 's/[[:space:]]*$//' |
  awk 'NF && $0 !~ /^[[:space:]]*#/ { print }' >"$tmpfile"

# Validate KEY names & presence of '=' without echoing values
if ! awk -F= '{
  if (NF<2) {bad=1; next}
  key=$1
  gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)
  if (key !~ /^[A-Za-z_][A-Za-z0-9_]*$/) bad=1
} END {exit bad?1:0}' "$tmpfile"; then
  log "Invalid env format (must be KEY=VALUE with valid KEY names)."
  rm -f "$tmpfile"
  exit 1
fi

# Export variables
set -a
# shellcheck disable=SC1090
. "$tmpfile"
set +a
rm -f "$tmpfile"

# Required vars (no content printed on failure)
for k in POSTGRES_PASSWORD; do
  v="$(getenv "$k")"
  [ -n "$v" ] || {
    log "Required var $k is empty or unset."
    exit 1
  }
done

# Optional masked debug (only on success, only if enabled)
if [ "$DEBUG_MASKED" = "1" ]; then
  u="$(getenv POSTGRES_USER)"
  [ -n "$u" ] && log "POSTGRES_USER=$(mask "$u")"
  d="$(getenv POSTGRES_DB)"
  [ -n "$d" ] && log "POSTGRES_DB=$(mask "$d")"
  p="$(getenv POSTGRES_PASSWORD)"
  [ -n "$p" ] && log "POSTGRES_PASSWORD=$(mask "$p")"
fi

# Hand off to Postgres entrypoint
exec "$@"
