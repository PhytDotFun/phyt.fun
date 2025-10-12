########################
# Networking (VPC)
########################
module "vpc" {
  source = "../../terraform/modules/vpc"

  environment          = var.environment
  deployment_id        = var.deployment_id
  availability_zone_id = data.aws_availability_zones.available.zone_ids[0]

  vpc_cidr           = "10.100.0.0/16"
  public_subnet_cidr = "10.100.1.0/24"
  # private_subnet_cidr = "10.100.2.0/24"
  #
  # nat_network_interface_id = null
}

########################
# VPC Network Access List (NACL)
########################
module "nacl" {
  source = "../../terraform/modules/nacl"

  environment   = var.environment
  deployment_id = var.deployment_id
  vpc_id        = module.vpc.vpc_id
  subnet_ids    = [module.vpc.public_subnet_id]

  ingress_rules = [
    {
      rule_number = 100
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 1024
      to_port     = 65535
    },
    {
      rule_number = 101
      protocol    = "udp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 1024
      to_port     = 65535
    },
    {
      rule_number = 110
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 22
      to_port     = 22
    },
    {
      rule_number = 120
      protocol    = "udp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 53
      to_port     = 53
    },
    {
      rule_number = 121
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 53
      to_port     = 53
    }
  ]

  egress_rules = [
    {
      rule_number = 100
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 443
      to_port     = 443
    },
    {
      rule_number = 101
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 80
      to_port     = 80
    },
    {
      rule_number = 110
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 7844
      to_port     = 7844
    },
    {
      rule_number = 120
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 1024
      to_port     = 65535
    },
    {
      rule_number = 121
      protocol    = "udp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 1024
      to_port     = 65535
    },
    {
      rule_number = 130
      protocol    = "tcp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 53
      to_port     = 53
    },
    {
      rule_number = 131
      protocol    = "udp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 53
      to_port     = 53
    },
    {
      rule_number = 140
      protocol    = "udp"
      rule_action = "allow"
      cidr_block  = "0.0.0.0/0"
      from_port   = 123
      to_port     = 123
    }
  ]
}

########################
# Security Groups
########################
module "sg" {
  source        = "../../terraform/modules/sg"
  environment   = var.environment
  deployment_id = var.deployment_id
  vpc_id        = module.vpc.vpc_id
}

########################
# IAM
########################
module "iam" {
  source        = "../../terraform/modules/iam"
  environment   = var.environment
  deployment_id = var.deployment_id
}

########################
# EC2 (single box staging)
########################
module "staging_instance" {
  source = "../../terraform/modules/ec2"

  environment   = var.environment
  deployment_id = var.deployment_id
  ami_id        = data.aws_ami.ubuntu.id
  subnet_id     = module.vpc.public_subnet_id
  security_group_ids = [
    module.sg.staging_sg_id,
    # module.sg.postgres_sg_id
  ]
  iam_instance_profile = module.iam.instance_profile_name

  user_data = base64encode(templatefile("${path.module}/../../terraform/modules/ec2/user-data.sh", {
    deployment_id           = var.deployment_id
    environment             = var.environment
    cloudflare_tunnel_token = module.tunnel.tunnel_token
    vault_addr              = var.vault_addr
    tailscale_auth_key      = data.vault_kv_secret_v2.tailscale.data["AUTH_KEY"]
  }))

  volume_size = 30
}

########################
# Cloudflare
########################
module "tunnel" {
  source        = "./modules/cloudflare-tunnel"
  account_id    = var.account_id
  environment   = var.environment
  deployment_id = var.deployment_id

  hostname    = "staging.phyt.fun"
  service_url = "http://localhost:8080"
}

module "dns" {
  source        = "../../terraform/modules/dns"
  environment   = var.environment
  deployment_id = var.deployment_id
  zone_id       = data.vault_kv_secret_v2.cloudflare.data["ZONE_ID"]
  tunnel_id     = module.tunnel.tunnel_id
  hostname      = "staging.phyt.fun"
}

module "waf" {
  source      = "../../terraform/modules/waf"
  environment = var.environment
  zone_id     = data.vault_kv_secret_v2.cloudflare.data["ZONE_ID"]

  hostname          = "staging.phyt.fun"
  allowed_ips       = []
  blocked_countries = []
}
