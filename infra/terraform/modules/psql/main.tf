terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
  }
}


# PostgreSQL EC2 instance
resource "aws_instance" "postgres" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.iam_instance_profile

  user_data = templatefile("${path.module}/user-data.sh", {
    deployment_id      = var.deployment_id
    tailscale_auth_key = var.tailscale_auth_key
    postgres_db        = var.postgres_db
    postgres_user      = var.postgres_user
    postgres_password  = var.postgres_password
    vault_addr         = var.vault_addr
  })

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
    Name = "staging-postgres-${var.deployment_id}"
    Type = "ephemeral-staging"
  }
}
