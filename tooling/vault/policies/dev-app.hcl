# Dev runtime can read dev secrets for all three services
path "secret/data/dev/postgres"      { capabilities = ["read"] }
path "secret/data/dev/hono-api"      { capabilities = ["read"] }
path "secret/data/dev/workers"       { capabilities = ["read"] }
