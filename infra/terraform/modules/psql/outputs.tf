output "instance_id" {
  description = "ID of the PostgreSQL instance"
  value       = aws_instance.postgresql.id
}

output "private_ip" {
  description = "Private IP address of the PostgreSQL instance"
  value       = aws_instance.postgresql.private_ip
}

output "database_name" {
  description = "Name of the PostgreSQL database"
  value       = var.postgres_db_name
}

output "database_username" {
  description = "PostgreSQL username"
  value       = var.postgres_username
}

output "database_port" {
  description = "PostgreSQL port"
  value       = "5432"
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.postgres_username}:${var.postgres_password}@${aws_instance.postgresql.private_ip}:5432/${var.postgres_db_name}"
  sensitive   = true
}