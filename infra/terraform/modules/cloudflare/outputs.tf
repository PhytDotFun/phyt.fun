output "tunnel_id" {
  value       = cloudflare_tunnel.staging.id
  description = "Cloudflare tunnel ID"
}

output "tunnel_token" {
  value       = cloudflare_tunnel_token.staging.token
  sensitive   = true
  description = "Cloudflare tunnel token"
}

output "staging_url" {
  value       = "https://staging.phyt.fun"
  description = "Staging environment URL"
}
