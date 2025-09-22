#!/bin/bash
set -euo pipefail

LOG_DIR=/var/log
LOGFILE=$LOG_DIR/user-data-nat.log
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOGFILE") 2>&1

log() { printf "[USER-DATA-NAT] [%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
err() { printf "[USER-DATA-NAT] [%s] ERROR: %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }
die() {
	err "$*"
	exit 1
}

log "======================================"
log "Starting fck-nat user-data script"
# shellcheck disable=SC2154 # TF will validate and render this
log "Deployment ID: ${deployment_id}"
log "====================================="

log "Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
systemctl enable --now tailscaled

# shellcheck disable=SC2154 # TF will validate and render this
until tailscale up --auth-key="${tailscale_auth_key}" \
	--hostname="staging-nat-${deployment_id}" \
	--accept-routes \
	--accept-dns=false \
	--ssh \
	--advertise-tags=tag:staging; do
	attempts=$((attempts + 1))
	if [ "$attempts" -ge 5 ]; then
		die "Tailscale join failed after $attempts attempts"
	fi
	log "tailscale up failed (attempt $attempts), retrying in 5s..."
	sleep 5
done
# Verify we’re actually in the tailnet
tailscale status || die "Tailscale status check failed"

unset tailscale_auth_key
