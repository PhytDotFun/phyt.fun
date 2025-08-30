output "tunnel_id" {
  value       = cloudflare_zero_trust_tunnel_cloudflared.staging.id
  description = "Cloudflare tunnel ID"
}

output "tunnel_token" {
  value       = data.cloudflare_zero_trust_tunnel_cloudflared_token.staging_token.token
  sensitive   = true
  description = "Cloudflare tunnel token"
}

output "staging_url" {
  value       = "https://staging.phyt.fun"
  description = "Staging environment URL"
}
