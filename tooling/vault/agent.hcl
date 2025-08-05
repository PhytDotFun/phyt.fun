pid_file = "/vault/pidfile"

vault {
  address = "http://vault.tailea8363.ts.net:8200"
  tls_skip_verify = true
}

auto_auth {
  method {
    type = "approle"
    
    config = {
      role_id_file_path = "/vault/config/role-id"
      secret_id_file_path = "/vault/config/secret-id"
      remove_secret_id_file_after_reading = false
    }
  }
  
  sink {
    type = "file"
    config = {
      path = "/vault/secrets/token"
    }
  }
}

cache {
  use_auto_auth_token = true
}

listener "tcp" {
  address = "0.0.0.0:8007"
  tls_disable = true
}

template {
  source = "/vault/config/templates/postgres.tmpl.env"
  destination = "/vault/secrets/postgres.env"
  perms = "0644"
}

template {
  source = "/vault/config/templates/hono-gateway.tmpl.env"
  destination = "/vault/secrets/hono-gateway.env"
  perms = "0644"
}

template {
  source = "/vault/config/templates/workers.tmpl.env"
  destination = "/vault/secrets/workers.env"
  perms = "0644"
}