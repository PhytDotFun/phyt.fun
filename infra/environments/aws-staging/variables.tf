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

variable "postgres_instance_type" {
  description = "EC2 instance type for postgres db instance"
  type        = string
  default     = "t4g.nano"
}

variable "fck_nat_instance_type" {
  description = "EC2 instance for fck_nat NAT"
  type        = string
  default     = "t4g.nano"
}

# variable "spot_price" {
#   description = "Maximum spot price"
#   type        = string
#
#   default = "0.0336"
# }

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

variable "vault_addr" {
  description = "Vault server address"
  type        = string
}
