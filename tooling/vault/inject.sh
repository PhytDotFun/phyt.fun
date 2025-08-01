#!/usr/bin/env bash
# Inject vault kv‑v2 secrets then exec the given command
set -euo pipefail

[[ $# -lt 2 ]] && { echo "Usage: $0 <vault-path> <cmd…>" >&2; exit 1; }

VAULT_ADDR=${VAULT_ADDR:-https://vault.tailea8363.ts.net:8200}
export VAULT_ADDR

path="$1"; shift
app="$(basename "$path")"
token_file="$HOME/.vault-tokens/$app"

# Check if token file exists
if [[ ! -f "$token_file" ]]; then
    echo "ERROR: Token $token_file missing"
    echo "TIP: Run './bootstrap.sh' to setup authentication"
    exit 1
fi

# Check if token is still valid
VAULT_TOKEN=$(<"$token_file")
export VAULT_TOKEN

if ! vault kv metadata get "kv/$path" >/dev/null 2>&1; then
    echo "ERROR: Token for $app cannot read kv/$path (invalid/expired or wrong policy)"
    echo "TIP: Run './bootstrap.sh' to mint a fresh $app token, or check the policy ($app-read)"
    exit 1
fi

# Check if envconsul is available
if ! command -v envconsul &> /dev/null; then
    echo "ERROR: envconsul not found. Install it with:"
    echo "   go install github.com/hashicorp/envconsul@latest"
    exit 1
fi

# Inject secrets and exec command
exec envconsul \
    -once \
    -no-prefix \
    -sanitize \
    -secret="kv/data/$path" \
    -- "$@"
