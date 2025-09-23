# TODO: Make modules environment agnostic

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.12.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.8.4"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 5.0"
    }
  }
}

########################
# Providers (no static creds in code)
########################

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment  = "staging"
      ManagedBy    = "terraform"
      DeploymentId = var.deployment_id
      Project      = "phyt"
      InstanceType = "ondemand"
    }
  }
}

# Vault use VAULT_ADDR & VAULT_TOKEN from CI
provider "vault" {}

# Cloudflare provider must NOT read from a data source here.
# CI sets TF_VAR_cloudflare_api_token (or CLOUDFLARE_API_TOKEN).
variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

########################
# Secrets from Vault (data only)
########################

# Cloudflare account/zone (values used as plain strings elsewhere)
data "vault_kv_secret_v2" "cloudflare" {
  mount = "secret"
  name  = "staging/cloudflare"
}

# Tailscale ephemeral auth key for user-data
data "vault_kv_secret_v2" "tailscale" {
  mount = "secret"
  name  = "staging/tailscale"
}

# PostgreSQL database credentials
data "vault_kv_secret_v2" "postgres" {
  mount = "secret"
  name  = "staging/postgres"
}

########################
# AMI / AZs
########################

# Get latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  filter {
    name   = "architecture"
    values = ["arm64"]
  }
  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
  filter {
    name   = "image-type"
    values = ["machine"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

########################
# Networking
########################

# VPC with security-focused architecture
module "vpc" {
  source = "../../terraform/modules/vpc"

  deployment_id      = var.deployment_id
  environment        = "staging"
  availability_zones = data.aws_availability_zones.available.zone_ids

  # VPC configuration
  vpc_cidr            = "10.100.0.0/16"
  public_subnet_cidr  = "10.100.1.0/24"
  private_subnet_cidr = "10.100.2.0/24"

  # NAT route will be added separately to avoid circular dependency
  nat_network_interface_id = null
}

# Add NAT route to private subnet after both VPC and NAT gateway are created
resource "aws_route" "private_nat" {
  route_table_id         = module.vpc.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = module.nat_gateway.primary_network_interface_id

  depends_on = [module.vpc, module.nat_gateway]
}

########################
# Security & IAM
########################

# Security group for staging instance (Cloudflare Tunnel architecture)
resource "aws_security_group" "staging" {
  name_prefix = "staging-sg-"
  vpc_id      = module.vpc.vpc_id

  # NO INGRESS: nginx binds 127.0.0.1 and is exposed via Cloudflare Tunnel only
  # All public traffic comes through Cloudflare's secure tunnel

  # Cloudflare Tunnel UDP port (7844)
  egress {
    from_port   = 7844
    to_port     = 7844
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Cloudflare Tunnel UDP traffic"
  }

  # HTTPS for Cloudflare Tunnel and external APIs
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for Cloudflare Tunnel and external APIs"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution"
  }

  tags = {
    Name         = "staging-sg-${var.deployment_id}"
    Architecture = "cloudflare-tunnel"
    Security     = "no-direct-ingress"
  }
}


# Security group for PostgreSQL instance (NAT protected)
resource "aws_security_group" "postgres" {
  name_prefix = "staging-postgres-sg-"
  vpc_id      = module.vpc.vpc_id

  # INGRESS: Only allow PostgreSQL access from staging instance
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.staging.id]
    description     = "PostgreSQL access from staging instance only"
  }

  # EGRESS: Restricted outbound traffic via NAT for essential services only
  # HTTP for package updates
  egress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP for package updates via NAT"
  }

  # HTTPS for package updates and external APIs
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS for package updates via NAT"
  }

  # DNS resolution
  egress {
    from_port   = 53
    to_port     = 53
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "DNS resolution"
  }

  # NTP for time synchronization
  egress {
    from_port   = 123
    to_port     = 123
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "NTP time synchronization"
  }

  # Communication back to staging instance if needed
  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.staging.id]
    description     = "Communication back to staging instance"
  }

  tags = {
    Name = "staging-postgres-sg-${var.deployment_id}"
  }
}

# IAM role for EC2 instance
resource "aws_iam_role" "staging_instance" {
  name = "staging-instance-role-${var.deployment_id}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "staging_instance" {
  name = "staging-instance-policy"
  role = aws_iam_role.staging_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "staging" {
  name = "staging-instance-profile-${var.deployment_id}"
  role = aws_iam_role.staging_instance.name
}

########################
# EC2 instance
########################

# On-demand instance with dynamic credentials
module "staging_instance" {
  source = "../../terraform/modules/ec2"

  deployment_id = var.deployment_id
  instance_type = var.instance_type
  # spot_price           = var.spot_price
  ami_id               = data.aws_ami.ubuntu.id
  subnet_id            = module.vpc.private_subnet_id
  security_group_id    = aws_security_group.staging.id
  iam_instance_profile = aws_iam_instance_profile.staging.name
  vault_addr           = var.vault_addr

  # Cloudflare tunnel info for user-data
  cloudflare_tunnel_id    = module.cloudflare.tunnel_id
  cloudflare_tunnel_token = module.cloudflare.tunnel_token
  cloudflare_account_id   = data.vault_kv_secret_v2.cloudflare.data["ACCOUNT_ID"]

  # Tailscale ephemeral auth key
  tailscale_auth_key = data.vault_kv_secret_v2.tailscale.data["AUTH_KEY"]

  volume_size = var.volume_size
}

########################
# fck-nat instance
########################

########################
# NAT Gateway module
########################

module "nat_gateway" {
  source = "../../terraform/modules/nat"

  deployment_id        = var.deployment_id
  instance_type        = var.fck_nat_instance_type
  subnet_id            = module.vpc.public_subnet_id
  vpc_id               = module.vpc.vpc_id
  vpc_cidr             = module.vpc.vpc_cidr_block
  private_subnet_cidr  = module.vpc.private_subnet_cidr
  iam_instance_profile = aws_iam_instance_profile.staging.name

  tailscale_auth_key = data.vault_kv_secret_v2.tailscale.data["AUTH_KEY"]
}

########################
# Cloudflare tunnel module
########################

module "cloudflare" {
  source        = "../../terraform/modules/cloudflare"
  zone_id       = data.vault_kv_secret_v2.cloudflare.data["ZONE_ID"]
  account_id    = data.vault_kv_secret_v2.cloudflare.data["ACCOUNT_ID"]
  deployment_id = var.deployment_id

  # Security configuration
  allowed_ips       = var.cloudflare_allowed_ips
  blocked_countries = var.cloudflare_blocked_countries
}

########################
# PostgreSQL module
########################

module "postgres" {
  source = "../../terraform/modules/psql"

  deployment_id        = var.deployment_id
  instance_type        = var.postgres_instance_type
  ami_id               = data.aws_ami.ubuntu.id
  subnet_id            = module.vpc.private_subnet_id
  security_group_id    = aws_security_group.postgres.id
  iam_instance_profile = aws_iam_instance_profile.staging.name
  vault_addr           = var.vault_addr

  postgres_user     = data.vault_kv_secret_v2.postgres.data["POSTGRES_USER"]
  postgres_db       = data.vault_kv_secret_v2.postgres.data["POSTGRES_DB"]
  postgres_password = data.vault_kv_secret_v2.postgres.data["POSTGRES_PASSWORD"]

  tailscale_auth_key = data.vault_kv_secret_v2.tailscale.data["AUTH_KEY"]

  volume_size = var.volume_size
}
