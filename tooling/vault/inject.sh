#!/usr/bin/env bash
# Inject Vault KV‑v2 secrets then exec the given command

set -euo pipefail
[[ $# -lt 2 ]] && { echo "Usage: $0 <vault-path> <cmd…>" >&2; exit 1; }

VAULT_ADDR=${VAULT_ADDR:-https://100.118.247.114:8200}
export VAULT_SKIP_VERIFY=${VAULT_SKIP_VERIFY:-1}   # remove when TLS cert fixed

path="$1"; shift
app="$(basename "$path")"
token="$HOME/.vault-tokens/$app"
[[ -f "$token" ]] || { echo "Token $token missing"; exit 1; }

VAULT_TOKEN=$(<"$token") exec envconsul \
  -once -no-prefix -sanitize \
  -secret="kv/data/$path" \
  -- "$@"
