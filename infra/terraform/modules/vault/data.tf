# Check if static secrets exist before trying to read them
data "vault_kv_secrets_list_v2" "secrets_check" {
  mount = "secret"
  name  = "staging"
}

data "vault_kv_secret_v2" "hono_api_static" {
  count = (contains(data.vault_kv_secrets_list_v2.secrets_check.names, "hono-api/staging") || contains(data.vault_kv_secrets_list_v2.secrets_check.names, "hono-api/staging/")) ? 1 : 0
  mount = "secret"
  name  = "hono-api/staging"
}

data "vault_kv_secret_v2" "workers_static" {
  count = (contains(data.vault_kv_secrets_list_v2.secrets_check.names, "workers/staging") || contains(data.vault_kv_secrets_list_v2.secrets_check.names, "workers/staging/")) ? 1 : 0
  mount = "secret"
  name  = "workers/staging"
}

# Unused - not removed for completeness
# data "vault_kv_secret_v2" "web_static" {
#   mount = "secret"
#   name  = "web/staging"
# }
