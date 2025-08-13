# Vault Policies (declarative management)
resource "vault_policy" "dev_app" {
	name = "dev-app"

	policy = <<EOT
# Dev runtime can read dev secrets for all services
path "secret/data/dev/*" { 
    capabilities = ["read"]
}
EOT
}

resource "vault_policy" "staging_app" {
	name = "staging-app"

	policy = <<EOT
# Read access to all staging secrets, including per-PR subtrees
path "secret/data/staging/*" {
    capabilities = ["read"]
}

path "secret/data/staging/*/*" {
    capabilities = ["read"]
}
EOT
}

resource "vault_policy" "prod_app" {
	name = "prod-app"

	policy = <<EOT
path "secret/data/prod/*" {
  capabilities = ["read"]
}
EOT
}

resource "vault_policy" "ci_app" {
	name = "ci-app"

	policy = <<EOT
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
EOT
}

# AppRole authentication method
resource "vault_auth_backend" "approle" {
	type = "approle"
	path = "approle"

	description = "AppRole auth method for service authentication"
}

# AppRole for each environment
resource "vault_approle_auth_backend_role" "dev" {
	backend        = vault_auth_backend.approle.path
	role_name      = "dev-app"
	token_policies = [vault_policy.dev_app.name]

	token_ttl     = 3600  # 1 hour
	token_max_ttl = 14400 # 4 hours

	bind_secret_id = true
}

resource "vault_approle_auth_backend_role" "staging" {
	backend        = vault_auth_backend.approle.path
	role_name      = "staging-app"
	token_policies = [vault_policy.staging_app.name]

	token_ttl     = 3600
	token_max_ttl = 14400

	bind_secret_id = true
}

resource "vault_approle_auth_backend_role" "prod" {
	backend        = vault_auth_backend.approle.path
	role_name      = "prod-app"
	token_policies = [vault_policy.prod_app.name]

	token_ttl     = 1800 # 30 minutes (shorter for prod)
	token_max_ttl = 7200 # 2 hours

	bind_secret_id = true
}

resource "vault_approle_auth_backend_role" "ci" {
	backend        = vault_auth_backend.approle.path
	role_name      = "ci-app"
	token_policies = [vault_policy.ci_app.name]

	token_ttl     = 1800
	token_max_ttl = 3600

	bind_secret_id = true
}

# JWT/OIDC auth method for GitHub Actions
resource "vault_jwt_auth_backend" "github" {
	path               = "jwt"
	type               = "jwt"
	oidc_discovery_url = "https://token.actions.githubusercontent.com"
	bound_issuer       = "https://token.actions.githubusercontent.com"

	description = "GitHub Actions OIDC authentication"
}

resource "vault_jwt_auth_backend_role" "github_actions" {
	backend   = vault_jwt_auth_backend.github.path
	role_name = "github-actions"

	token_policies = [vault_policy.ci_app.name]
	token_ttl      = 900 # 15 minutes
	token_max_ttl  = 900

	user_claim = "actor"

	bound_claims = {
		iss = "https://token.actions.githubusercontent.com"
	}

	claim_mappings = {
		actor      = "actor"
		repository = "repository"
	}
}

# Secret engines
resource "vault_mount" "kv" {
	path = "secret"
	type = "kv-v2"

	description = "KV v2 secret engine for application secrets"
}

# Outputs for use in other configurations
output "approle_role_ids" {
	description = "AppRole Role IDs for each environment"
	value = {
		dev     = vault_approle_auth_backend_role.dev.role_id
		staging = vault_approle_auth_backend_role.staging.role_id
		prod    = vault_approle_auth_backend_role.prod.role_id
		ci      = vault_approle_auth_backend_role.ci.role_id
	}
	sensitive = true
}
