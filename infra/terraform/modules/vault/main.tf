terraform {
  required_version = ">= 1.0"

  required_providers {
    vault = {
      source  = "hashicorp/vault"
      version = "~> 5.0"
    }

    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Per-deploy generated values
resource "random_password" "db" {
  length  = 32
  special = false
}

resource "random_password" "hono_api_key" {
  length  = 48
  special = false
}

# hono-api merged env
locals {
  hono_api_env = merge(
    {
      DATABASE_URL = "postgresql://${var.db_user}:${random_password.db.result}@pgbouncer:6432/${var.db_name}"
      API_KEY      = random_password.hono_api_key.result
      NODE_ENV     = "production"
      PORT         = "8000"
      REDIS_URL    = "redis://redis:6379"
    },
    length(data.vault_kv_secret_v2.hono_api_static) > 0 ? data.vault_kv_secret_v2.hono_api_static[0].data : {}
  )
}

resource "vault_kv_secret_v2" "hono_api" {
  mount     = "secret"
  name      = "staging/${var.deployment_id}/hono-api"
  data_json = jsonencode(local.hono_api_env)
}

# postgres creds
resource "vault_kv_secret_v2" "postgres" {
  mount = "secret"
  name  = "staging/${var.deployment_id}/postgres"
  data_json = jsonencode({
    POSTGRES_USER     = var.db_user
    POSTGRES_PASSWORD = random_password.db.result
    POSTGRES_DB       = var.db_name
  })
}

# pgbouncer config
resource "vault_kv_secret_v2" "pgbouncer" {
  mount = "secret"
  name  = "staging/${var.deployment_id}/pgbouncer"
  data_json = jsonencode({
    DATABASES_HOST     = "postgres"
    DATABASES_PORT     = "5432"
    DATABASES_USER     = var.db_user
    DATABASES_PASSWORD = random_password.db.result
    DATABASES_DBNAME   = var.db_name
    POOL_MODE          = "transaction"
    MAX_CLIENT_CONN    = "100"
    DEFAULT_POOL_SIZE  = "25"
  })
}

# workers merged env
locals {
  workers_env = merge(
    {
      DATABASE_URL       = "postgresql://${var.db_user}:${random_password.db.result}@pgbouncer:6432/${var.db_name}"
      REDIS_URL          = "redis://redis:6379"
      WORKER_CONCURRENCY = "2"
      NODE_ENV           = "production"
    },
    length(data.vault_kv_secret_v2.workers_static) > 0 ? data.vault_kv_secret_v2.workers_static[0].data : {}
  )
}

resource "vault_kv_secret_v2" "workers" {
  mount     = "secret"
  name      = "staging/${var.deployment_id}/workers"
  data_json = jsonencode(local.workers_env)
}
