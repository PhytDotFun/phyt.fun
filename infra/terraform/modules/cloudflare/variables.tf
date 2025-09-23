variable "zone_id" {
  description = "Cloudflare zone ID"
  type        = string
}

variable "account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "deployment_id" {
  description = "Deployment identifier"
  type        = string
}

variable "allowed_ips" {
  description = "List of IP addresses/CIDRs allowed to bypass WAF rules"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "List of country codes to block (e.g., ['CN', 'RU'])"
  type        = list(string)
  default     = []
}
