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
  tags = merge(local.base_tags, var.extra_tags)
}

resource "aws_network_acl" "main" {
  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids

  tags = merge(local.tags, {
    Name = "${var.environment}-nacl"
  })
}

resource "aws_network_acl_rule" "ingress" {
  for_each = { for rule in var.ingress_rules : rule.rule_number => rule }

  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  egress         = false
  protocol       = each.value.protocol
  rule_action    = each.value.rule_action
  cidr_block     = each.value.cidr_block
  from_port      = each.value.from_port
  to_port        = each.value.to_port
}

resource "aws_network_acl_rule" "egress" {
  for_each = { for rule in var.egress_rules : rule.rule_number => rule }

  network_acl_id = aws_network_acl.main.id
  rule_number    = each.value.rule_number
  egress         = true
  protocol       = each.value.protocol
  rule_action    = each.value.rule_action
  cidr_block     = each.value.cidr_block
  from_port      = each.value.from_port
  to_port        = each.value.to_port
}
