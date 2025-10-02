# Core IDs
output "tunnel_id" {
  description = "Cloudflare Tunnel ID"
  value       = cloudflare_zero_trust_tunnel_cloudflared.this.id
}

output "tunnel_cname" {
  description = "The CNAME target for DNS (value side)"
  value       = "${cloudflare_zero_trust_tunnel_cloudflared.this.id}.cfargotunnel.com"
}

# Token details (for cloudflared on the instance)
# Different deploy styles use different fields; expose both.
output "token_client_id" {
  description = "Tunnel token client_id (used by some bootstrap methods)"
  value       = cloudflare_zero_trust_tunnel_cloudflared_token.this.client_id
}

output "token_client_secret" {
  description = "Tunnel token client_secret (used by cloudflared token-based auth)"
  value       = cloudflare_zero_trust_tunnel_cloudflared_token.this.client_secret
  sensitive   = true
}

output "tunnel_token" {
  description = "Tunnel token for cloudflared authentication"
  value       = cloudflare_zero_trust_tunnel_cloudflared_token.this.value
  sensitive   = true
}
