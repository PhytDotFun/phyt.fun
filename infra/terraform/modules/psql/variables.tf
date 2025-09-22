variable "deployment_id" {
  description = "Unique deployment identifier"
  type        = string
}

variable "iam_instance_profile" {
  description = "IAM instance profile name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for PostgreSQL"
  type        = string
  default     = "t4g.nano"
}

variable "ami_id" {
  description = "AMI ID for the PostgreSQL instance"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for the PostgreSQL instance"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for PostgreSQL"
  type        = string
}

variable "postgres_db" {
  description = "PostgreSQL database name"
  type        = string
  default     = "primary_staging"
}

variable "postgres_user" {
  description = "PostgreSQL username"
  type        = string
  default     = "phyt"
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 20
}

variable "vault_addr" {
  description = "Vault server address"
  type        = string
}
