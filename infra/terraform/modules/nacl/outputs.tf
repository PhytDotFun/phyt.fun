output "nacl_id" {
  description = "ID of the created Network ACL"
  value       = aws_network_acl.main.id
}

output "nacl_arn" {
  description = "ARN of the created Network ACL"
  value       = aws_network_acl.main.arn
}

output "associated_subnet_ids" {
  description = "List of subnet IDs associated with this NACL"
  value       = var.subnet_ids
}
