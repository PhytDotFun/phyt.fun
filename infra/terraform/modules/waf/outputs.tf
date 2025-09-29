output "waf_ruleset_id" {
  description = "ID of the WAF ruleset"
  value       = cloudflare_ruleset.this.id
}

output "waf_ruleset_name" {
  description = "Name of the WAF ruleset"
  value       = cloudflare_ruleset.this.name
}
