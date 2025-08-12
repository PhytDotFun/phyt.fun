# CI Issuer Policy for GitHub Actions
# Allows CI to issue tokens for itself and manage CI-related auth

# Allow CI to authenticate and renew its own tokens
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/revoke-self" {
  capabilities = ["update"]
}

# Allow CI to create child tokens with limited scope
path "auth/token/create" {
  capabilities = ["create", "update"]
}

# GitHub Actions OIDC authentication path
path "auth/jwt/login" {
  capabilities = ["create", "update"]
}

# Allow CI to read its role information
path "auth/jwt/role/github-actions" {
  capabilities = ["read"]
}