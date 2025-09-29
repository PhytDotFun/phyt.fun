variable "environment" {
  description = "Environment name (e.g., staging, prod, dev)"
  type        = string
}

variable "deployment_id" {
  description = "Unique deployment identifier (e.g., short git SHA)"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for IAM resources (keeps names stable across envs)"
  type        = string
  default     = "app"
}

variable "enable_ssm" {
  description = "Attach SSM policies so you can use Session Manager"
  type        = bool
  default     = true
}

variable "extra_managed_policy_arns" {
  description = "Additional AWS managed policy ARNs to attach to the role"
  type        = list(string)
  default     = []
}

variable "extra_inline_policies" {
  description = "Map of name => JSON policy documents to add inline"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags applied to IAM resources"
  type        = map(string)
  default     = {}
}
