# Connect to your Tailscale network

curl -fsSL https://tailscale.com/install.sh | sh

sudo tailscale up --hostname=vault

## Serve Vault with automatic HTTPS/TLS

tailscale serve --bg --https=443 http://localhost:8200
