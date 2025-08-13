# Cloudflare DNS Records
resource "cloudflare_record" "app" {
	count = var.environment == "prod" ? 1 : 0

	zone_id = data.cloudflare_zone.main.id
	name    = var.domain
	value   = var.prod_server_ip
	type    = "A"
	ttl     = 300

	comment = "Production application"
}

resource "cloudflare_record" "app_www" {
	count = var.environment == "prod" ? 1 : 0

	zone_id = data.cloudflare_zone.main.id
	name    = "www"
	value   = var.domain
	type    = "CNAME"
	ttl     = 300

	comment = "WWW redirect to apex"
}

resource "cloudflare_record" "staging" {
	zone_id = data.cloudflare_zone.main.id
	name    = "staging"
	value   = var.staging_server_ip
	type    = "A"
	ttl     = 300

	comment = "Staging environment - staging.phyt.fun"
}

# Cloudflare Tunnel for local development
resource "cloudflare_record" "local_dev" {
	count = var.environment == "dev" ? 1 : 0

	zone_id = data.cloudflare_zone.main.id
	name    = "local-dev"
	value   = var.cloudflare_tunnel_dev_cname
	type    = "CNAME"
	ttl     = 300

	comment = "Local development tunnel"
}

resource "cloudflare_record" "local_staging" {
	count = var.environment == "dev" ? 1 : 0

	zone_id = data.cloudflare_zone.main.id
	name    = "local-staging"
	value   = var.cloudflare_tunnel_staging_cname
	type    = "CNAME"
	ttl     = 300

	comment = "Local staging tunnel"
}

# Page Rules for performance and security
resource "cloudflare_page_rule" "api_cache" {
	zone_id = data.cloudflare_zone.main.id
	target  = "${var.domain}/api/*"

	actions {
		cache_level    = "bypass"
		security_level = "medium"
		ssl            = "strict"
	}

	priority = 1
}

resource "cloudflare_page_rule" "static_cache" {
	zone_id = data.cloudflare_zone.main.id
	target  = "${var.domain}/*.{js,css,png,jpg,jpeg,gif,svg,ico,woff,woff2}"

	actions {
		cache_level       = "cache_everything"
		edge_cache_ttl    = 31536000 # 1 year
		browser_cache_ttl = 31536000
	}

	priority = 2
}

# Cloudflare Access for staging.phyt.fun
resource "cloudflare_access_application" "staging" {
	zone_id = data.cloudflare_zone.main.id
	name    = "Staging Environment"
	domain  = "staging.phyt.fun"
	type    = "self_hosted"

	session_duration = "24h"

	# Allow CORS for API calls
	cors_headers {
		allow_credentials = true
		allow_all_methods = true
		allow_all_origins = false
		allowed_origins   = ["https://staging.phyt.fun"]
		max_age           = 600
	}
}

# Access policy for staging (IP-based + email domain)
resource "cloudflare_access_policy" "staging_team" {
	application_id = cloudflare_access_application.staging.id
	zone_id        = data.cloudflare_zone.main.id
	name           = "Team Access"
	precedence     = 1
	decision       = "allow"

	# Allow team members by email domain or specific IPs
	include {
		email_domain = [var.team_email_domain]
	}

	# Uncomment to add IP restrictions
	# include {
	#   ip = ["203.0.113.0/24"] # Update with your office/team IP ranges
	# }
}

# Bypass policy for health checks
resource "cloudflare_access_policy" "staging_health_bypass" {
	application_id = cloudflare_access_application.staging.id
	zone_id        = data.cloudflare_zone.main.id
	name           = "Health Check Bypass"
	precedence     = 2
	decision       = "bypass"

	include {
		any_valid_service_token = true
	}
}

# Security settings
resource "cloudflare_zone_settings_override" "security" {
	zone_id = data.cloudflare_zone.main.id

	settings {
		ssl              = "strict"
		always_use_https = "on"
		min_tls_version  = "1.2"
		security_level   = "medium"
		browser_check    = "on"
		challenge_ttl    = 1800

		# Performance
		brotli = "on"
		minify {
			css  = "on"
			html = "on"
			js   = "on"
		}

		# Security headers
		security_header {
			enabled            = true
			include_subdomains = true
			max_age            = 31536000
			nosniff            = true
			preload            = true
		}
	}
}
