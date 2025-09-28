variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.100.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.100.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for the private subnet"
  type        = string
  default     = "10.100.2.0/24"
}

variable "availability_zones" {
  description = "List of availability zone IDs (at least two)"
  type        = list(string)
}

variable "nat_network_interface_id" {
  description = "NAT instance primary ENI ID to route 0.0.0.0/0 from the private RT (optional)"
  type        = string
  default     = null
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "map_public_ip_on_launch" {
  description = "Auto-assign public IP on instance launch in public subnet"
  type        = bool
  default     = true
}

