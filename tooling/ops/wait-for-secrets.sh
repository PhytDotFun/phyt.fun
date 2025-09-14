#!/bin/sh
set -eu

log() { printf '%s\n' "[wait-for-secrets] $*"; }
mask() {
  n=$(printf '%s' "$1" | wc -c | tr -d ' ')
  [ "$n" -gt 0 ] && printf '%*s' "$n" '' | tr ' ' '*'
}
getenv() { eval "printf '%s' \"\${$1-}\""; }

FILES_RAW="${WAIT_FOR_SECRET_FILE:-}"
TIMEOUT="${WAIT_FOR_SECRET_TIMEOUT:-180}"
DEBUG_MASKED="${DEBUG_MASKED:-0}"
DEBUG_VARS="${DEBUG_VARS:-}"

[ -n "$FILES_RAW" ] || {
  log "WAIT_FOR_SECRET_FILE not set"
  exit 1
}

# colon/comma → space
FILES=$(printf '%s' "$FILES_RAW" | tr ',:' ' ' | awk 'NF {print}')
DBG_LIST=$(printf '%s' "$DEBUG_VARS" | tr ',:' ' ' | awk 'NF {print}')

log "Waiting for secret file(s): $FILES (timeout ${TIMEOUT}s)"
t=0
while :; do
  all_ready=1
  for f in $FILES; do
    if [ ! -s "$f" ]; then
      all_ready=0
      break
    fi
  done
  [ "$all_ready" -eq 1 ] && break
  if [ "$t" -ge "$TIMEOUT" ]; then
    log "Timeout; missing or empty: $f"
    exit 1
  fi
  sleep 1
  t=$((t + 1))
done
log "All secret files present."

# sanitize & source
sanitize() {
  tr -d '\r' <"$1" |
    tr '\302\240' ' ' |
    sed -e 's/[[:space:]]*$//' |
    awk 'NF && $0 !~ /^[[:space:]]*#/ { print }'
}

set -a
for f in $FILES; do
  tmpf="$(mktemp)"
  sanitize "$f" >"$tmpf"
  # shellcheck disable=SC1090
  . "$tmpf"
  rm -f "$tmpf"
done
set +a

# optional masked debug
if [ "$DEBUG_MASKED" = "1" ] && [ -n "$DBG_LIST" ]; then
  for k in $DBG_LIST; do
    v="$(getenv "$k")"
    [ -n "$v" ] && log "$k=$(mask "$v")"
  done
fi

exec "$@"
