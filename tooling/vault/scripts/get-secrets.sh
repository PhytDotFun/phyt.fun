#!/bin/bash
# tooling/vault/get-secrets.sh - Get secrets for a specific app/env

set -e

APP_NAME=$1
ENV=$2

if [ -z "$APP_NAME" ] || [ -z "$ENV" ]; then
    echo "Usage: $0 <app-name> <env>"
    echo "Example: $0 hono-gateway dev"
    exit 1
fi

VAULT_ADDR="https://vault.tailea8363.ts.net:8200"
export VAULT_ADDR

if [ -z "$VAULT_TOKEN" ]; then
    echo "❌ VAULT_TOKEN not set. Run login.sh first or set up AppRole authentication"
    exit 1
fi

echo "🔍 Getting secrets for $APP_NAME in $ENV environment..."

# Get app-specific secrets
vault kv get -format=json secret/$ENV/$APP_NAME | jq -r '.data.data | to_entries | .[] | "\(.key)=\(.value)"' > .env.$APP_NAME

# Get shared secrets
vault kv get -format=json secret/shared | jq -r '.data.data | to_entries | .[] | "\(.key)=\(.value)"' >> .env.$APP_NAME

echo "✅ Secrets written to .env.$APP_NAME"