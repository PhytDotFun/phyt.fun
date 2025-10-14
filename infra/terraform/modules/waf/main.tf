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
  allow_rules = length(var.allowed_ips) > 0 ? [
    for hostname in var.hostnames : {
      description       = "Allow trusted IPs for ${hostname}"
      expression        = "(http.host eq \"${hostname}\") and ip.src in {${join(" ", var.allowed_ips)}}"
      action            = "skip"
      enabled           = true
      action_parameters = { ruleset = "current" }
    }
  ] : []

  geo_block_rules = length(var.blocked_countries) > 0 ? [
    for hostname in var.hostnames : {
      description = "Block specified countries for ${hostname}"
      expression  = "(http.host eq \"${hostname}\") and ip.geoip.country in {${join(" ", [for c in var.blocked_countries : format("\"%s\"", c)])}}"
      action      = "block"
      enabled     = true
    }
  ] : []

  default_block_rules = length(var.hostnames) > 0 && length(var.allowed_ips) > 0 ? [
    for hostname in var.hostnames : {
      description = "Block all non-whitelisted traffic to ${hostname}"
      expression  = "http.host eq \"${hostname}\""
      action      = "block"
      enabled     = true
    }
  ] : []
}

resource "cloudflare_ruleset" "this" {
  zone_id = var.zone_id
  name    = "waf-${var.environment}${var.name_suffix != "" ? "-${var.name_suffix}" : ""}"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = concat(
    local.allow_rules,
    local.geo_block_rules,
    local.default_block_rules
  )
}
