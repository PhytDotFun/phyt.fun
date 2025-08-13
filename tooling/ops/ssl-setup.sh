#!/usr/bin/env bash
set -euo pipefail

# SSL Certificate management script for phyt.fun

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root for certificate management"
    fi
}

# Install certbot if not present
install_certbot() {
    log "Checking for certbot installation..."
    
    if command -v certbot >/dev/null 2>&1; then
        log "✅ certbot is already installed"
        return 0
    fi
    
    info "Installing certbot..."
    
    # Detect OS and install appropriately
    if [ -f /etc/debian_version ]; then
        apt update
        apt install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    else
        error "Unsupported OS for automatic certbot installation"
    fi
    
    log "✅ certbot installed successfully"
}

# Setup SSL certificate for staging
setup_staging_ssl() {
    local domain="staging.phyt.fun"
    local email="${SSL_EMAIL:-admin@phyt.fun}"
    
    log "Setting up SSL certificate for $domain"
    
    # Check if certificate already exists
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        warn "Certificate for $domain already exists"
        info "Use 'renew' command to renew existing certificate"
        return 0
    fi
    
    # Obtain certificate
    info "Obtaining SSL certificate for $domain..."
    
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$email" \
        -d "$domain"; then
        log "✅ SSL certificate obtained for $domain"
    else
        error "Failed to obtain SSL certificate for $domain"
    fi
    
    # Set up automatic renewal
    setup_renewal
}

# Setup SSL certificate for production
setup_production_ssl() {
    local domain="phyt.fun"
    local email="${SSL_EMAIL:-admin@phyt.fun}"
    
    log "Setting up SSL certificate for $domain and www.$domain"
    
    # Check if certificate already exists
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        warn "Certificate for $domain already exists"
        info "Use 'renew' command to renew existing certificate"
        return 0
    fi
    
    # Obtain certificate for both apex and www
    info "Obtaining SSL certificate for $domain and www.$domain..."
    
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$email" \
        -d "$domain" \
        -d "www.$domain"; then
        log "✅ SSL certificate obtained for $domain and www.$domain"
    else
        error "Failed to obtain SSL certificate for $domain"
    fi
    
    # Set up automatic renewal
    setup_renewal
}

# Setup automatic renewal
setup_renewal() {
    log "Setting up automatic SSL certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/certbot-renew.sh << 'EOF'
#!/bin/bash
set -e

# Renew certificates
certbot renew --quiet

# Reload nginx if certificates were renewed
if [ -f /var/log/letsencrypt/letsencrypt.log ]; then
    if grep -q "renewed" /var/log/letsencrypt/letsencrypt.log; then
        if command -v docker-compose >/dev/null 2>&1; then
            # Reload nginx in docker
            docker-compose exec nginx nginx -s reload 2>/dev/null || true
            docker-compose exec nginx-lb nginx -s reload 2>/dev/null || true
        elif command -v nginx >/dev/null 2>&1; then
            # Reload system nginx
            nginx -s reload
        fi
    fi
fi
EOF
    
    chmod +x /usr/local/bin/certbot-renew.sh
    
    # Add cron job for automatic renewal
    if ! crontab -l 2>/dev/null | grep -q certbot-renew; then
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/certbot-renew.sh") | crontab -
        log "✅ Automatic renewal cron job added"
    else
        log "✅ Automatic renewal cron job already exists"
    fi
}

# Renew existing certificates
renew_certificates() {
    log "Renewing SSL certificates..."
    
    if certbot renew --dry-run; then
        log "✅ Certificate renewal test successful"
        
        info "Running actual renewal..."
        if certbot renew; then
            log "✅ Certificates renewed successfully"
            
            # Reload nginx
            if command -v docker-compose >/dev/null 2>&1; then
                docker-compose exec nginx nginx -s reload 2>/dev/null || true
                docker-compose exec nginx-lb nginx -s reload 2>/dev/null || true
                log "✅ nginx reloaded"
            fi
        else
            error "Certificate renewal failed"
        fi
    else
        error "Certificate renewal test failed"
    fi
}

# Check certificate status
check_certificates() {
    log "Checking SSL certificate status..."
    
    if [ -d "/etc/letsencrypt/live" ]; then
        certbot certificates
    else
        warn "No certificates found"
    fi
}

# Test SSL configuration
test_ssl_config() {
    local domain="${1:-staging.phyt.fun}"
    
    log "Testing SSL configuration for $domain..."
    
    # Check if domain resolves
    if ! dig +short "$domain" >/dev/null; then
        error "Domain $domain does not resolve"
    fi
    
    # Test SSL connection
    info "Testing SSL connection..."
    if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates; then
        log "✅ SSL connection successful"
        
        # Check certificate expiry
        local expiry
        expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
        info "Certificate expires: $expiry"
        
        # Check if expiring soon (30 days)
        if openssl x509 -checkend 2592000 -noout <<< "$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null)"; then
            log "✅ Certificate is valid for more than 30 days"
        else
            warn "Certificate expires within 30 days - consider renewal"
        fi
    else
        error "SSL connection failed for $domain"
    fi
}

# Generate self-signed certificate for development
generate_dev_cert() {
    local domain="${1:-localhost}"
    local cert_dir="/tmp/ssl-dev"
    
    log "Generating self-signed certificate for development ($domain)..."
    
    mkdir -p "$cert_dir"
    
    # Generate private key
    openssl genrsa -out "$cert_dir/privkey.pem" 2048
    
    # Generate certificate
    openssl req -new -x509 -key "$cert_dir/privkey.pem" -out "$cert_dir/fullchain.pem" -days 365 \
        -subj "/C=US/ST=CA/L=San Francisco/O=Phyt/CN=$domain"
    
    log "✅ Development certificate generated"
    info "Private key: $cert_dir/privkey.pem"
    info "Certificate: $cert_dir/fullchain.pem"
    info "Add to your nginx configuration or docker-compose volumes"
}

# Main script logic
main() {
    case "${1:-help}" in
        "install")
            check_root
            install_certbot
            ;;
        "staging")
            check_root
            install_certbot
            setup_staging_ssl
            ;;
        "production")
            check_root
            install_certbot
            setup_production_ssl
            ;;
        "renew")
            check_root
            renew_certificates
            ;;
        "check")
            check_certificates
            ;;
        "test")
            test_ssl_config "${2:-staging.phyt.fun}"
            ;;
        "dev")
            generate_dev_cert "${2:-localhost}"
            ;;
        *)
            echo "SSL Certificate Management for phyt.fun"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  install              Install certbot"
            echo "  staging             Setup SSL for staging.phyt.fun"
            echo "  production          Setup SSL for phyt.fun and www.phyt.fun"
            echo "  renew               Renew existing certificates"
            echo "  check               Check certificate status"
            echo "  test [domain]       Test SSL configuration"
            echo "  dev [domain]        Generate self-signed cert for development"
            echo ""
            echo "Environment Variables:"
            echo "  SSL_EMAIL           Email for Let's Encrypt (default: admin@phyt.fun)"
            echo ""
            echo "Examples:"
            echo "  $0 staging                    # Setup SSL for staging"
            echo "  $0 production                 # Setup SSL for production"
            echo "  $0 test staging.phyt.fun     # Test staging SSL"
            echo "  $0 dev localhost              # Generate dev certificate"
            echo ""
            echo "Note: Most commands require root privileges for certificate management"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"