#!/usr/bin/env sh
set -euo pipefail

# Ensure directories
mkdir -p /vault/secrets /vault/credentials
chmod 0775 /vault/secrets /vault/credentials
chown root:root /vault/secrets /vault/credentials || true

# If a wrapped SecretID is provided, unwrap and write to /vault/credentials/secret-id
if [ "${VAULT_WRAPPED_SECRET_ID:-}" != "" ]; then
  echo "Unwrapping VAULT_WRAPPED_SECRET_ID into /vault/credentials/secret-id"
  vault unwrap -field=secret_id "$VAULT_WRAPPED_SECRET_ID" > /vault/credentials/secret-id
  chmod 0600 /vault/credentials/secret-id
fi

# If role-id file missing and VAULT_ROLE_ID is provided, write it
if [ ! -s /vault/credentials/role-id ] && [ "${VAULT_ROLE_ID:-}" != "" ]; then
  echo "Writing VAULT_ROLE_ID into /vault/credentials/role-id"
  printf "%s" "$VAULT_ROLE_ID" > /vault/credentials/role-id
  chmod 0600 /vault/credentials/role-id
fi

echo "Starting Vault Agent..."
exec vault agent -config=/vault/config/agent.hcl


