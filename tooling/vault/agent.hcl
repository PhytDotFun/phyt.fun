pid_file      = "/vault/pidfile"
disable_mlock = true
log_level     = "info"

vault {
  retry {
    num_retries = 5
    backoff     = "1s"
    max_backoff = "10s"
  }
}

listener "tcp" {
  address     = "127.0.0.1:8007"
  tls_disable = true
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path                   = "/vault/credentials/role_id"
      secret_id_file_path                 = "/vault/credentials/secret_id"
      remove_secret_id_file_after_reading = true
    }
  }
  sink "file" {
    config = {
      path = "/vault/secrets/token"
      mode = 0640
    }
  }
}

cache {
  use_auto_auth_token  = true
  enforce_consistency  = "always"
  cache_static_secrets = false
}

template {
  source               = "/vault/templates/hono-api.ctmpl"
  destination          = "/secrets/hono-api/hono-api.env"
  perms                = "0644"
  error_on_missing_key = true
  wait {
    min = "60s"
    max = "120s"
  }
}

template {
  source               = "/vault/templates/postgres.ctmpl"
  destination          = "/secrets/postgres/postgres.env"
  perms                = "0644"
  error_on_missing_key = true
  wait {
    min = "60s"
    max = "120s"
  }
}

template {
  source               = "/vault/templates/workers.ctmpl"
  destination          = "/secrets/workers/workers.env"
  perms                = "0644"
  error_on_missing_key = true
  wait {
    min = "60s"
    max = "120s"
  }
}

template {
  source               = "/vault/templates/pgbouncer.ctmpl"
  destination          = "/secrets/pgbouncer/pgbouncer.ini"
  perms                = "0640"
  error_on_missing_key = true
  wait {
    min = "60s"
    max = "120s"
  }
}
