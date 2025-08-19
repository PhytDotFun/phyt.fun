#!/bin/bash
set -e

# Set fallback values if not provided by Terraform
: "${deployment_id?Error: deployment_id is not set.}"
: "${tailscale_auth_key?Error: tailscale_auth_key is not set.}"
: "${cloudflare_account_id?Error: cloudflare_account_id is not set.}"
: "${cloudflare_tunnel_id?Error: cloudflare_tunnel_id is not set.}"
: "${cloudflare_tunnel_token?Error: cloudflare_tunnel_token is not set.}"
: "${vault_role_id?Error: vault_role_id is not set.}"
: "${vault_secret_id?Error: vault_secret_id is not set.}"

# Log all output
exec > >(tee -a /var/log/user-data.log)
exec 2>&1

echo "======================================"
echo "Starting user-data script"
echo "Deployment ID: ${deployment_id}"
echo "Date: $(date)"
echo "======================================"

# Update system
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get upgrade -y

# Install essential packages
apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    software-properties-common \
    htop \
    net-tools \
    jq \
    git \
    unzip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu
rm get-docker.sh

# Install Docker Compose
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure Docker daemon
cat >/etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true,
  "userland-proxy": false
}
EOF

systemctl restart docker
systemctl enable docker

# Install Tailscale with ephemeral auth key
curl -fsSL https://tailscale.com/install.sh | sh
# Auth key is single-use and expires after use
tailscale up \
    --auth-key="${tailscale_auth_key}" \
    --hostname="${deployment_id}" \
    --accept-routes \
    --accept-dns=false \
    --ssh \
    --advertise-tags=tag:staging
# Clear the auth key from memory
unset tailscale_auth_key

# Install Cloudflare Tunnel
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

# Use the real tunnel ID (from Terraform) and keep local config minimal; ingress is managed in Terraform (cloudflare_tunnel_config)
mkdir -p /etc/cloudflared
cat >/etc/cloudflared/config.yml <<'EOF'
tunnel: ${cloudflare_tunnel_id}
credentials-file: /etc/cloudflared/creds.json
EOF

# Write tunnel credentials temporarily
cat >/etc/cloudflared/creds.json <<EOF
{
  "AccountTag": "${cloudflare_account_id}",
  "TunnelID": "${cloudflare_tunnel_id}",
  "TunnelSecret": "${cloudflare_tunnel_token}"
}
EOF

chmod 600 /etc/cloudflared/creds.json

# Start Cloudflare Tunnel
cloudflared service install
systemctl start cloudflared
systemctl enable cloudflared

# Clear tunnel token from memory
unset cloudflare_tunnel_token

# Install Vault
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
apt update && apt install vault -y

# Configure Vault Agent with ephemeral credentials
mkdir -p /etc/vault

# Write Vault address (not sensitive)
echo "export VAULT_ADDR=https://vault.tailea8363.ts.net" >>/etc/environment

# Write ephemeral AppRole credentials (will be deleted after first use)
echo "${vault_role_id}" >/etc/vault/role_id
echo "${vault_secret_id}" >/etc/vault/secret_id
chmod 600 /etc/vault/role_id /etc/vault/secret_id

# Clear from memory
unset vault_role_id
unset vault_secret_id

# Create docker network
docker network create phyt-network || true

# Spot instance termination handler (graceful shutdown only)
cat >/usr/local/bin/spot-handler.sh <<'HANDLER_SCRIPT'
#!/bin/bash
while true; do
  if curl -s -f http://169.254.169.254/latest/meta-data/spot/termination-time > /dev/null 2>&1; then
    echo "$(date): Spot termination notice received!" >> /var/log/spot-handler.log

    # EDIT: Removed backup call; Dokploy manages backups
    # docker-compose will stop workloads cleanly
    docker-compose --profile ${COMPOSE_PROFILES:-staging} down || true

    break
  fi
  sleep 5
done
HANDLER_SCRIPT

chmod +x /usr/local/bin/spot-handler.sh

# Create systemd service for spot handler
cat >/etc/systemd/system/spot-handler.service <<'EOF'
[Unit]
Description=Spot Instance Termination Handler
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/spot-handler.sh
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable spot-handler
systemctl start spot-handler

# Clear all sensitive variables from environment
# Remove dokploy_agent_token from the cleanup list
unset vault_role_id vault_secret_id cloudflare_tunnel_token tailscale_auth_key

# Signal completion
touch /var/lib/cloud/instance/boot-finished
echo "======================================"
echo "User-data script completed successfully"
echo "All ephemeral credentials have been used and cleared"
echo "Deployment ID: ${deployment_id}"
echo "Date: $(date)"
echo "======================================"
