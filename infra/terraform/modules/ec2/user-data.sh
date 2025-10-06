#!/bin/bash
set -euo pipefail

LOG_DIR=/var/log
LOGFILE=$LOG_DIR/user-data.log
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOGFILE") 2>&1

log() { printf "[USER-DATA] [%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
err() { printf "[USER-DATA] [%s] ERROR: %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }
die() {
	err "$*"
	exit 1
}

log "======================================"
log "Starting staging user-data script"
# shellcheck disable=SC2154 # TF will validate and render this
log "Deployment ID: ${deployment_id}"
log "====================================="

export DEBIAN_FRONTEND=noninteractive
log "Updating package lists..."
apt-get update
log "Upgrading packages..."
apt-get upgrade -y

log "Installing required packages..."
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
log "Package installation completed"

log "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh || die "Docker installation failed"
log "Docker installation completed"
log "Adding ubuntu user to docker group..."
usermod -aG docker ubuntu
rm get-docker.sh

log "Configuring Docker daemon..."
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

log "Starting Docker service..."
systemctl restart docker
systemctl enable docker
log "Docker ready"

log "Installing Postgres..."
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE phyt_staging;"
log "Postgres database created (user setup deferred)"

log "Configuring Postgres network access..."
# Listen on localhost + docker bridge gateway
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost,172.20.0.1'/" /etc/postgresql/*/main/postgresql.conf

echo "host all all 172.20.0.0/16 md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

sudo systemctl reload postgresql
log "PostgreSQL network configuration complete"

log "Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
systemctl enable --now tailscaled
attempts=0

# shellcheck disable=SC2154 # TF will validate and render this
until tailscale up \
	--auth-key="${tailscale_auth_key}" \
	--hostname="${environment}-app-${deployment_id}" \
	--accept-routes \
	--accept-dns=false \
	--ssh \
	--advertise-tags="tag:${environment}"; do
	attempts=$((attempts + 1))
	if [ "$attempts" -ge 5 ]; then
		die "Tailscale join failed after $attempts attempts"
	fi
	log "tailscale up failed (attempt $attempts), retrying in 5s…"
	sleep 5
done
# Verify we’re actually in the tailnet
tailscale status || die "Tailscale status check failed"

unset tailscale_auth_key

# Detect architecture and download appropriate cloudflared binary
log "Installing cloudflared…"
arch="$(uname -m)"
case "$arch" in
aarch64 | arm64) cfd_arch="arm64" ;;
x86_64 | amd64) cfd_arch="amd64" ;;
*) die "Unsupported architecture: $arch" ;;
esac
wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$${cfd_arch}.deb"
dpkg -i "cloudflared-linux-$${cfd_arch}.deb" || apt-get -y -f install
rm -f "cloudflared-linux-$${cfd_arch}.deb"

# Cloudflare token install
log "Configuring Cloudflared service..."
# shellcheck disable=SC2154 # TF will validate and render this
cloudflared service install --token "${cloudflare_tunnel_token}"
systemctl enable --now cloudflared
unset cloudflare_tunnel_token

# Configure Vault Agent with ephemeral credentials
log "Configuring Vault..."
mkdir -p /etc/vault

# shellcheck disable=SC2154 # TF will validate and render this
echo "export VAULT_ADDR=${vault_addr}" >>/etc/environment

# Spot instance termination handler (graceful shutdown only)
# cat >/usr/local/bin/spot-handler.sh <<'HANDLER_SCRIPT'
# #!/bin/bash
# set -euo pipefail
#
# while true; do
#   if curl -s -f http://169.254.169.254/latest/meta-data/spot/termination-time >/dev/null 2>&1; then
#     echo "$(date): Spot termination notice received!" >> /var/log/spot-handler.log
#     # Attempt a graceful down with the staging profile
#     if [ -d /opt/phyt ]; then
#       cd /opt/phyt
#       docker compose --profile "$${COMPOSE_PROFILES:-staging}" down || true
#     fi
#     break
#   fi
#   sleep 5
# done
# HANDLER_SCRIPT
# chmod +x /usr/local/bin/spot-handler.sh

# Create systemd service for spot handler
# cat >/etc/systemd/system/spot-handler.service <<'EOF'
# [Unit]
# Description=Spot Instance Termination Handler
# After=network.target
#
# [Service]
# Type=simple
# ExecStart=/usr/local/bin/spot-handler.sh
# Restart=always
# RestartSec=5
# StandardOutput=journal
# StandardError=journal
#
# [Install]
# WantedBy=multi-user.target
# EOF
#
# systemctl daemon-reload
# systemctl enable spot-handler
# systemctl start spot-handler

unset cloudflare_tunnel_token tailscale_auth_key

touch /var/lib/cloud/instance/boot-finished
log "======================================"
log "Staging user-data script completed successfully"
log "Deployment ID: ${deployment_id}"
log "======================================"
