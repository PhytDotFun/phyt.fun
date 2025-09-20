#!/bin/bash
set -euo pipefail

# Variables from Terraform
POSTGRES_DB_NAME="${postgres_db_name}"
POSTGRES_USERNAME="${postgres_username}"
POSTGRES_PASSWORD="${postgres_password}"

# Update system
apt-get update -y

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE ${POSTGRES_DB_NAME};

-- Create user with password
CREATE USER ${POSTGRES_USERNAME} WITH PASSWORD '${POSTGRES_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB_NAME} TO ${POSTGRES_USERNAME};

-- Allow user to create databases (for testing)
ALTER USER ${POSTGRES_USERNAME} CREATEDB;

-- Exit
\q
EOF

# Configure PostgreSQL to listen on all addresses
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Configure authentication for the application user
cat >> /etc/postgresql/*/main/pg_hba.conf << EOF

# Allow application user from VPC
host    ${POSTGRES_DB_NAME}    ${POSTGRES_USERNAME}    10.100.0.0/16    md5
EOF

# Restart PostgreSQL to apply configuration changes
systemctl restart postgresql

# Log completion
echo "PostgreSQL installation and configuration completed" >> /var/log/user-data.log
