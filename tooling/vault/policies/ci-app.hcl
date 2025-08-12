# CI App Policy for GitHub Actions
# Allows CI to read secrets for all environments during build/test

path "secret/data/dev/*" {
  capabilities = ["read"]
}

path "secret/data/staging/*" {
  capabilities = ["read"]
}

path "secret/data/prod/*" {
  capabilities = ["read"]
}

path "secret/metadata/dev/*" {
  capabilities = ["read"]
}

path "secret/metadata/staging/*" {
  capabilities = ["read"]
}

path "secret/metadata/prod/*" {
  capabilities = ["read"]
}

# Allow CI to read its own configuration
path "secret/data/ci/*" {
  capabilities = ["read"]
}

path "secret/metadata/ci/*" {
  capabilities = ["read"]
}