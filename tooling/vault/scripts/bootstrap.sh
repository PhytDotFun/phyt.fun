#!/usr/bin/env sh
set -eu

# Add signal trapping for clean exit
trap 'echo "\nScript interrupted. Exiting..."; exit 130' INT TERM

VAULT_ADDR="${VAULT_ADDR:-https://vault.tailea8363.ts.net}"
export VAULT_ADDR
VAULT_ROLE_NAME="${VAULT_ROLE_NAME:-dev-app}"
OUT_DIR="${OUT_DIR:-${CREDENTIALS_DIR:-tooling/vault/credentials}}"

command -v vault >/dev/null 2>&1 || { echo "vault CLI not found"; exit 127; }

login_ok() { vault token lookup >/dev/null 2>&1; }

if ! login_ok; then
    echo "Not logged in to Vault at $VAULT_ADDR."
    
    while :; do
        printf "Login method [oidc/token/userpass] (default: oidc): "
        
        # Remove || true to allow proper signal handling
        if ! read -r method; then
            echo "\nInput interrupted. Exiting..."
            exit 130
        fi
        
        method="${method:-oidc}"
        
        if [ "$method" = "oidc" ]; then
            if vault login -method=oidc; then
                break
            else
                echo "Login failed."
            fi
        elif [ "$method" = "token" ]; then
            printf "Paste token: "
            if ! read -r token; then
                echo "\nInput interrupted. Exiting..."
                exit 130
            fi
            if VAULT_TOKEN="$token" vault token lookup >/dev/null 2>&1; then
                export VAULT_TOKEN="$token"
                break
            else
                echo "Invalid token."
            fi
        elif [ "$method" = "userpass" ]; then
            printf "Username: "
            if ! read -r u; then
                echo "\nInput interrupted. Exiting..."
                exit 130
            fi
            printf "Password: "
            stty -echo
            if ! read -r p; then
                stty echo
                echo "\nInput interrupted. Exiting..."
                exit 130
            fi
            stty echo
            echo
            if vault login -method=userpass username="$u" password="$p"; then
                break
            else
                echo "Login failed."
            fi
        else
            echo "Unknown method."
        fi
    done
fi

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

ROLE_ID="$(vault read -field=role_id "auth/approle/role/$VAULT_ROLE_NAME/role-id")"
SECRET_ID="$(vault write -f -field=secret_id "auth/approle/role/$VAULT_ROLE_NAME/secret-id")"

printf "%s" "$ROLE_ID" > "$OUT_DIR/role-id"
printf "%s" "$SECRET_ID" > "$OUT_DIR/secret-id"

chmod 600 "$OUT_DIR/role-id" "$OUT_DIR/secret-id"
echo "Wrote role-id and secret-id to $OUT_DIR"