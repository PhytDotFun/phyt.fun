resource "random_id" "tunnel_secret" {
    byte_length = 32
}

resource "cloudflare_tunnel" "staging" {
    account_id = var.account_id
    name = "staging-${var.deployment_id}"
}

resource "cloudflare_tunnel_config" "staging" {
    account_id = var.account_id
    tunnel_id = cloudflare_tunnel.staging.id

    config {
        ingress_rule {
            hostname = "staging.phyt.fun"
            service = "http://localhost:8080"

            origin_request {
                no_tls_verify = true
                connect_timeout = "30s"
                tcp_keep_alive = "30s"
                keep_alive_connections = 4
                http_host_header = "staging.phyt.fun"
                origin_server_name = "staging.phyt.fun"
            }
        }
        ingress_rule {
            service = "http_status:404"
        }
    }
}

resource "cloudflare_record" "staging" {
    zone_id = var.zone_id
    name = "staging"
    value = "${cloudflare_tunnel.staging.id}.cfargotunnel.com"
    type = "CNAME"
    proxied = true
    ttl = 1

    comment = "Staging environment - ${var.deployment_id}"
}

# Use full (strict) TLS at edge; avoid 'flexible'
resource "cloudflare_page_rule" "staging_cache" {
    zone_id  = var.zone_id
    target   = "staging.phyt.fun/api/*"
    priority = 1

    actions = {
        cache_level      = "bypass"
        security_level   = "medium"
        ssl              = "full"
        always_use_https = true
    }
}

resource "cloudflare_page_rule" "staging_static" {
    zone_id  = var.zone_id
    target   = "staging.phyt.fun/*"
    priority = 2

    actions = {
        cache_level        = "simplified"
        edge_cache_ttl     = 300
        browser_cache_ttl  = 300
        ssl                = "full"
        always_use_https   = true
    }
}
