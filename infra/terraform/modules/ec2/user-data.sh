#!/bin/bash
set -euo pipefail

LOG_DIR=/var/log/phyt
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
# shellcheck disable=SC2154 # TF will validate and template this
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

log "Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
systemctl enable --now tailscaled
attempts=0

# shellcheck disable=SC2154 # TF will validate and template this
until tailscale up \
	--auth-key="${tailscale_auth_key}" \
	--hostname="${environment}-app-${deployment_id}" \
	--accept-routes \
	--accept-dns=true \
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
x86_64 | amd64)
	# shellcheck disable=SC2034 # TF will validate and template this
	cfd_arch="amd64"
	;;
*) die "Unsupported architecture: $arch" ;;
esac
wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$${cfd_arch}.deb"
dpkg -i "cloudflared-linux-$${cfd_arch}.deb" || apt-get -y -f install
rm -f "cloudflared-linux-$${cfd_arch}.deb"

# Cloudflare token install
log "Configuring Cloudflared service (token-run)…"
# Write token to a root-only env file
install -d -m 0755 /etc/cloudflared
install -m 0600 /dev/null /etc/cloudflared/env
# shellcheck disable=SC2154 # TF will validate and template this
echo "TUNNEL_TOKEN=${cloudflare_tunnel_token}" >/etc/cloudflared/env
unset cloudflare_tunnel_token

# Create a simple systemd unit that runs the tunnel via token
cat >/etc/systemd/system/cloudflared.service <<'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=/etc/cloudflared/env
ExecStart=/usr/bin/cloudflared --no-autoupdate --loglevel debug --protocol http2 tunnel run --token $${TUNNEL_TOKEN}
Restart=on-failure
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now cloudflared
log "Cloudflared service started"

# Configure Vault Agent with ephemeral credentials
log "Configuring Vault..."
mkdir -p /etc/vault

# shellcheck disable=SC2154 # TF will validate and template this
echo "export VAULT_ADDR=${vault_addr}" >>/etc/environment

unset cloudflare_tunnel_token tailscale_auth_key

touch /var/lib/cloud/instance/boot-finished
log "======================================"
log "Staging user-data script completed successfully"
log "======================================"
