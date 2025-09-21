#!/bin/bash
set -euo pipefail

LOG_DIR=/var/log
LOGFILE=$LOG_DIR/user-data-db.log
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOGFILE") 2>&1

log() { printf "[USER-DATA-DB] [%s] %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
err() { printf "[USER-DATA-DB] [%s] ERROR: %s\n" "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }
die() {
	err "$*"
	exit 1
}

log "======================================"
log "Starting Postgres user-data script"
# shellcheck disable=SC2154 # TF will validate and render this
log "Deployment ID: ${deployment_id}"
log "====================================="

# shellcheck disable=SC2154 # TF will validate and render this
# shellcheck disable=SC2034 # Used in heredoc with $${POSTGRES_DB} syntax
POSTGRES_DB="${postgres_db}"

# shellcheck disable=SC2154 # TF will validate and render this
# shellcheck disable=SC2034 # Used in heredoc with $${POSTGRES_USER} syntax
POSTGRES_USER="${postgres_user}"

# shellcheck disable=SC2154 # TF will validate and render this
# shellcheck disable=SC2034 # Used in heredoc with $${POSTGRES_PASSWORD} syntax
POSTGRES_PASSWORD="${postgres_password}"

apt-get update -y

apt-get install -y postgresql postgresql-contrib

systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -v ON_ERROR_STOP=1 <<EOF
-- Create database
CREATE DATABASE "$${POSTGRES_DB}";

-- Create user with password
CREATE ROLE "$${POSTGRES_USER}" WITH LOGIN PASSWORD '$${POSTGRES_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "$${POSTGRES_DB}" TO "$${POSTGRES_USER}";

-- Allow user to create databases (optional)
ALTER ROLE "$${POSTGRES_USER}" CREATEDB;
EOF

# Configure PostgreSQL to listen on all addresses
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Configure authentication for the application user
cat >>/etc/postgresql/*/main/pg_hba.conf <<EOF

# Allow application user from VPC
host    $${POSTGRES_DB}    $${POSTGRES_USER}    10.100.0.0/16    md5
EOF

# Restart PostgreSQL to apply configuration changes
systemctl restart postgresql

touch /var/lib/cloud/instance/boot-finished
log "======================================"
log "Postgres user-data script completed successfully"
log "Deployment ID: ${deployment_id}"
log "======================================"
