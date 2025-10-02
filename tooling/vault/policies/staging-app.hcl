# Allow Vault Agent to read runtime secrets
path "secret/data/staging/hono-api" { capabilities = ["read"] }
path "secret/data/staging/workers" { capabilities = ["read"] }

path "secret/metadata/staging" { capabilities = ["list"] }
path "secret/metadata/staging/*" { capabilities = ["list"] }

# Database secrets engine
path "database/creds/staging-app" { capabilities = ["read"] }

path "sys/mounts" { capabilities = ["read"] }
path "sys/mounts/database" { capabilities = ["create", "update"] }

# Database system config
path "database/config/phyt-postgres" { capabilities = ["create", "update"] }
path "database/roles/staging-app" { capabilities = ["create", "update"] }

# Store Vault admin password
path "secret/data/staging/postgres" { capabilities = ["create", "update"] }
