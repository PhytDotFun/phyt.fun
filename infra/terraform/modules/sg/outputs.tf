output "security_group_id" {
  description = "ID of the app security group"
  value       = aws_security_group.app.id
}

output "staging_sg_id" {
  description = "ID of the app security group (alias for staging compatibility)"
  value       = aws_security_group.app.id
}

output "postgres_sg_id" {
  description = "ID of the PostgreSQL security group"
  value       = aws_security_group.postgres.id
}
