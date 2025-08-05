path "secret/data/dev/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/data/shared/*" {
  capabilities = ["read", "list"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}
