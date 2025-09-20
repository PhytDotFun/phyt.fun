output "instance_id" {
  value       = module.staging_instance.instance_id
  description = "EC2 instance ID"
}

output "instance_ip" {
  value       = module.staging_instance.public_ip
  description = "Public IP address of the instance"
}

# output "spot_instance_request_id" {
#   value       = module.staging_instance.spot_request_id
#   description = "Spot instance request ID"
# }

output "tunnel_id" {
  value       = module.cloudflare.tunnel_id
  description = "Cloudflare tunnel ID"
}

output "deployment_url" {
  value       = "https://staging.phyt.fun"
  description = "Staging environment URL"
}

output "ssh_command" {
  value       = "tailscale ssh ubuntu@${var.deployment_id}"
  description = "SSH command to access the instance (Tailscale SSH)"
}

# PostgreSQL database outputs
output "database_instance_id" {
  value       = module.postgresql.instance_id
  description = "PostgreSQL instance ID"
}

output "database_private_ip" {
  value       = module.postgresql.private_ip
  description = "PostgreSQL instance private IP"
}

output "database_name" {
  value       = module.postgresql.database_name
  description = "PostgreSQL database name"
}

output "database_username" {
  value       = module.postgresql.database_username
  description = "PostgreSQL username"
}

output "database_port" {
  value       = module.postgresql.database_port
  description = "PostgreSQL port"
}

output "database_connection_string" {
  value       = module.postgresql.connection_string
  description = "PostgreSQL connection string"
  sensitive   = true
}

# fck-nat instance info
output "fck_nat_instance_id" {
  value       = aws_instance.fck_nat.id
  description = "fck-nat instance ID"
}

output "fck_nat_public_ip" {
  value       = aws_instance.fck_nat.public_ip
  description = "fck-nat instance public IP"
}
