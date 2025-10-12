terraform {
  required_version = ">= 1.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.8.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

locals {
  tunnel_name = var.tunnel_name != "" ? var.tunnel_name : "${var.environment}-tunnel-${var.deployment_id}"
}

resource "random_bytes" "tunnel_secret" {
  length = 32
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "this" {
  account_id    = var.account_id
  name          = local.tunnel_name
  config_src    = "cloudflare"
  tunnel_secret = random_bytes.tunnel_secret.base64
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "this" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.this.id

  config = {
    ingress = [
      {
        hostname = var.hostname
        service  = var.service_url
      },
      {
        service = "http_status:404"
      }
    ]
  }
}
