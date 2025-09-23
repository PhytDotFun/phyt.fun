terraform {
  required_version = ">= 1.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.8.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "staging" {
  account_id = var.account_id
  name       = "staging-${var.deployment_id}"
}

data "cloudflare_zero_trust_tunnel_cloudflared_token" "staging_token" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.staging.id
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "staging" {
  account_id = var.account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.staging.id

  config = {
    ingress = [
      {
        hostname = "staging.phyt.fun"
        service  = "http://localhost:8080"

        origin_request = {
          # origin is loopback HTTP behind Nginx
          no_tls_verify          = true
          connect_timeout        = 30
          tcp_keep_alive         = 30
          keep_alive_connections = 4
          http_host_header       = "staging.phyt.fun"
          origin_server_name     = "staging.phyt.fun"
        }
      },
      # default/fallback
      { service = "http_status:404" }
    ]
  }
}

resource "cloudflare_dns_record" "staging" {
  zone_id = var.zone_id
  name    = "staging"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.staging.id}.cfargotunnel.com"
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Staging environment - ${var.deployment_id}"
}

resource "cloudflare_ruleset" "staging_cache_rules" {
  zone_id = var.zone_id
  name    = "staging-cache"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [
    {
      enabled     = true
      description = "Bypass cache for API"
      expression  = "(http.host eq \"staging.phyt.fun\" and starts_with(http.request.uri.path, \"/api/\"))"
      action      = "set_cache_settings"
      action_parameters = {
        cache = false
      }
    },
    {
      enabled     = true
      description = "Cache static"
      expression  = "(http.host eq \"staging.phyt.fun\")"
      action      = "set_cache_settings"
      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 300
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 300
        }
      }
    }
  ]
}

# WAF rules for security
resource "cloudflare_ruleset" "staging_waf" {
  zone_id = var.zone_id
  name    = "staging-waf-${var.deployment_id}"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules = [
    # IP allowlist override (configure allowed_ips variable)
    {
      enabled     = length(var.allowed_ips) > 0
      description = "Allow trusted IPs to bypass all rules"
      expression  = "(http.host eq \"staging.phyt.fun\" and ip.src in {${join(" ", var.allowed_ips)}})"
      action      = "skip"
      action_parameters = {
        ruleset = "current"
      }
    },

    # API rate limiting
    {
      enabled     = true
      description = "API rate limiting"
      expression  = "(http.host eq \"staging.phyt.fun\" and starts_with(http.request.uri.path, \"/api/\"))"
      action      = "block"
      ratelimit = {
        characteristics     = ["ip.src"]
        period              = 60
        requests_per_period = 100
        mitigation_timeout  = 3600
      }
    },

    # Bot protection
    {
      enabled     = true
      description = "Block low-score bots"
      expression  = "(http.host eq \"staging.phyt.fun\" and cf.bot_management.score lt 30)"
      action      = "managed_challenge"
    },

    # Geographic blocking (if enabled)
    {
      enabled     = length(var.blocked_countries) > 0
      description = "Block specified countries"
      expression  = "(http.host eq \"staging.phyt.fun\" and ip.geoip.country in {${join(" ", [for country in var.blocked_countries : "\"${country}\""])}})"
      action      = "block"
    }
  ]
}
