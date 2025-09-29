variable "environment" {
  description = "Environment name (e.g., staging, prod, dev)"
  type        = string
}

variable "deployment_id" {
  description = "Unique deployment identifier (e.g., short git SHA)"
  type        = string
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

# variable "private_subnet_cidr" {
#   description = "CIDR block for the private subnet"
#   type        = string
#   default     = "10.100.2.0/24"
# }
#
# variable "nat_network_interface_id" {
#   description = "Network interface ID for NAT instance (optional, for future use)"
#   type        = string
#   default     = null
# }

variable "availability_zone_id" {
  description = "AZ ID for the public subnet (e.g., data.aws_availability_zones.available.zone_ids[0])"
  type        = string
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
  description = "Auto-assign public IP to instances launched in the public subnet"
  type        = bool
  default     = true
}

variable "extra_tags" {
  description = "Additional tags to add to all resources"
  type        = map(string)
  default     = {}
}
