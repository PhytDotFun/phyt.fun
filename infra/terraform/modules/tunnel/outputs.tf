# Core IDs
output "tunnel_id" {
  description = "Cloudflare Tunnel ID"
  value       = cloudflare_zero_trust_tunnel_cloudflared.this.id
}

output "tunnel_cname" {
  description = "The CNAME target for DNS (value side)"
  value       = "${cloudflare_zero_trust_tunnel_cloudflared.this.id}.cfargotunnel.com"
}

output "tunnel_token" {
  description = "Tunnel credentials JSON (base64 encoded for cloudflared)"
  value = base64encode(jsonencode({
    AccountTag   = var.account_id
    TunnelID     = cloudflare_zero_trust_tunnel_cloudflared.this.id
    TunnelName   = cloudflare_zero_trust_tunnel_cloudflared.this.name
    TunnelSecret = random_bytes.tunnel_secret.base64
  }))
  sensitive = true
}
