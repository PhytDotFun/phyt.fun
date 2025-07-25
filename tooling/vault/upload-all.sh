#!/usr/bin/env bash
# Walks apps/* and packages/*, uploads any .env it finds to kv/dev/<folder>

set -euo pipefail
shopt -s nullglob

root=$(git rev-parse --show-toplevel)

for dir in "$root"/apps/* "$root"/packages/*; do
  [[ -d "$dir" ]] || continue
  if [[ -f "$dir/.env" ]]; then
    tooling/vault/upload-one.sh "$dir" .env
  else
    echo "⚠︎  no .env in $(basename "$dir") — skipped."
  fi
done
