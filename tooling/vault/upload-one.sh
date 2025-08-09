#!/usr/bin/env bash
# Usage: upload-one.sh packages/api            (looks for .env in that directory)
#        upload-one.sh packages/api .env.local (explicit filename)

set -euo pipefail

pkg_dir="$1"                         # e.g. packages/api
env_file="${2:-.env}"                # default .env
full_path="$pkg_dir/$env_file"       # packages/api/.env

if [[ ! -f "$full_path" ]]; then
  echo "⚠︎  $full_path not found — skipping."
  exit 0
fi

pkg_name=$(basename "$pkg_dir")      # api
vault_path="kv/dev/$pkg_name"        # kv/dev/api

# Build key=value args for `vault kv put`
args=()
while IFS='=' read -r k v; do
  [[ -z "$k" || "$k" =~ ^# ]] && continue   # skip blanks & comments
  args+=("$k=$v")
done < "$full_path"

if (( ${#args[@]} == 0 )); then
  echo "⚠︎  $full_path has no valid lines — skipping."
  exit 0
fi

echo "→  $vault_path  (${#args[@]} keys)"
vault kv put "$vault_path" "${args[@]}"
