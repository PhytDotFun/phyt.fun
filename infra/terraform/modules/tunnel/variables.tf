variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "environment" {
  description = "Environment (e.g., staging, prod, dev)"
  type        = string
}

variable "deployment_id" {
  description = "Unique deployment identifier (e.g., short git SHA)"
  type        = string
}

variable "tunnel_name" {
  description = "Stable name for the tunnel (auto-generated if not provided)"
  type        = string
  default     = ""
}

variable "zone_id" {
  description = "Cloudflare Zone ID (for DNS operations)"
  type        = string
}

variable "hostname" {
  description = "FQDN to route via this tunnel (e.g., staging.phyt.fun)"
  type        = string

  validation {
    condition     = can(regex("^([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$", var.hostname))
    error_message = "Hostname must be a fully-qualified domain name"
  }
}

variable "service_url" {
  description = "Origin service behind the tunnel (what cloudflared should reach)"
  type        = string
  default     = "http://localhost:8080"
}
