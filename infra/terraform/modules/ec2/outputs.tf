output "instance_id" {
  value       = aws_instance.staging.id
  description = "EC2 instance ID"
}

# output "spot_request_id" {
#   value       = aws_spot_instance_request.staging.id
#   description = "Spot instance request ID"
# }

# Public IP removed - instance is now in private subnet
# Access is provided via Cloudflare Tunnel only

output "private_ip" {
  value       = aws_instance.staging.private_ip
  description = "Private IP address"
}
