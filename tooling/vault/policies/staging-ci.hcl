# Read Cloudflare + Tailscale for Terraform/UD
path "secret/data/staging/cloudflare" { capabilities = ["read"] }
path "secret/data/staging/tailscale" { capabilities = ["read"] }

# Read Postgres for database provisioning
path "secret/data/staging/postgres" { capabilities = ["read"] }

# (Optional) CI can list under staging/ for basic discovery
path "secret/metadata/staging" { capabilities = ["list"] }
path "secret/metadata/staging/*" { capabilities = ["list"] }

# Minimal self-introspection for CI
path "auth/token/lookup-self" { capabilities = ["read"] }
path "sys/capabilities-self" { capabilities = ["update"] }

# CI must mint SecretID for the RUNTIME approle (single static role)
# Name the runtime role: staging-app
path "auth/approle/role/staging-app/role-id" { capabilities = ["read"] }
path "auth/approle/role/staging-app/secret-id" { capabilities = ["update"] }

# Allow CI to create child tokens
path "auth/token/create" { capabilities = ["update"] }
