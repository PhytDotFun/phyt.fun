variable "environment" {
  description = "Environment name (e.g., staging, prod, dev)"
  type        = string
}

variable "deployment_id" {
  description = "Unique deployment identifier (e.g., short git SHA)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the SG will be created"
  type        = string
}

variable "allow_http_egress" {
  description = "Allow outbound HTTP (80/tcp) for package mirrors"
  type        = bool
  default     = true
}

variable "extra_tags" {
  description = "Additional tags to add to the security group"
  type        = map(string)
  default     = {}
}
