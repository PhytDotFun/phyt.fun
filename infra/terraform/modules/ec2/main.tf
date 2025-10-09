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
    ManagedBy    = "terraform"
    DeploymentId = var.deployment_id
    Name         = "${var.environment}-app-${var.deployment_id}"
  }
  tags = merge(local.base_tags, var.tags)
}

resource "aws_instance" "app" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.security_group_ids
  iam_instance_profile        = var.iam_instance_profile
  monitoring                  = var.enable_detailed_monitoring
  associate_public_ip_address = var.associate_public_ip

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = var.volume_size
    iops        = var.volume_iops
    throughput  = var.volume_throughput
    encrypted   = true
    tags        = { Name = "${var.environment}-root-${var.deployment_id}" }
  }

  user_data_base64 = var.user_data

  user_data_replace_on_change = true

  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}
