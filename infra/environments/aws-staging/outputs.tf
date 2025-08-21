output "instance_id" {
    value = module.staging_instance.instance_id
    description = "EC2 instance ID"
}

output "instance_ip" {
    value = module.staging_instance.public_ip
    description = "Public IP address of the instance"
}

output "spot_instance_request_id" {
    value = module.staging_instance.spot_request_id
    description = "Spot instance request ID"
}

output "tunnel_id" {
    value = module.cloudflare.tunnel_id
    description = "Cloudflare tunnel ID"
}

output "deployment_url" {
    value = "https://staging.phyt.fun"
    description = "Staging environment URL"
}

output "ssh_command" {
  value       = "tailscale ssh ubuntu@${var.deployment_id}"
  description = "SSH command to access the instance (Tailscale SSH)"
}
