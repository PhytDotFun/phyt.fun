# Allow Vault Agent to read runtime secrets
path "secret/data/staging/hono-api" { capabilities = ["read"] }
path "secret/data/staging/workers" { capabilities = ["read"] }
path "secret/data/staging/neon" { capabilities = ["read"] }

path "secret/metadata/staging" { capabilities = ["list"] }
path "secret/metadata/staging/*" { capabilities = ["list"] }
