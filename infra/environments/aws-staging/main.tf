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
  source        = "../../terraform/modules/tunnel"
  environment   = var.environment
  deployment_id = var.deployment_id
  account_id    = data.vault_kv_secret_v2.cloudflare.data["ACCOUNT_ID"]
  zone_id       = data.vault_kv_secret_v2.cloudflare.data["ZONE_ID"]
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

  hostname             = "staging.phyt.fun"
  allowed_ips          = []
  blocked_countries    = []
  enable_bot_challenge = true
  bot_score_threshold  = 30
}
