#!/bin/sh
set -e

# Get vault address from env (set by Docker or systemd)
if [ -z "$VAULT_ADDR" ]; then
    echo "ERROR: VAULT_ADDR env var not set!"
    exit 1
fi

# Verify tmpfs mount
if ! mount | grep -q "/vault/secrets type tmpfs"; then
    echo "ERROR: /vault/secrets is not mounted as tmpfs!"
    exit 1
fi

# Wait for Vault agent upstream to be reachable via the agent listener’s health endpoint after start
# (Just start agent; healthcheck is handled by container healthcheck)
exec vault agent -config=/vault/config/agent.hcl
