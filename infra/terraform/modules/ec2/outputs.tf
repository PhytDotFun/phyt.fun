output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "private_ip" {
  description = "Private IP address"
  value       = aws_instance.app.private_ip
}

output "public_ip" {
  description = "Public IP address (if associated)"
  value       = aws_instance.app.public_ip
}

output "availability_zone" {
  description = "Availability zone"
  value       = aws_instance.app.availability_zone
}

output "arn" {
  description = "Instance ARN"
  value       = aws_instance.app.arn
}

output "tags" {
  description = "Tags applied to the instance"
  value       = aws_instance.app.tags
}
