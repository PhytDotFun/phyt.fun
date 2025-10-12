#!/bin/sh
set -eu

log() { printf "[WAIT-FOR-SECRETS] [%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }

ENV_FILE="${ENV_PATH:-}"          # primary env file path (used by app + wait)
WAIT_EXTRAS="${ENV_WAIT_FILES:-}" # optional extra files to wait on
TIMEOUT="${WAIT_FOR_SECRET_TIMEOUT:-180}"

[ "${WAIT_FOR_SECRET_SKIP:-0}" = "1" ] && {
	log "SKIP enabled"
	exec "$@"
}
[ -n "$ENV_FILE" ] || {
	log "ENV_PATH not set"
	exit 1
}

FILES="$(printf '%s %s' "$ENV_FILE" "$WAIT_EXTRAS" | tr ',:' ' ' | awk 'NF')"

log "Waiting for: $FILES (timeout ${TIMEOUT}s)"
t=0
while :; do
	all_ready=1
	for f in $FILES; do [ -s "$f" ] || {
		all_ready=0
		missing="$f"
		break
	}; done
	[ "$all_ready" -eq 1 ] && break
	[ "$t" -lt "$TIMEOUT" ] || {
		log "Timeout; missing or empty: $missing"
		exit 1
	}
	sleep 1
	t=$((t + 1))
done

log "Secrets present."
exec "$@"
