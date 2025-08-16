# Approle auth
# Single use secret IDs, short lived

# Login only - cannot create new creds
path "auth/approle/login" {
    capabilities = ["create", "update"]
}

# No ability to read role IDs or create secret IDs
# Consumed immediately

# Token self management
path "auth/token/lookup-self" {
    capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/revoke-self" {
  capabilities = ["update"]
}