packer {
    required_plugins {
        amazon = {
            version = ">= 1.2.0"
            source = "github.com/hashicorp/amazon"
        }
    }
}

source "amazon-ebs" "staging" {
    ami_name = "phyt-staging-{{timestamp}}"
    instance_type = "t3.medium"
    region = "us-east-1"

    source_ami_filter {
        filters = {
            name = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
            root-device-type = "ebs"
            virtualization-type = "hvm"
        }
        most_recent = true
        owners = ["099720109477"]
    }

    ssh_username = "ubuntu"

    tags = {
        Name = "phyt-staging-ami"
        base = "Ubuntu 22.04"
        Environment = "staging"
        BuildDate = "{{timestamp}}"
    }
}

build {
    sources = ["source.amazon-ebs.staging"]

    provisioner "shell" {
        script = "../terraform/modules/ec2/user-data.sh"
        environment_vars = [
            "deployment_id=packer-build",
            "vault_addr=placeholder",
            "vault_role_id=placeholder",
            "vault_secret_id=placeholder",
            "cloudflare_tunnel_token=placeholder",
            "cloudflare_account_id=placeholder",
            "tailscale_auth_key=placeholder"
        ]
    }

    provisioner "shell" {
        inline = [
            "sudo apt-get clean",
            "sudo rm -rf /var/lib/apt/lists/*",
            "sudo rm -rf /tmp/*",
            "sudo rm -rf /var/tmp/*",
            "sudo truncate -s 0 /var/log/*.log"
        ]
    }
}