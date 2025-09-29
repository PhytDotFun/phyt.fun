output "record_id" {
  description = "Cloudflare record ID"
  value       = cloudflare_record.tunnel.id
}

output "hostname" {
  description = "Full hostname configured"
  value       = var.hostname
}

output "fqdn" {
  description = "Fully-qualified domain name"
  value       = cloudflare_record.tunnel.hostname
}

output "tunnel_endpoint" {
  description = "Tunnel endpoint this record points to"
  value       = cloudflare_record.tunnel.content
}
