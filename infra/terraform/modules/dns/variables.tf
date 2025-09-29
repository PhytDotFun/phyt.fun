variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, prod, dev)"
  type        = string
}

variable "deployment_id" {
  description = "Unique deployment identifier (e.g., short git SHA)"
  type        = string
}

variable "tunnel_id" {
  description = "Cloudflare Tunnel ID to route traffic through"
  type        = string
}

variable "hostname" {
  description = "Full hostname for the DNS record (e.g., staging.phyt.fun)"
  type        = string
}

variable "proxied" {
  description = "Whether to proxy traffic via Cloudflare"
  type        = bool
  default     = true
}

variable "ttl" {
  description = "Time to live; 1 means 'auto'"
  type        = number
  default     = 1
}
