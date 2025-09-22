variable "deployment_id" {
  description = "Unique deployment identifier"
  type        = string
}

variable "iam_instance_profile" {
  description = "IAM instance profile name"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for fck-nat"
  type        = string
  default     = "t4g.nano"
}

variable "subnet_id" {
  description = "Subnet ID for the fck-nat instance (should be public subnet)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where fck-nat will be deployed"
  type        = string
}

variable "private_subnet_cidr" {
  description = "CIDR block of the private subnet that will route through NAT"
  type        = string
}

variable "tailscale_auth_key" {
  description = "Tailscale auth key (single-use)"
  type        = string
  sensitive   = true
}
