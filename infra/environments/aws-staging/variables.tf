# CRITICAL: ALL secrets are fetched from Vault at runtime
# NEVER pass secrets as variables
# Only non-sensitive configuration values are variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "deployment_id" {
  description = "Unique deployment identifier (git sha)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for staging"
  type        = string
  default     = "t4g.medium"
}

variable "spot_price" {
  description = "Maximum spot price"
  type        = string

  default = "0.0336"
}

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}
