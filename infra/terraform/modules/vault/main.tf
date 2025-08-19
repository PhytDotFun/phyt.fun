resource "vault_mount" "staging" {
    path = "secret/staging/${var.deployment_id}"
    type = "kv-v2"

    options = {
        version = "2"
    }
}

resource "random_password" "db" {
    length = 32
    special = false
}

resource "random_password" "jwt" {
    length = 64
    special = true
}

resource "random_password" "api_key" {
    length = 48
    special = false
}

resource "vault_generic_secret" "hono_api" {
  path = "${vault_mount.staging.path}/hono-api"

  data_json = jsonencode({
    DATABASE_URL = "postgresql://postgres:${random_password.db.result}@pgbouncer:6432/phyt_staging"
    REDIS_URL    = "redis://redis:6379"
    JWT_SECRET   = random_password.jwt.result
    API_KEY      = random_password.api_key.result
    NODE_ENV     = "production"
    PORT         = "8000"
  })
}

resource "vault_generic_secret" "postgres" {
  path = "${vault_mount.staging.path}/postgres"

  data_json = jsonencode({
    POSTGRES_USER     = "postgres"
    POSTGRES_PASSWORD = random_password.db.result
    POSTGRES_DB       = "phyt_staging"
  })
}

resource "vault_generic_secret" "pgbouncer" {
  path = "${vault_mount.staging.path}/pgbouncer"

  data_json = jsonencode({
    DATABASES_HOST     = "postgres"
    DATABASES_PORT     = "5432"
    DATABASES_USER     = "postgres"
    DATABASES_PASSWORD = random_password.db.result
    DATABASES_DBNAME   = "phyt_staging"
    POOL_MODE          = "transaction"
    MAX_CLIENT_CONN    = "100"
    DEFAULT_POOL_SIZE  = "25"
  })
}

resource "vault_generic_secret" "workers" {
  path = "${vault_mount.staging.path}/workers"

  data_json = jsonencode({
    DATABASE_URL = "postgresql://postgres:${random_password.db.result}@pgbouncer:6432/phyt_staging"
    REDIS_URL          = "redis://redis:6379"
    WORKER_CONCURRENCY = "2"
    NODE_ENV           = "production"
  })
}

resource "vault_approle_auth_backend_role" "staging" {
    backend = "approle"
    role_name = "staging-${var.deployment_id}"
    token_policies = ["staging-policy"]

    token_ttl = 3600
    token_max_ttl = 86400
}

resource "vault_approle_auth_backend_role_secret_id" "staging" {
    backend = vault_approle_auth_backend_role.staging.backend
    role_name = vault_approle_auth_backend_role.staging.role_name
}
