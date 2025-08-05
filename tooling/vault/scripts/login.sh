set -e

VAULT_ADDR="https://vault.tailea8363.ts.net:8200"
export VAULT_ADDR

if [ -z "$VAULT_USERNAME" ] || [ -z "$VAULT_PASSWORD" ]; then
    echo "❌ Please set VAULT_USERNAME and VAULT_PASSWORD environment variables"
    exit 1
fi

echo "🔐 Logging into Vault..."
VAULT_TOKEN=$(vault auth -method=userpass username="$VAULT_USERNAME" password="$VAULT_PASSWORD" -format=json | jq -r '.auth.client_token')

if [ "$VAULT_TOKEN" != "null" ] && [ -n "$VAULT_TOKEN" ]; then
    export VAULT_TOKEN
    echo "✅ Logged in successfully"
    echo "export VAULT_TOKEN=$VAULT_TOKEN"
    echo "export VAULT_ADDR=$VAULT_ADDR"
else
    echo "❌ Login failed"
    exit 1
fi