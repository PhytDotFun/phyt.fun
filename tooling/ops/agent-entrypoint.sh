#!/bin/sh
set -e

# Allow address to come from agent.hcl; don't hard-require env var
# (agent.hcl already contains 'address', so we don't exit if VAULT_ADDR is unset)

# Ensure tmpfs dirs exist & are private
mkdir -p /vault/credentials
chmod 0700 /vault/credentials

# EDIT: Accept AppRole via env and materialize ephemeral files in tmpfs
[ -n "$VAULT_ROLE_ID" ] && printf "%s" "$VAULT_ROLE_ID" >/vault/credentials/role_id
[ -n "$VAULT_SECRET_ID" ] && printf "%s" "$VAULT_SECRET_ID" >/vault/credentials/secret_id

# verify /vault/secrets is tmpfs using /proc/mounts (less brittle than grep)
if ! awk '($2=="/vault/secrets" && $3=="tmpfs"){f=1} END{exit (f?0:1)}' /proc/mounts; then
    echo "ERROR: /vault/secrets is not mounted as tmpfs!"
    exit 1
fi

exec vault agent -config=/vault/config/agent.hcl
