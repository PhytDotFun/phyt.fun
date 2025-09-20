terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# User data script for PostgreSQL installation
locals {
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    postgres_db_name  = var.postgres_db_name
    postgres_username = var.postgres_username
    postgres_password = var.postgres_password
  }))
}

# PostgreSQL EC2 instance
resource "aws_instance" "postgresql" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  user_data_base64       = local.user_data

  root_block_device {
    volume_size = var.volume_size
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "staging-postgresql-${var.deployment_id}"
  }
}
