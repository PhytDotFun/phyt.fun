terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.8.4"
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
      InstanceType = "spot"
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

########################
# Networking
########################

# VPC Config
resource "aws_vpc" "staging" {
  cidr_block           = "10.100.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "staging-vpc-${var.deployment_id}"
  }
}

resource "aws_internet_gateway" "staging" {
  vpc_id = aws_vpc.staging.id

  tags = {
    Name = "staging-igw-${var.deployment_id}"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.staging.id
  cidr_block              = "10.100.1.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name = "staging-public-subnet-${var.deployment_id}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.staging.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.staging.id
  }

  tags = {
    Name = "staging-public-rt-${var.deployment_id}"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

########################
# Security & IAM
########################

# Security group
resource "aws_security_group" "staging" {
  name_prefix = "staging-sg-"
  vpc_id      = aws_vpc.staging.id

  # No ingress: nginx binds 127.0.0.1 and is exposed via Cloudflare Tunnel.
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "staging-sg-${var.deployment_id}"
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
# EC2 Spot instance
########################

# Spot instance with dynamic credentials
module "staging_instance" {
  source = "../../terraform/modules/ec2"

  deployment_id        = var.deployment_id
  instance_type        = var.instance_type
  spot_price           = var.spot_price
  ami_id               = data.aws_ami.ubuntu.id
  subnet_id            = aws_subnet.public.id
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
# Cloudflare tunnel module
########################

module "cloudflare" {
  source        = "../../terraform/modules/cloudflare"
  zone_id       = data.vault_kv_secret_v2.cloudflare.data["ZONE_ID"]
  account_id    = data.vault_kv_secret_v2.cloudflare.data["ACCOUNT_ID"]
  deployment_id = var.deployment_id
}
