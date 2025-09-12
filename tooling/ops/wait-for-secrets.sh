#!/bin/sh
set -e

FILE="${WAIT_FOR_SECRET_FILE:-}"
TIMEOUT="${WAIT_FOR_SECRET_TIMEOUT:-120}"

if [ -z "$FILE" ]; then
  echo "WAIT_FOR_SECRET_FILE not set"
  exit 1
fi

t=0
while [ ! -s "$FILE" ]; do
  if [ "$t" -ge "$TIMEOUT" ]; then
    echo "Timeout waiting for $FILE to become non-empty"
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
