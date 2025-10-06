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
  host_expr = trimspace(var.hostname) != "" ? "(http.host eq \"${var.hostname}\") and " : ""

  allow_ips_expr = length(var.allowed_ips) > 0 ? "${local.host_expr}ip.src in {${join(" ", var.allowed_ips)}}" : null

  geo_block_expr = length(var.blocked_countries) > 0 ? "${local.host_expr}ip.geoip.country in {${join(" ", [for c in var.blocked_countries : format("\"%s\"", c)])}}" : null
}

resource "cloudflare_ruleset" "this" {
  zone_id = var.zone_id
  name    = "waf-${var.environment}${var.name_suffix != "" ? "-${var.name_suffix}" : ""}"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = concat(
    local.allow_ips_expr != null ? [{
      description       = "Allow trusted IPs"
      expression        = local.allow_ips_expr
      action            = "skip"
      enabled           = true
      action_parameters = { ruleset = "current" }
    }] : [],

    local.geo_block_expr != null ? [{
      description = "Block specified countries"
      expression  = local.geo_block_expr
      action      = "block"
      enabled     = true
    }] : [],
  )
}
