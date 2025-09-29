terraform {
  required_version = ">= 1.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.8.4"
    }
  }
}

locals {
  tunnel_name = var.tunnel_name != "" ? var.tunnel_name : "${var.environment}-tunnel-${var.deployment_id}"
}

# Create/own the tunnel (stable per env)
resource "cloudflare_zero_trust_tunnel_cloudflared" "this" {
  account_id = var.account_id
  name       = local.tunnel_name
}

# Create a token for the tunnel (used by cloudflared on the EC2 host)
resource "cloudflare_zero_trust_tunnel_cloudflared_token" "this" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.this.id
}

# Optional config: only if a hostname is provided
resource "cloudflare_zero_trust_tunnel_cloudflared_config" "this" {
  count      = var.hostname != "" ? 1 : 0
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.this.id

  config = {
    ingress_rule = {
      hostname = var.hostname
      service  = var.service_url
    }
    ingress_rule = {
      service = "http_status:404"
    }
  }
}
