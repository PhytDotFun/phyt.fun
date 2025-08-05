#!/bin/sh
set -e

SECRETS_FILE_PATH=$1
shift

echo "Development Entrypoint: Waiting for secrets at ${SECRETS_FILE_PATH}..."
until [ -f "${SECRETS_FILE_PATH}" ]; do
  sleep 2
done
echo "Development Entrypoint: Secrets file found."

echo "Development Entrypoint: Sourcing secrets..."
set -a
. "${SECRETS_FILE_PATH}"
set +a

echo "Development Entrypoint: Executing command: $@"
exec "$@"