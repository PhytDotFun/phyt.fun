variable "environment" {
  description = "Deployment environment (staging, production, etc.)"
  type        = string
  default     = "staging"
}

variable "deployment_id" {
  description = "Unique identifier for this deployment (e.g., git short SHA)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "vault_addr" {
  description = "HashiCorp Vault server address (e.g., https://vault.example.com:8200)"
  type        = string
}
