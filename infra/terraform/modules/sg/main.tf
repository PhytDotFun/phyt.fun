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
  description = "Security group for staging app EC2 box"
  vpc_id      = var.vpc_id

  # no ingress

  # just allow all outbound (restrict w/ NACL)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  lifecycle { create_before_destroy = true }
  revoke_rules_on_delete = true
  timeouts { delete = "10m" }

  tags = merge(local.base_tags, {
    Name = "${var.environment}-app-sg"
  }, var.extra_tags)
}

# PostgreSQL security group (for database access)
# resource "aws_security_group" "postgres" {
#   name_prefix = "${var.environment}-postgres-sg-"
#   description = "Security group for PostgreSQL database access"
#   vpc_id      = var.vpc_id
#
#   # PostgreSQL access from app security group
#   ingress {
#     from_port       = 5432
#     to_port         = 5432
#     protocol        = "tcp"
#     security_groups = [aws_security_group.app.id]
#     description     = "PostgreSQL access from app"
#   }
#
#   # No egress rules - PostgreSQL typically doesn't need outbound connections
#
#   lifecycle { create_before_destroy = true }
#   revoke_rules_on_delete = true
#   timeouts { delete = "10m" }
#
#   tags = merge(local.base_tags, {
#     Name = "${var.environment}-postgres-sg"
#   }, var.extra_tags)
# }
