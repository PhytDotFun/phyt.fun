variable "deployment_id" {
    description = "Unique deployment identifier"
    type = string
}

variable "instance_type" {
    description = "EC2 instance type"
    type = string
}

variable "spot_price" {
    description = "Maximum spot price"
    type = string
}

variable "ami_id" {
    description = "AMI ID for the instance"
    type = string
}

variable "subnet_id" {
    description = "Subnet ID for the instance"
    type = string
}

variable "security_group_id" {
    description = "Security group ID"
    type = string
}

variable "iam_instance_profile" {
    description = "IAM instance profile name"
    type = string
}

variable "vault_role_id" {
    description = "Vault AppRole role ID (ephemeral)"
    type = string
    sensitive = true
}

variable "vault_secret_id" {
    description = "Vault AppRole secret ID (single-use)"
    type = string
    sensitive = true
}

variable "cloudflare_tunnel_token" {
    description = "Cloudflare tunnel token (ephemeral)"
    type = string
    sensitive = true
}

variable "cloudflare_account_id" {
    description = "Cloudflare account ID"
    type = string
}

# Tunnel ID used to populate cloudflared creds.json on the instance
variable "cloudflare_tunnel_id" {
    description = "Cloudflare tunnel ID"
    type = string
}

variable "tailscale_auth_key" {
    description = "Tailscale auth key (single-use)"
    type = string
    sensitive = true
}

variable "volume_size" {
    description = "Root volume size in GB"
    type = number
    default = 30
}
