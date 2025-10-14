terraform {
  required_version = ">= 1.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.8.4"
    }
  }
}

# CNAME for tunnel
resource "cloudflare_dns_record" "tunnel" {
  zone_id = var.zone_id
  name    = var.hostname
  type    = "CNAME"
  content = "${var.tunnel_id}.cfargotunnel.com"
  proxied = var.proxied
  ttl     = var.ttl

  comment = "Tunnel route for ${var.environment} environment (deployment: ${var.deployment_id})"
}

# pages config
locals {
  pages_enabled = (trim(var.pages_project_name) != "" && trim(var.pages_domain_name) != "" && trim(var.account_id) != "")
}

resource "cloudflare_pages_project" "pages" {
  count      = local.pages_enabled ? 1 : 0
  account_id = var.account_id
  name       = var.pages_project_name
}

resource "cloudflare_pages_domain" "pages_domain" {
  count        = local.pages_enabled ? 1 : 0
  account_id   = var.account_id
  project_name = cloudflare_pages_project.pages[0].name
  name         = var.pages_domain_name
}

resource "cloudflare_dns_record" "pages_cname" {
  count   = local.pages_enabled ? 1 : 0
  zone_id = var.zone_id
  name    = var.pages_domain_name
  type    = "CNAME"
  ttl     = 1
  content = cloudflare_pages_project.pages[0].subdomain
  proxied = true
  comment = "Pages custom domain CNAME"
}
