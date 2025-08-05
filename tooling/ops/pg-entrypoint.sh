#!/bin/sh
set -e

SECRETS_FILE="/vault/secrets/postgres.env"

echo "PostgreSQL Entrypoint: Waiting for secrets file at ${SECRETS_FILE}..."
until [ -f "${SECRETS_FILE}" ]; do
  sleep 2
done
echo "PostgreSQL Entrypoint: Secrets file found."

echo "PostgreSQL Entrypoint: Sourcing secrets..."
set -a
. "${SECRETS_FILE}"
set +a

echo "PostgreSQL Entrypoint: Starting PostgreSQL..."
exec "$@"