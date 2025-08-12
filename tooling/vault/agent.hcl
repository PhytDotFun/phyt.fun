pid_file = "/vault/pidfile"
disable_mlock = true

vault {
    address = "https://vault.tailea8363.ts.net"
}

listener "tcp" {
    address = "127.0.0.1:8007"
    tls_disable = true
}

auto_auth {
    method "approle" {
        mount_path = "auth/approle"
        config = {
            role_id_file_path = "/vault/credentials/role-id"
            secret_id_file_path = "/vault/credentials/secret-id"
            remove_secret_id_file_after_reading = false
        }
    }

    sink "file" {
        config = {
            path = "/vault/secrets/token"
        }
    }
}

cache {
    use_auto_auth_token = true
}

template {
    source = "/vault/templates/postgres.tmpl.env"
    destination = "/vault/secrets/postgres.env"
    perms = "0644"
}

template {
    source = "/vault/templates/hono-api.tmpl.env"
    destination = "/vault/secrets/hono-api.env"
    perms = "0644"
}

template {
    source = "/vault/templates/workers.tmpl.env"
    destination = "/vault/secrets/workers.env"
    perms = "0644"
}

template {
    source = "/vault/templates/web.tmpl.env"
    destination = "/vault/secrets/web.env"
    perms = "0644"
}
