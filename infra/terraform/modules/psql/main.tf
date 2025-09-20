terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.13.0"
    }
  }
}

# User data script for PostgreSQL installation
locals {
  user_data = templatefile("${path.module}/user-data.sh", {
    postgres_db_name  = var.postgres_db_name
    postgres_username = var.postgres_username
    postgres_password = var.postgres_password
    vault_addr        = var.vault_addr
  })
}

# PostgreSQL EC2 instance
resource "aws_instance" "postgresql" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  user_data                   = locals.user_data
  user_data_replace_on_change = true

  root_block_device {
    volume_type = "gp3"
    volume_size = var.volume_size
    encrypted   = true
    iops        = 3000
    throughput  = 125

    tags = {
      Name = "staging-db-volume-${var.deployment_id}"
    }
  }

  tags = {
    Name = "staging-postgresql-${var.deployment_id}"
    Type = "ephemeral-staging"
  }
}
