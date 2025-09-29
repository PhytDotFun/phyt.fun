output "staging_instance_public_ip" {
  description = "Public IP of the staging EC2 instance"
  value       = module.staging_instance.public_ip
}

output "staging_instance_private_ip" {
  description = "Private IP of the staging EC2 instance"
  value       = module.staging_instance.private_ip
}

output "cloudflare_tunnel_id" {
  description = "Cloudflare Tunnel ID"
  value       = module.tunnel.tunnel_id
}

output "dns_hostname" {
  description = "DNS hostname for staging"
  value       = module.dns.hostname
}
