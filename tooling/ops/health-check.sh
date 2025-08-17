#!/usr/bin/env bash
set -euo pipefail

# Comprehensive health check script for phyt.fun deployments

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
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Health check function
check_endpoint() {
    local url="$1"
    local endpoint_name="$2"
    local timeout="${3:-10}"
    local expected_status="${4:-200}"

    info "Checking $endpoint_name..."

    if response=$(curl -s -w "%{http_code}" -o /tmp/health_response --connect-timeout "$timeout" --max-time "$timeout" "$url" 2>/dev/null); then
        http_code="${response: -3}"

        if [ "$http_code" = "$expected_status" ]; then
            log "✅ $endpoint_name is healthy (HTTP $http_code)"

            # Show response for health endpoints
            if [[ $url == *"/health"* ]]; then
                response_body=$(cat /tmp/health_response 2>/dev/null || echo "No response body")
                echo "   Response: $response_body"
            fi
            return 0
        else
            error "❌ $endpoint_name returned HTTP $http_code (expected $expected_status)"
            return 1
        fi
    else
        error "❌ $endpoint_name connection failed (timeout: ${timeout}s)"
        return 1
    fi
}

# Load balancer test
test_load_balancer() {
    local base_url="$1"
    local endpoint_name="$2"
    local iterations="${3:-10}"

    info "Testing load balancer distribution for $endpoint_name..."

    local success_count=0
    local response_times=()

    for _ in $(seq 1 "$iterations"); do
        start_time=$(date +%s%N)
        if curl -s -f "$base_url/api/health" >/dev/null 2>&1; then
            end_time=$(date +%s%N)
            response_time=$(((end_time - start_time) / 1000000)) # Convert to milliseconds
            response_times+=("$response_time")
            ((success_count++))
        fi
    done

    if [ $success_count -gt 0 ]; then
        success_rate=$(((success_count * 100) / iterations))

        # Calculate average response time
        total_time=0
        for time in "${response_times[@]}"; do
            total_time=$((total_time + time))
        done
        avg_time=$((total_time / success_count))

        log "✅ Load balancer test completed: $success_count/$iterations requests succeeded ($success_rate%)"
        log "   Average response time: ${avg_time}ms"

        if [ $success_rate -ge 90 ]; then
            return 0
        else
            warn "Low success rate for load balancer test"
            return 1
        fi
    else
        error "❌ Load balancer test failed: 0/$iterations requests succeeded"
        return 1
    fi
}

# SSL/TLS check
check_ssl() {
    local domain="$1"
    local port="${2:-443}"

    info "Checking SSL certificate for $domain..."

    if ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
        log "✅ SSL certificate is valid for $domain"
        echo "   $ssl_info"
        return 0
    else
        error "❌ SSL certificate check failed for $domain"
        return 1
    fi
}

# DNS resolution check
check_dns() {
    local domain="$1"

    info "Checking DNS resolution for $domain..."

    if ip=$(dig +short "$domain" A 2>/dev/null | head -n1); then
        if [ -n "$ip" ]; then
            log "✅ DNS resolution successful: $domain -> $ip"
            return 0
        else
            error "❌ DNS resolution failed: $domain (no A record)"
            return 1
        fi
    else
        error "❌ DNS resolution failed: $domain (dig command failed)"
        return 1
    fi
}

# Comprehensive environment check
check_environment() {
    local env_name="$1"
    local base_url="$2"
    local check_ssl_flag="${3:-false}"

    echo
    log "🚀 Starting health checks for $env_name environment"
    echo "   URL: $base_url"
    echo

    local total_checks=0
    local passed_checks=0

    # Extract domain from URL for DNS/SSL checks
    local domain
    domain=$(echo "$base_url" | sed 's|https\?://||' | sed 's|/.*||')

    # DNS check
    ((total_checks++))
    if check_dns "$domain"; then
        ((passed_checks++))
    fi

    # SSL check (only for HTTPS URLs)
    if [ "$check_ssl_flag" = "true" ] && [[ $base_url == https* ]]; then
        ((total_checks++))
        if check_ssl "$domain"; then
            ((passed_checks++))
        fi
    fi

    # Basic connectivity check
    ((total_checks++))
    if check_endpoint "$base_url" "$env_name root"; then
        ((passed_checks++))
    fi

    # Nginx health check
    ((total_checks++))
    # Use different endpoints for different environments
    local nginx_health_endpoint="/health"
    if [ "$env_name" = "Staging" ]; then
        nginx_health_endpoint="/nginx-health"
    fi
    if check_endpoint "$base_url$nginx_health_endpoint" "$env_name nginx health"; then
        ((passed_checks++))
    fi

    # API health check
    ((total_checks++))
    if check_endpoint "$base_url/api/health" "$env_name API health"; then
        ((passed_checks++))
    fi

    # Detailed API health check
    ((total_checks++))
    if check_endpoint "$base_url/api/health/detailed" "$env_name API detailed health"; then
        ((passed_checks++))
    fi

    # Load balancer test (only for staging/prod)
    if [ "$env_name" != "Development" ]; then
        ((total_checks++))
        if test_load_balancer "$base_url" "$env_name"; then
            ((passed_checks++))
        fi
    fi

    echo
    log "📊 $env_name health check summary: $passed_checks/$total_checks checks passed"

    if [ $passed_checks -eq $total_checks ]; then
        log "✅ All $env_name health checks passed!"
        echo
        return 0
    else
        failed_checks=$((total_checks - passed_checks))
        error "❌ $failed_checks $env_name health checks failed"
        echo
        return 1
    fi
}

# Main execution
case "${1:-help}" in
"dev")
    check_environment "Development" "http://localhost:8080" false
    ;;
"staging")
    check_environment "Staging" "https://staging.phyt.fun" true
    ;;
"prod")
    check_environment "Production" "https://phyt.fun" true
    ;;
"local-staging")
    check_environment "Local Staging" "https://local-staging.phyt.fun" true
    ;;
"all")
    echo "🔍 Running health checks for all environments..."

    dev_result=0
    staging_result=0
    prod_result=0

    check_environment "Development" "http://localhost:8080" false || dev_result=1
    check_environment "Staging" "https://staging.phyt.fun" true || staging_result=1
    check_environment "Production" "https://phyt.fun" true || prod_result=1

    total_envs=3
    failed_envs=$((dev_result + staging_result + prod_result))
    passed_envs=$((total_envs - failed_envs))

    log "🎯 Overall summary: $passed_envs/$total_envs environments healthy"

    if [ $failed_envs -eq 0 ]; then
        log "🎉 All environments are healthy!"
        exit 0
    else
        error "💥 $failed_envs environments have health issues"
        exit 1
    fi
    ;;
*)
    echo "Usage: $0 [dev|staging|prod|local-staging|all]"
    echo ""
    echo "Examples:"
    echo "  $0 staging          # Check staging.phyt.fun health"
    echo "  $0 prod            # Check phyt.fun health"
    echo "  $0 all             # Check all environments"
    echo ""
    echo "Health checks include:"
    echo "  - DNS resolution"
    echo "  - SSL certificate validation (HTTPS only)"
    echo "  - Basic connectivity"
    echo "  - Nginx health endpoint"
    echo "  - API health endpoints"
    echo "  - Load balancer distribution (staging/prod only)"
    exit 1
    ;;
esac
