#!/usr/bin/env bash
# Bootstrap script for new team members to setup Vault access
set -euo pipefail

VAULT_ADDR=${VAULT_ADDR:-https://vault.tailea8363.ts.net:8200}
TOKEN_DIR="$HOME/.vault-tokens"

echo "Vault Bootstrap Script"
echo "======================"
echo "This script will help you authenticate with Vault and setup local tokens."
echo ""

# Check if vault CLI is installed
if ! command -v vault &> /dev/null; then
    echo "ERROR: Vault CLI not found. Please install it first:"
    echo "   https://developer.hashicorp.com/vault/downloads"
    exit 1
fi

# Set Vault address
export VAULT_ADDR

# Test Vault connectivity
echo "Testing Vault connectivity..."
if ! vault status &> /dev/null; then
    echo "ERROR: Cannot connect to Vault at $VAULT_ADDR"
    echo "   Make sure Tailscale is connected and Vault is running"
    exit 1
fi

echo "Connected to Vault successfully"
echo ""

# Prompt for username
read -p "Enter your Vault username: " username

# Login
echo "Logging in to Vault..."
if ! vault login -method=userpass username="$username"; then
    echo "ERROR: Login failed"
    exit 1
fi

echo "Successfully logged in to Vault"
echo ""

# Create token directory
mkdir -p "$TOKEN_DIR"

# Get current token
current_token=$(vault print token)

# List available secrets and create app-specific tokens
echo "Discovering available applications..."
apps=($(vault kv list -format=json kv/dev/ | jq -r '.[]' | grep -v '^/$'))

if [[ ${#apps[@]} -eq 0 ]]; then
    echo "WARNING: No applications found in kv/dev/ path"
    echo "   Your admin needs to add secrets first"
    exit 0
fi

echo "Found applications: ${apps[*]}"
echo ""

# Create app-specific tokens
echo "Creating app-specific tokens..."
for app in "${apps[@]}"; do
    app_name=$(basename "$app")
    token_file="$TOKEN_DIR/$app_name"
    app_policy="${app_name}-read"
    
    # Check if the policy exists
    if ! vault policy read "$app_policy" &> /dev/null; then
        echo "WARNING: Policy $app_policy not found, skipping $app_name"
        continue
    fi
    
    # Create a renewable token for this app with its specific read policy
    app_token=$(vault token create \
        -renewable=true \
        -ttl=768h \
        -policy="$app_policy" \
        -display-name="$app_name-token-$USER" \
        -format=json | jq -r '.auth.client_token')
    
    echo "$app_token" > "$token_file"
    chmod 600 "$token_file"
    
    echo "Created token for $app_name -> $token_file (policy: $app_policy)"
done

echo ""
echo "Bootstrap complete!"
echo ""
echo "What was created:"
echo "   - Authenticated with Vault using your username/password"
echo "   - Created app-specific tokens in $TOKEN_DIR/"
echo "   - Set proper permissions on token files"
echo ""
echo "You can now run: pnpm run dev"
echo ""
echo "Tips:"
echo "   - Tokens are valid for 768 hours (32 days)"
echo "   - Run this script again when tokens expire"
echo "   - Keep your Vault password secure"
