#!/bin/bash
set -e

# Log all output
exec >/var/log/user-data.log 2>&1

echo "======================================"
echo "Starting user-data script"
# shellcheck disable=SC2154 # TF will validate and render this
echo "Deployment ID: ${deployment_id}"
echo "Date: $$(date)"
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
# shellcheck disable=SC2154 # TF will validate and render this
tailscale up --auth-key="${tailscale_auth_key}" \
  --hostname="${deployment_id}" \
  --accept-routes \
  --accept-dns=false \
  --ssh \
  --advertise-tags=tag:staging
# Clear the auth key from memory
unset tailscale_auth_key

# Install Cloudflare Tunnel
# Detect architecture and download appropriate cloudflared binary
arch="$$(uname -m)"
case "$arch" in
aarch64 | arm64)
  cfd_arch="arm64"
  ;;
x86_64 | amd64)
  # shellcheck disable=SC2034 # TF will validate and render this
  cfd_arch="amd64"
  ;;
*)
  echo "Unsupported architecture: $arch"
  exit 1
  ;;
esac
wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$${cfd_arch}.deb"
dpkg -i "cloudflared-linux-$${cfd_arch}.deb"
rm "cloudflared-linux-$${cfd_arch}.deb"

# Cloudflared: use token install and DO NOT write creds.json
# shellcheck disable=SC2154 # TF will validate and render this
cloudflared service install --token "${cloudflare_tunnel_token}"
systemctl enable --now cloudflared
unset cloudflare_tunnel_token

# Install Vault
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
apt update && apt install vault -y

# Configure Vault Agent with ephemeral credentials
mkdir -p /etc/vault

# Write Vault address (not sensitive)
# shellcheck disable=SC2154 # TF will validate and render this
echo "export VAULT_ADDR=${vault_addr}" >>/etc/environment

# Spot instance termination handler (graceful shutdown only)
cat >/usr/local/bin/spot-handler.sh <<'HANDLER_SCRIPT'
#!/bin/bash
set -euo pipefail

while true; do
  if curl -s -f http://169.254.169.254/latest/meta-data/spot/termination-time >/dev/null 2>&1; then
    echo "$(date): Spot termination notice received!" >> /var/log/spot-handler.log
    # Attempt a graceful down with the staging profile
    if [ -d /opt/phyt ]; then
      cd /opt/phyt
      docker compose --profile "${COMPOSE_PROFILES:-staging}" down || true
    fi
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
unset cloudflare_tunnel_token tailscale_auth_key

# Signal completion
touch /var/lib/cloud/instance/boot-finished
echo "======================================"
echo "User-data script completed successfully"
echo "All ephemeral credentials have been used and cleared"
echo "Deployment ID: ${deployment_id}"
echo "Date: $$(date)"
echo "======================================"
