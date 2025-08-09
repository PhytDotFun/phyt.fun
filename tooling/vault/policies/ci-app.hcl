# CI runtime reads CI namespace
path "secret/data/ci/postgres"      { capabilities = ["read"] }
path "secret/data/ci/hono-gateway"  { capabilities = ["read"] }
path "secret/data/ci/workers"       { capabilities = ["read"] }
