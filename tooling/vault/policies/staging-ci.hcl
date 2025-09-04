# Cloudflare token + IDs for provider/modules
path "secret/data/cloudflare/staging" { capabilities = ["read"] }

# AWS deployment keys consumed by TF/module
path "secret/data/aws/staging/approle" { capabilities = ["read"] }

# Tailscale auth key for instance bootstrap
path "secret/data/tailscale/staging" { capabilities = ["read"] }

# Allow TF to read vendor secrets for staging
path "secret/data/hono-api/staging" { capabilities = ["read"] }
path "secret/data/workers/staging" { capabilities = ["read"] }
path "secret/data/web/staging" { capabilities = ["read"] }

# Tiny self-introspection
path "auth/token/lookup-self" { capabilities = ["read"] }
path "sys/capabilities-self" { capabilities = ["update"] }

# CI must mint AppRole creds for staging-<sha>
path "auth/approle/role/staging-*/role-id" { capabilities = ["read"] }
path "auth/approle/role/staging-*/secret-id" { capabilities = ["update"] }

# Allow CI to create child tokens
path "auth/token/create" { capabilities = ["update"] }
