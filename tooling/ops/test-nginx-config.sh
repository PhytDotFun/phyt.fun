#!/usr/bin/env bash
set -euo pipefail

# Nginx configuration testing script for phyt.fun load balancers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Test nginx configuration syntax
test_nginx_syntax() {
    local config_file="$1"
    local config_name="$2"
    
    log "Testing $config_name nginx configuration syntax..."
    
    if ! docker run --rm \
        -v "$PROJECT_ROOT/$config_file:/etc/nginx/nginx.conf:ro" \
        nginx:alpine nginx -t 2>/dev/null; then
        error "$config_name nginx configuration has syntax errors"
    else
        log "✅ $config_name nginx configuration syntax is valid"
    fi
}

# Test upstream configuration
test_upstream_config() {
    local config_file="$1"
    local config_name="$2"
    
    log "Analyzing $config_name upstream configuration..."
    
    # Check if upstream blocks are defined
    if grep -q "upstream.*{" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name has upstream configurations"
        
        # Extract upstream details
        grep -A 5 "upstream.*{" "$PROJECT_ROOT/$config_file" | while read -r line; do
            if echo "$line" | grep -q "server"; then
                log "  - $(echo "$line" | sed 's/^[[:space:]]*//')"
            fi
        done
    else
        warn "$config_name has no upstream configurations"
    fi
}

# Test health check endpoints
test_health_endpoints() {
    local config_file="$1"
    local config_name="$2"
    
    log "Checking $config_name health check endpoints..."
    
    if grep -q "location.*health" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name has health check endpoints"
        
        # Extract health endpoints
        grep -B 1 -A 3 "location.*health" "$PROJECT_ROOT/$config_file" | while read -r line; do
            if echo "$line" | grep -q "location"; then
                log "  - $(echo "$line" | sed 's/^[[:space:]]*//' | sed 's/{$//')"
            fi
        done
    else
        warn "$config_name has no health check endpoints"
    fi
}

# Test SSL configuration
test_ssl_config() {
    local config_file="$1"
    local config_name="$2"
    
    log "Checking $config_name SSL configuration..."
    
    if grep -q "ssl_certificate" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name has SSL configuration"
        
        # Check SSL protocols
        if grep -q "ssl_protocols TLSv1.2 TLSv1.3" "$PROJECT_ROOT/$config_file"; then
            log "  - Modern TLS protocols configured"
        else
            warn "  - Consider updating to modern TLS protocols (TLSv1.2 TLSv1.3)"
        fi
        
        # Check HSTS
        if grep -q "Strict-Transport-Security" "$PROJECT_ROOT/$config_file"; then
            log "  - HSTS header configured"
        else
            warn "  - HSTS header missing"
        fi
    else
        warn "$config_name has no SSL configuration"
    fi
}

# Test rate limiting
test_rate_limiting() {
    local config_file="$1"
    local config_name="$2"
    
    log "Checking $config_name rate limiting configuration..."
    
    if grep -q "limit_req_zone" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name has rate limiting configured"
        
        # Extract rate limiting zones
        grep "limit_req_zone" "$PROJECT_ROOT/$config_file" | while read -r line; do
            log "  - $(echo "$line" | sed 's/^[[:space:]]*//')"
        done
    else
        warn "$config_name has no rate limiting"
    fi
}

# Test security headers
test_security_headers() {
    local config_file="$1"
    local config_name="$2"
    
    log "Checking $config_name security headers..."
    
    local security_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Referrer-Policy"
    )
    
    local found_headers=0
    for header in "${security_headers[@]}"; do
        if grep -q "$header" "$PROJECT_ROOT/$config_file"; then
            ((found_headers++))
        fi
    done
    
    if [ $found_headers -ge 3 ]; then
        log "✅ $config_name has good security headers ($found_headers/4)"
    else
        warn "$config_name has minimal security headers ($found_headers/4)"
    fi
}

# Load balancer specific tests
test_load_balancer() {
    local config_file="$1"
    local config_name="$2"
    
    log "Testing $config_name load balancer configuration..."
    
    # Check for load balancing method
    if grep -q "least_conn\|ip_hash\|random" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name uses advanced load balancing method"
    else
        log "  - Using default round-robin load balancing"
    fi
    
    # Check for health checks
    if grep -q "max_fails\|fail_timeout" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name has backend health monitoring"
    else
        warn "$config_name has no backend health monitoring"
    fi
    
    # Check for keepalive connections
    if grep -q "keepalive" "$PROJECT_ROOT/$config_file"; then
        log "✅ $config_name uses keepalive connections"
    else
        warn "$config_name not using keepalive connections (performance impact)"
    fi
}

# Main test function
run_tests() {
    local config_file="$1"
    local config_name="$2"
    
    if [ ! -f "$PROJECT_ROOT/$config_file" ]; then
        error "Configuration file $config_file not found"
    fi
    
    log "Starting comprehensive nginx configuration tests for $config_name"
    echo
    
    test_nginx_syntax "$config_file" "$config_name"
    test_upstream_config "$config_file" "$config_name"
    test_health_endpoints "$config_file" "$config_name"
    test_ssl_config "$config_file" "$config_name"
    test_rate_limiting "$config_file" "$config_name"
    test_security_headers "$config_file" "$config_name"
    test_load_balancer "$config_file" "$config_name"
    
    echo
    log "✅ $config_name configuration tests completed"
    echo
}

# Run tests based on argument or test all
case "${1:-all}" in
    "dev")
        run_tests "tooling/nginx/dev.nginx.conf" "Development"
        ;;
    "staging")
        run_tests "tooling/nginx/staging.nginx.conf" "Staging"
        ;;
    "prod")
        run_tests "tooling/nginx/prod.nginx.conf" "Production"
        ;;
    "all")
        run_tests "tooling/nginx/dev.nginx.conf" "Development"
        run_tests "tooling/nginx/staging.nginx.conf" "Staging"  
        run_tests "tooling/nginx/prod.nginx.conf" "Production"
        ;;
    *)
        echo "Usage: $0 [dev|staging|prod|all]"
        echo "Example: $0 staging"
        exit 1
        ;;
esac

log "🎉 All nginx configuration tests completed successfully!"