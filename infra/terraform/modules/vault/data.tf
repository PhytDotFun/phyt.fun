data "vault_kv_secret_v2" "hono_api_static" {
  mount = "secret"
  name  = "hono-api/staging"
}

data "vault_kv_secret_v2" "workers_static" {
  mount = "secret"
  name  = "workers/staging"
}

data "vault_kv_secret_v2" "web_static" {
  mount = "secret"
  name  = "web/staging"
}
