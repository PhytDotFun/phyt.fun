#!/bin/sh
set -e

log() {
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] $*"
}

error() {
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] ERROR: $*" >&2
  exit 1
}

log "Starting Vault Agent initialization"

# Verify required environment variables
[ -z "$VAULT_ROLE_ID" ] && error "VAULT_ROLE_ID is required"
[ -z "$VAULT_SECRET_ID" ] && error "VAULT_SECRET_ID is required"

# Use VAULT_ADDR if set, otherwise fall back to config file
if [ -n "$VAULT_ADDR" ]; then
  log "Using VAULT_ADDR: $VAULT_ADDR"

  # Test Vault connectivity
  log "Testing Vault connectivity..."
  if ! curl -s --max-time 10 --fail "$VAULT_ADDR/v1/sys/health" >/dev/null; then
    error "Cannot reach Vault at $VAULT_ADDR"
  fi
  log "Vault connectivity OK"
else
  log "No VAULT_ADDR set, using config file address"
fi

# Ensure credential directories exist with proper permissions
log "Setting up credential directories"
mkdir -p /vault/credentials
chmod 0700 /vault/credentials

# Write AppRole credentials to files
log "Writing AppRole credentials"
printf "%s" "$VAULT_ROLE_ID" >/vault/credentials/role_id
printf "%s" "$VAULT_SECRET_ID" >/vault/credentials/secret_id
chmod 0600 /vault/credentials/role_id /vault/credentials/secret_id

# Verify tmpfs mount
log "Verifying tmpfs mount for secrets"
if ! awk '($2=="/vault/secrets" && $3=="tmpfs"){f=1} END{exit (f?0:1)}' /proc/mounts; then
  error "/vault/secrets is not mounted as tmpfs!"
fi
log "tmpfs mount verified"

# Verify template files exist
log "Checking template files"
for template in hono-api postgres workers pgbouncer; do
  if [ ! -f "/vault/templates/${template}.ctmpl" ]; then
    error "Template file /vault/templates/${template}.ctmpl not found"
  fi
done
log "All template files found"

log "Starting Vault Agent"
exec vault agent -config=/vault/config/agent.hcl
