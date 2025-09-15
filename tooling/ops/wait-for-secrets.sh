#!/bin/sh
set -eu

log() { printf '%s\n' "[wait-for-secrets] $*"; }

ORIG_ARGS="$@"

FILES_RAW="${WAIT_FOR_SECRET_FILE:-}"
TIMEOUT="${WAIT_FOR_SECRET_TIMEOUT:-180}"

[ -n "$FILES_RAW" ] || {
  log "WAIT_FOR_SECRET_FILE not set"
  exit 1
}

# colon/comma → space
FILES=$(printf '%s' "$FILES_RAW" | tr ',:' ' ' | awk 'NF {print}')

log "Waiting for secret file(s): $FILES (timeout ${TIMEOUT}s)"
t=0
while :; do
  all_ready=1
  for f in $FILES; do
    [ -s "$f" ] || {
      all_ready=0
      break
    }
  done
  [ "$all_ready" -eq 1 ] && break
  [ "$t" -lt "$TIMEOUT" ] || {
    log "Timeout; missing or empty: $f"
    exit 1
  }
  sleep 1
  t=$((t + 1))
done
log "All secret files present."

# strict sanitize
sanitize() {
  tr -d '\r' <"$1" |
    tr '\302\240' ' ' |          # NBSP → space
    sed -e 's/[[:space:]]*$//' | # trim right
    awk '
      /^[[:space:]]*#/ { next }            # skip comments
      /^[[:space:]]*$/ { next }            # skip blank
      {
        line = $0
        sub(/^[[:space:]]*export[[:space:]]+/, "", line)
        gsub(/[[:space:]]*=[[:space:]]*/, "=", line)
        if (line ~ /^[A-Za-z_][A-Za-z0-9_]*=/) {
          print line
        }
        # else: ignore junk lines
      }
    '
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

# never clobber CMD: restore original args; fallback if empty
if [ -z "$ORIG_ARGS" ]; then
  set -- node dist/index.js
else
  # restore exactly what Docker passed
  # shellcheck disable=SC2086
  set -- $ORIG_ARGS
fi

exec "$@"
