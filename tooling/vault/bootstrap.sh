#!/usr/bin/env bash
# Bootstrap vault with userpass login and app-policy token mint
set -euo pipefail

VAULT_ADDR="${VAULT_ADDR:-https://vault.tailea8363.ts.net:8200}"
ROLE="app-reader"
TOKEN_DIR="${HOME}/.vault-tokens"

echo "Vault Bootstrap"
echo "==============="
echo "VAULT_ADDR: ${VAULT_ADDR}"
echo

# ---- Login (userpass); supports non-interactive via env vars
username="${VAULT_USER:-}"
password="${VAULT_PASS:-}"

if [[ -z "${username}" ]]; then
  read -p "Vault username: " username
fi
if [[ -z "${password}" ]]; then
  read -s -p "Vault password: " password
  echo
fi

export VAULT_ADDR
vault login -method=userpass "username=${username}" "password=${password}" >/dev/null
echo "Successfully logged in to Vault"
echo

# ---- Determine apps
apps=("$@")
if [[ ${#apps[@]} -eq 0 ]]; then
  echo "Discovering available applications..."
  if ! mapfile -t apps < <(vault kv list -format=json kv/dev/ 2>/dev/null | jq -r '.[]' | grep -v '^/$' | xargs -n1 basename); then
    echo "ERROR: Could not list kv/dev/. Either no apps yet or bootstrap policy lacks list."
    echo "TIP: Pass explicit app names: tooling/vault/bootstrap.sh hono-gateway web workers"
    exit 1
  fi
fi

if [[ ${#apps[@]} -eq 0 ]]; then
  echo "No applications found/provided. Exiting."
  exit 0
fi

echo "Found applications: ${apps[*]}"
echo

mkdir -p "${TOKEN_DIR}"
chmod 700 "${TOKEN_DIR}"

# ---- Mint tokens
for app in "${apps[@]}"; do
  policy="${app}-read"
  token_file="${TOKEN_DIR}/${app}"

  echo "Creating token for ${app} (policy=${policy}) ..."
  token_json="$(vault token create \
    -role="${ROLE}" \
    -policy="${policy}" \
    -renewable=true \
    -ttl=768h \
    -display-name="${app}-token-${username}" \
    -format=json)"

  app_token="$(jq -r '.auth.client_token' <<<"${token_json}")"
  if [[ -z "${app_token}" || "${app_token}" == "null" ]]; then
    echo "ERROR: Failed to mint token for ${app}. Check role 'app-reader' and policy '${policy}'."
    echo "-> Raw response:"
    echo "${token_json}"
    exit 1
  fi

  umask 177
  printf '%s' "${app_token}" > "${token_file}"
  chmod 600 "${token_file}"
  echo " -> wrote ${token_file}"
done

echo
echo "Done. Tokens saved in ${TOKEN_DIR}/<app>"
