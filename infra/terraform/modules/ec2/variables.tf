variable "environment" {
  description = "Environment name (e.g., staging, prod, dev)"
  type        = string
}

variable "deployment_id" {
  description = "Unique deployment identifier (e.g., short git SHA) used to force safe rotation"
  type        = string
}

variable "ami_id" {
  description = "AMI ID to launch (e.g., Ubuntu 22.04 arm64)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t4g.medium"
}

variable "subnet_id" {
  description = "Public subnet ID to place the instance in"
  type        = string
}

variable "security_group_ids" {
  description = "List of security group IDs to assign to the instance"
  type        = list(string)
}

variable "iam_instance_profile" {
  description = "IAM instance profile name to attach"
  type        = string
}

variable "associate_public_ip" {
  description = "Associate a public IP (yes for public subnet single-box)"
  type        = bool
  default     = true
}

variable "enable_detailed_monitoring" {
  description = "Enable 1-minute CloudWatch metrics"
  type        = bool
  default     = false
}

variable "volume_size" {
  description = "Root EBS gp3 size (GiB)"
  type        = number
  default     = 40
}

variable "volume_iops" {
  description = "gp3 IOPS"
  type        = number
  default     = 3000
}

variable "volume_throughput" {
  description = "gp3 throughput (MiB/s)"
  type        = number
  default     = 125
}

variable "user_data" {
  description = "Rendered cloud-init/user-data script content"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Extra tags to apply to the instance"
  type        = map(string)
  default     = {}
}
