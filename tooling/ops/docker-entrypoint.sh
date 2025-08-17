#!/bin/sh
set -e

FILE="${WAIT_FOR_SECRET_FILE:-}"
TIMEOUT="${WAIT_FOR_SECRET_TIMEOUT:-60}"

# Wait for secret file
if [ -n "$FILE" ]; then
    echo "Waiting for secrets at $FILE..."
    i=0
    while [ ! -f "$FILE" ]; do
        if [ "$i" -ge "$TIMEOUT" ]; then
            echo "ERROR: Timeout waiting for secrets at $FILE" >&2
            exit 1
        fi
        sleep 1
        i=$((i + 1))
    done
    echo "Secrets found; exporting ..."
    set -a
    # shellcheck source=/dev/null
    . "$FILE"
    set +a
fi

exec "$@"
