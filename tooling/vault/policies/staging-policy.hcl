# Staging deployments with minimal permissions
# Tokens using this policy expire quickly (5-10 minutes)

# Read-only access to staging secrets
path "secret/data/staging/*" {
    capabilities = ["read"]
}

path "secret/metadata/staging/*" {
    capabilities = ["read", "list"]
}

# No ability to create or modify secrets

# Allow token self-renewal (limited by max TTL)
path "auth/token/renew-self" {
    capabilities = ["update"]
}

path "auth/token/lookup-self" {
    capabilities = ["read"]
}

# Revoke own token on cleanup
path "auth/token/revoke-self" {
    capabilities = ["update"]
}
