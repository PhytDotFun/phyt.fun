output "tunnel_id" {
    value = cloudflare_tunnel.staging.id
    description = "Cloudflare tunnel ID"
}

output "tunnel_token" {
    value = random_id.tunnel_secret.b64_std
    sensitive = true
    description = "Cloudflare tunnel token"
}

output "staging_url" {
    value = "https://staging.phyt.fun"
    description = "Staging environment URL"
}
