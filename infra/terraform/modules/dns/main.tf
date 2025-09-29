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
  # Extract the subdomain from hostname (e.g., "staging" from "staging.phyt.fun")
  record_name = split(".", var.hostname)[0]
}

# Create CNAME record pointing to tunnel
resource "cloudflare_record" "tunnel" {
  zone_id = var.zone_id
  name    = local.record_name
  type    = "CNAME"
  content = "${var.tunnel_id}.cfargotunnel.com"
  proxied = var.proxied
  ttl     = var.ttl

  comment = "Tunnel route for ${var.environment} environment (deployment: ${var.deployment_id})"
}
