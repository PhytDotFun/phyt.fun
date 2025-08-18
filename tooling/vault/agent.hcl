pid_file = "/vault/pidfile"
disable_mlock = true
log_level = "info"

vault {
    address = "https://vault.tailea8363.ts.net"
    retry {
        num_retries = 5
    }
}

listener "tcp" {
    address = "127.0.0.1:8007"
    tls_disable = true
}

auto_auth {
    method "approle" {
        mount_path = "auth/approle"
        config = {
            role_id_file_path = "/vault/credentials/role_id"
            secret_id_file_path = "/vault/credentials/secret_id"
            # Secret ID is single us
            remove_secret_id_file_after_reading = true
        }
    }

    sink "file" {
        config = {
            path = "/vault/secrets/token"
            mode = 0640
            delete_after_reading = true
        }
    }
}

# Minimal cache
cache {
    use_auto_auth_token = true
    enforce_consistency = "always"
    cache_static_secrets = false
}

# Write templates to tmpfs (RAM) and refresh frequently
template {
    source = "/vault/templates/hono-api.ctmpl"
    destination = "/vault/secrets/hono-api.env"
    perms = "0644"
    # Refresh every 60 seconds
    wait { min = "60s"; max = "120s" }
}

template {
    source = "/vault/templates/postgres.ctmpl"
    destination = "/vault/secrets/postgres.env"
    perms = "0644"
    wait { min = "60s"; max = "120s" }
}

template {
    source = "/vault/templates/workers.ctmpl"
    destination = "/vault/secrets/workers.env"
    perms = "0644"
    wait { min = "60s"; max = "120s" }
}

template {
    source      = "/vault/templates/pgbouncer.ctmpl"
    destination = "/vault/secrets/pgbouncer.ini"
    perms       = "0600"
    wait { min = "60s"; max = "120s" }
}