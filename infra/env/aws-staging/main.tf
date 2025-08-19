terraform {
    required_version = ">= 1.6.0"

    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = "~> 5.0"
        }
        cloudflare = {
            source = "cloudflare/cloudflare"
            version = "~> 4.0"
        }
        vault = {
            source = "hashicorp/vault"
            version = "~> 3.0"
        }
    }
}

# Providers use data sources - no stored credentials
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

provider "vault" {}

# Fetch Cloudflare credentials from Vault at runtime
data "vault_generic_secret" "cloudflare" {
    path = "secret/cloudflare/staging"
}

provider "cloudflare" {
    api_token = data.vault_generic_secret.cloudflare
}

# Fetch AWS deployment keys from Vault at runtime
data "vault_generic_secret" "aws_keys" {
  path = "secret/aws/staging/approle"
}

# Fetch Tailscale auth from Vault at runtime
data "vault_generic_secret" "tailscale" {
  path = "secret/tailscale/staging"
}

# Get latest Ubuntu AMI
data "aws_ami" "ubuntu" {
    most_recent = true
    owners = ["099720109477"] # Canonical

    filter {
        name = "name"
        values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
    }

    filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Config
resource "aws_vpc" "staging" {
    cidr_block = "10.100.0.0/16"
    enable_dns_hostnames = true
    enable_dns_support = true

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
  availability_zone       = data.aws_availability_zones.available.names[0]
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
    subnet_id = aws_subnet.public.id
    route_table_id = aws_route_table.public.id
}

# Security group
resource "aws_security_group" "staging" {
    name_prefix = "staging-sg-"
    vpc_id = aws_vpc.staging.id

    # Removed dead/unsafe ingress (no 127.0.0.1/32, no SSH—Tailscale handles SSH)
    # Intentionally no ingress because nginx listens on loopback and is reached via tunnel.

    egress {
        from_port = 0
        to_port = 0
        protocol = "-1"
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

# Generate vault approle credentials for this deployment
resource "vault_approle_auth_backend_role" "staging" {
    backend = "approle"
    role_name = "staging-${var.deployment_id}"
    token_policies = ["staging-policy"]

    # Very short TTL
    token_ttl = 300
    token_max_ttl = 600
}

resource "vault_approle_auth_backend_role_secret_id" "staging" {
    backend = vault_approle_auth_backend_role.staging.backend
    role_name = vault_approle_auth_backend_role.staging.role_name

    # Secret ID also has TTL
    cidr_list = ["100.64.0.0/10"] # Allow AppRole login from the tailnet (100.64.0.0/10), not the VPC CIDR
    metadata = jsonencode({
        deployment_id = var.deployment_id
    })
}

# Spot instance with dynamic credentials
module "staging_instance" {
    source = "../../terraform/modules/ec2"

    deployment_id         = var.deployment_id
    instance_type         = var.instance_type
    spot_price            = var.spot_price
    ami_id                = data.aws_ami.ubuntu.id
    subnet_id             = aws_subnet.public.id
    security_group_id     = aws_security_group.staging.id
    iam_instance_profile  = aws_iam_instance_profile.staging.name

    # Vault credentials are ephemeral 
    vault_role_id   = vault_approle_auth_backend_role.staging.role_id
    vault_secret_id = vault_approle_auth_backend_role_secret_id.staging.secret_id

    # Pass tunnel ID so user-data can write correct cloudflared credentials
    cloudflare_tunnel_id    = module.cloudflare.tunnel_id

    # Cloudflare and other credentials fetched from Vault at runtime
    cloudflare_tunnel_token = module.cloudflare.tunnel_token
    cloudflare_account_id   = data.vault_generic_secret.cloudflare.data["account_id"]
    tailscale_auth_key      = data.vault_generic_secret.tailscale.data["auth_key"]

    volume_size = var.volume_size
}

# Cloudflare config
module "cloudflare" {
    source = "../../terraform/modules/cloudflare"
    
    zone_id = data.vault_generic_secret.cloudflare.data["zone_id"]
    account_id    = data.vault_generic_secret.cloudflare.data["account_id"]
    deployment_id = var.deployment_id
}

# Vault config with dynamic secrets
module "vault" {
    source = "../../terraform/modules/vault"

    deployment_id = var.deployment_id
    instance_ip = module.staging_instance.private_ip
}
