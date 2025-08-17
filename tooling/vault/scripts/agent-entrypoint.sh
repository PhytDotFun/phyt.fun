#!/bin/sh
set -e

# Get vault address from env (set by Docker or systemd)
if [ -z "$VAULT_ADDR" ]; then
    echo "ERROR: VAULT_ADDR env var not set!"
    exit 1
fi

# Replace placeholders
sed -i "s|VAULT_ADDR_PLACEHOLDER|${VAULT_ADDR}|g" /vault/config/agent.hcl
sed -i "s|DEPLOYMENT_ID|${DEPLOYMENT_ID:-staging}|g" /vault/templates/*.tpl

# Verify tmpfs mount
if ! mount | grep -q "/vault/secrets type tmpfs"; then
    echo "ERROR: /vault/secrets is not mounted as tmpfs!"
    echo "Secrets will be written to disk - this is a security risk!"
    exit 1
fi

# Wait for vault
until vault status 2>/dev/null; do
    echo "Waiting for Vault at ${VAULT_ADDR}..."
    sleep 2
done

# Start agent - creds will be consumed and tokens will expire
exec vault agent -config=/vault/config/agent.hcl
