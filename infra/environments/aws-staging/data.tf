# Ubuntu AMI
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

# Availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Vault secrets
data "vault_kv_secret_v2" "cloudflare" {
  mount = "secret"
  name  = "${var.environment}/cloudflare"
}

data "vault_kv_secret_v2" "tailscale" {
  mount = "secret"
  name  = "${var.environment}/tailscale"
}
