variable "environment" {
  description = "Deployment environment (e.g. staging, production)"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "hostname" {
  description = "Optional hostname to scope rules to"
  type        = string
  default     = ""
}

variable "allowed_ips" {
  description = "List of allowed IPs"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "List of 2-letter ISO country codes to block"
  type        = list(string)
  default     = []
}

# variable "enable_bot_challenge" {
#   description = "Enable managed challenge for low bot scores"
#   type        = bool
#   default     = true
# }
#
# variable "bot_score_threshold" {
#   description = "Threshold for bot challenge (0-100, lower is stricter)"
#   type        = number
#   default     = 30
# }

variable "name_suffix" {
  description = "Optional suffix for ruleset name"
  type        = string
  default     = ""
}
