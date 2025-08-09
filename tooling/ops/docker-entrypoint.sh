#!/bin/sh

set -eu

: "${WAIT_FOR_SECRET_FILE:?WAIT_FOR_SECRET_FILE must be set}"

echo "Entrypoint: Waiting for secrets file at $WAIT_FOR_SECRET_FILE..."
while [ ! -s "$WAIT_FOR_SECRET_FILE" ]; do sleep 0.2; done
echo "Entrypoint: Secrets file found."

set -a
. "$WAIT_FOR_SECRET_FILE"
set +a

echo "Entrypoint: Executing: $*"
exec "$@"