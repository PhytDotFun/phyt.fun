terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
  }
}

locals {
  base_tags = {
    Environment  = var.environment
    DeploymentId = var.deployment_id
    ManagedBy    = "terraform"
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${var.environment}-app-sg-"
  description = "Egress-only SG for app host behind Cloudflare Tunnel"
  vpc_id      = var.vpc_id

  # Intentionally no ingress (all access via outbound Cloudflare Tunnel)

  # Cloudflare Tunnel QUIC
  egress {
    from_port   = 7844
    to_port     = 7844
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Cloudflare Tunnel (QUIC)"
  }

  # HTTPS (cloudflared, SaaS APIs, SSM, package repos over TLS)
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # DNS
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS"
  }

  # Optional: HTTP for package mirrors
  dynamic "egress" {
    for_each = var.allow_http_egress ? [1] : []
    content {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP (package mirrors)"
    }
  }

  lifecycle { create_before_destroy = true }
  revoke_rules_on_delete = true
  timeouts { delete = "10m" }

  tags = merge(local.base_tags, {
    Name = "${var.environment}-app-sg"
  }, var.extra_tags)
}

# PostgreSQL security group (for database access)
resource "aws_security_group" "postgres" {
  name_prefix = "${var.environment}-postgres-sg-"
  description = "Security group for PostgreSQL database access"
  vpc_id      = var.vpc_id

  # PostgreSQL access from app security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL access from app"
  }

  # No egress rules - PostgreSQL typically doesn't need outbound connections

  lifecycle { create_before_destroy = true }
  revoke_rules_on_delete = true
  timeouts { delete = "10m" }

  tags = merge(local.base_tags, {
    Name = "${var.environment}-postgres-sg"
  }, var.extra_tags)
}
