# Allow Vault Agent to read runtime secrets
path "secret/data/staging/postgres" { capabilities = ["read"] }
path "secret/data/staging/pgbouncer" { capabilities = ["read"] }
path "secret/data/staging/hono-api" { capabilities = ["read"] }
path "secret/data/staging/workers" { capabilities = ["read"] }

# (Optional) list under staging/ for template conditionals/debug
path "secret/metadata/staging" { capabilities = ["list"] }
path "secret/metadata/staging/*" { capabilities = ["list"] }
