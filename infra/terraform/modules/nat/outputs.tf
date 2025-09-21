output "instance_id" {
  description = "ID of the fck-nat instance"
  value       = aws_instance.fck_nat.id
}

output "primary_network_interface_id" {
  description = "Primary network interface ID of the fck-nat instance"
  value       = aws_instance.fck_nat.primary_network_interface_id
}

output "private_ip" {
  description = "Private IP address of the fck-nat instance"
  value       = aws_instance.fck_nat.private_ip
}

output "public_ip" {
  description = "Public IP address of the fck-nat instance"
  value       = aws_instance.fck_nat.public_ip
}

output "security_group_id" {
  description = "Security group ID of the fck-nat instance"
  value       = aws_security_group.fck_nat.id
}
