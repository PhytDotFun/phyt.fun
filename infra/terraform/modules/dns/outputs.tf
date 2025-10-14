output "record_id" {
  description = "Cloudflare record ID"
  value       = cloudflare_dns_record.tunnel.id
}

output "hostname" {
  description = "Full hostname configured"
  value       = var.hostname
}

output "fqdn" {
  description = "Fully-qualified domain name"
  value       = var.hostname
}

output "tunnel_endpoint" {
  description = "Tunnel endpoint this record points to"
  value       = cloudflare_dns_record.tunnel.content
}

output "pages_project_name" {
  description = "Pages project name (empty if not created)"
  value       = try(cloudflare_pages_project.pages[0].name, "")
}

output "pages_domain" {
  description = "Pages custom domain (empty if not created)"
  value       = try(cloudflare_pages_domain.pages_domain[0].name, "")
}
