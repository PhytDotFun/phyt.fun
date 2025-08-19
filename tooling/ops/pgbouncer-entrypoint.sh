#!/bin/sh
set -e
export WAIT_FOR_SECRET_FILE="${WAIT_FOR_SECRET_FILE:-/vault/secrets/pgbouncer.ini}"
/usr/local/bin/wait-for-secrets.sh sh -c '
  exec /usr/bin/pgbouncer /etc/pgbouncer/pgbouncer.ini
'
