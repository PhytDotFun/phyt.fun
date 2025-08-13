terraform {
	required_version = ">= 1.5"

	required_providers {
		docker = {
			source  = "kreuzwerker/docker"
			version = "~> 3.0"
		}
		cloudflare = {
			source  = "cloudflare/cloudflare"
			version = "~> 4.0"
		}
		vault = {
			source  = "hashicorp/vault"
			version = "~> 3.0"
		}
	}

	# Backend configuration for state management
	# Uncomment when ready to use remote state
	# backend "s3" {
	#   bucket = "phyt-terraform-state"
	#   key    = "infra/terraform.tfstate"
	#   region = "us-east-1"
	# }
}

# Variables
variable "environment" {
	description = "Environment (dev, staging, prod)"
	type        = string
	default     = "dev"
}

variable "domain" {
	description = "Primary domain"
	type        = string
	default     = "phyt.fun"
}

variable "vault_address" {
	description = "Vault server address"
	type        = string
	default     = "https://vault.tailea8363.ts.net"
}

variable "cloudflare_zone_id" {
	description = "Cloudflare zone ID for phyt.fun"
	type        = string
	sensitive   = true
}

variable "staging_server_ip" {
	description = "IP address of staging server"
	type        = string
	default     = "127.0.0.1" # Update with actual staging server IP
}

variable "prod_server_ip" {
	description = "IP address of production server"
	type        = string
	default     = "127.0.0.1" # Update with actual production server IP
}

variable "team_email_domain" {
	description = "Email domain for team access to staging environment"
	type        = string
	default     = "example.com" # Update with your team's email domain
}

variable "cloudflare_tunnel_dev_cname" {
	description = "CNAME target for local-dev Cloudflare tunnel"
	type        = string
	default     = "local-dev-tunnel.cfargotunnel.com" # Update with actual tunnel CNAME
}

variable "cloudflare_tunnel_staging_cname" {
	description = "CNAME target for local-staging Cloudflare tunnel"
	type        = string
	default     = "local-staging-tunnel.cfargotunnel.com" # Update with actual tunnel CNAME
}

# Providers
provider "vault" {
	address = var.vault_address
}

provider "cloudflare" {
	# API token should be set via CLOUDFLARE_API_TOKEN env var
}

provider "docker" {
	host = "unix:///var/run/docker.sock"
}

# Local values
locals {
	environment_config = {
		dev = {
			replicas = 1
			cpu_limit = "0.5"
			memory_limit = "512M"
			subdomain = "local-dev"
		}
		staging = {
			replicas = 1
			cpu_limit = "1.0"
			memory_limit = "1G"
			subdomain = "staging"
		}
		prod = {
			replicas = 2
			cpu_limit = "2.0"
			memory_limit = "2G"
			subdomain = "www"
		}
	}

	current_config = local.environment_config[var.environment]
}

# Data sources
data "cloudflare_zone" "main" {
	name = var.domain
}

# Outputs
output "environment" {
	value = var.environment
}

output "domain" {
	value = var.domain
}

output "current_config" {
	value = local.current_config
}