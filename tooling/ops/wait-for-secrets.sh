#!/bin/sh
set -e

FILE="${WAIT_FOR_SECRET_FILE:-}"

if [ -z "$FILE" ]; then
    echo "WAIT_FOR_SECRET_FILE not set"
    exit 1
fi

t=0
while [ ! -f "$FILE" ]; do
    if [ $t -ge 60 ]; then
        echo "Timeout waiting for $FILE"
        exit 1
    fi
    sleep 1
    t=$((t + 1))
done

case "$FILE" in
*.env)
    set -a
    # shellcheck disable=SC1090
    . "$FILE"
    set +a
    ;;
esac

exec "$@"
