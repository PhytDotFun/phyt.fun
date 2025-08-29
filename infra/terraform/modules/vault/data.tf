# Check if static secrets exist before trying to read them
data "vault_kv_secret_list" "hono_api_check" {
  mount = "secret"
  name  = "hono-api"
}

data "vault_kv_secret_list" "workers_check" {
  mount = "secret"
  name  = "workers"
}

data "vault_kv_secret_v2" "hono_api_static" {
  count = contains(data.vault_kv_secret_list.hono_api_check.names, "staging") ? 1 : 0
  mount = "secret"
  name  = "hono-api/staging"
}

data "vault_kv_secret_v2" "workers_static" {
  count = contains(data.vault_kv_secret_list.workers_check.names, "staging") ? 1 : 0
  mount = "secret"
  name  = "workers/staging"
}

# data "vault_kv_secret_v2" "web_static" {
#   mount = "secret"
#   name  = "web/staging"
# }
