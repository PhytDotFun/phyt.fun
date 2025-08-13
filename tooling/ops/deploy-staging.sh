#!/usr/bin/env bash
set -euo pipefail

# Staging deployment script for phyt.fun
# This script prepares and triggers deployment to staging.phyt.fun via Dokploy

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

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

# Pre-deployment checks
check_prerequisites() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if we're on the correct branch or have clean working directory
    if ! git status --porcelain | grep -q .; then
        log "✅ Working directory is clean"
    else
        warn "Working directory has uncommitted changes"
        echo "Uncommitted files:"
        git status --porcelain | head -10
        echo
        read -p "Continue with deployment? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi
    
    # Check if required environment variables are set
    if [ -z "${DOKPLOY_API_TOKEN:-}" ]; then
        warn "DOKPLOY_API_TOKEN not set - deployment will be manual"
    fi
    
    if [ -z "${DOKPLOY_PROJECT_ID:-}" ]; then
        warn "DOKPLOY_PROJECT_ID not set - deployment will be manual"
    fi
}

# Build applications
build_applications() {
    log "🏗️ Building applications for staging deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies
    info "Installing dependencies..."
    pnpm install
    
    # Build all applications
    info "Building all applications..."
    pnpm build
    
    # Verify build artifacts exist
    if [ ! -d "apps/web/dist" ]; then
        error "Web application build failed - dist directory not found"
    fi
    
    if [ ! -d "apps/hono-api/dist" ]; then
        error "API application build failed - dist directory not found"
    fi
    
    if [ ! -d "apps/workers/dist" ]; then
        error "Workers application build failed - dist directory not found"
    fi
    
    log "✅ All applications built successfully"
}

# Test configuration
test_configuration() {
    log "🧪 Testing nginx configuration..."
    
    # Test nginx configurations
    if ! "$SCRIPT_DIR/test-nginx-config.sh" staging; then
        error "Nginx configuration test failed"
    fi
    
    log "✅ Configuration tests passed"
}

# Create deployment package
create_deployment_package() {
    log "📦 Creating deployment package..."
    
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    local package_name="phyt-staging-${timestamp}.tar.gz"
    local temp_dir="/tmp/phyt-staging-deploy"
    
    # Clean up any existing temp directory
    rm -rf "$temp_dir"
    mkdir -p "$temp_dir"
    
    # Copy necessary files for deployment
    info "Copying deployment files..."
    
    # Docker compose files
    cp "$PROJECT_ROOT/docker-compose.yml" "$temp_dir/"
    cp "$PROJECT_ROOT/docker-compose.staging.yml" "$temp_dir/"
    
    # Nginx configuration
    mkdir -p "$temp_dir/tooling/nginx"
    cp "$PROJECT_ROOT/tooling/nginx/staging.nginx.conf" "$temp_dir/tooling/nginx/"
    
    # Vault configuration
    mkdir -p "$temp_dir/tooling/vault"
    cp -r "$PROJECT_ROOT/tooling/vault/"* "$temp_dir/tooling/vault/"
    
    # Ops scripts
    mkdir -p "$temp_dir/tooling/ops"
    cp "$PROJECT_ROOT/tooling/ops/docker-entrypoint.sh" "$temp_dir/tooling/ops/"
    cp "$PROJECT_ROOT/tooling/ops/health-check.sh" "$temp_dir/tooling/ops/"
    chmod +x "$temp_dir/tooling/ops/"*.sh
    
    # Built applications
    mkdir -p "$temp_dir/apps"
    cp -r "$PROJECT_ROOT/apps/web/dist" "$temp_dir/apps/web/"
    cp -r "$PROJECT_ROOT/apps/hono-api/dist" "$temp_dir/apps/hono-api/"
    cp -r "$PROJECT_ROOT/apps/workers/dist" "$temp_dir/apps/workers/"
    
    # Dockerfile
    cp "$PROJECT_ROOT/Dockerfile" "$temp_dir/"
    
    # Package metadata
    cat > "$temp_dir/DEPLOYMENT_INFO.txt" << EOF
Phyt.fun Staging Deployment Package
Generated: $(date)
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Build Environment: $(uname -a)
Node Version: $(node --version)
pnpm Version: $(pnpm --version)
EOF
    
    # Create tarball
    info "Creating deployment package: $package_name"
    cd "$(dirname "$temp_dir")"
    tar -czf "$PROJECT_ROOT/$package_name" "$(basename "$temp_dir")"
    
    # Clean up temp directory
    rm -rf "$temp_dir"
    
    log "✅ Deployment package created: $package_name"
    echo "   Size: $(du -h "$PROJECT_ROOT/$package_name" | cut -f1)"
    echo "   Location: $PROJECT_ROOT/$package_name"
    
    # Export for use by other functions
    export DEPLOYMENT_PACKAGE="$PROJECT_ROOT/$package_name"
}

# Deploy via Dokploy API (if configured)
deploy_via_dokploy() {
    log "🚀 Attempting Dokploy deployment..."
    
    if [ -z "${DOKPLOY_API_TOKEN:-}" ] || [ -z "${DOKPLOY_PROJECT_ID:-}" ]; then
        warn "Dokploy environment variables not configured"
        info "To enable automatic deployment, set:"
        info "  export DOKPLOY_API_TOKEN=\"your-dokploy-api-token\""
        info "  export DOKPLOY_PROJECT_ID=\"your-staging-project-id\""
        info "  export DOKPLOY_API_URL=\"https://your-dokploy-instance.com/api\""
        echo
        info "Manual deployment required:"
        info "1. Upload deployment package to staging server"
        info "2. Extract package and run: docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d"
        info "3. Verify deployment with: ./tooling/ops/health-check.sh staging"
        return 0
    fi
    
    local dokploy_url="${DOKPLOY_API_URL:-https://dokploy.phyt.fun/api}"
    
    info "Triggering deployment via Dokploy API..."
    
    # Get current git commit for deployment tracking
    local git_commit
    git_commit=$(git rev-parse HEAD)
    local git_branch
    git_branch=$(git rev-parse --abbrev-ref HEAD)
    
    # Deploy via Dokploy API
    local deploy_response
    if deploy_response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"projectId\": \"$DOKPLOY_PROJECT_ID\",
            \"gitCommit\": \"$git_commit\",
            \"gitBranch\": \"$git_branch\",
            \"environment\": \"staging\",
            \"deploymentType\": \"compose\",
            \"composeFile\": \"docker-compose.staging.yml\"
        }" \
        "$dokploy_url/deployments" 2>/dev/null); then
        
        local http_code="${deploy_response: -3}"
        local response_body="${deploy_response%???}"
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            log "✅ Deployment triggered successfully via Dokploy"
            info "Response: $response_body"
            
            # Extract deployment ID for monitoring (if available)
            local deployment_id
            if command -v jq >/dev/null 2>&1; then
                deployment_id=$(echo "$response_body" | jq -r '.deploymentId // .id // empty' 2>/dev/null)
                if [ -n "$deployment_id" ]; then
                    export DEPLOYMENT_ID="$deployment_id"
                    info "Deployment ID: $deployment_id"
                fi
            fi
            
            return 0
        else
            error "❌ Dokploy deployment failed (HTTP $http_code)"
            info "Response: $response_body"
            return 1
        fi
    else
        error "❌ Failed to connect to Dokploy API at $dokploy_url"
        return 1
    fi
}

# Post-deployment verification
verify_deployment() {
    log "🔍 Verifying staging deployment..."
    
    info "Waiting for services to start..."
    sleep 30
    
    # Run health checks
    if "$SCRIPT_DIR/health-check.sh" staging; then
        log "✅ Staging deployment verified successfully!"
        info "Staging URL: https://staging.phyt.fun"
        return 0
    else
        error "❌ Staging deployment verification failed"
        return 1
    fi
}

# Main deployment flow
main() {
    log "🚀 Starting phyt.fun staging deployment"
    echo "   Target: staging.phyt.fun"
    echo "   Time: $(date)"
    echo
    
    check_prerequisites
    build_applications
    test_configuration
    create_deployment_package
    deploy_via_dokploy
    
    echo
    log "📋 Deployment Summary:"
    info "✅ Applications built successfully"
    info "✅ Configuration tested"
    info "✅ Deployment package created"
    
    if [ -n "${DEPLOYMENT_PACKAGE:-}" ]; then
        info "📦 Package: $(basename "$DEPLOYMENT_PACKAGE")"
    fi
    
    echo
    info "🔗 Next steps:"
    info "1. Upload deployment package to staging server (if manual)"
    info "2. Run health verification: task staging:verify"
    info "3. Monitor deployment logs if needed"
    
    log "🎉 Staging deployment preparation complete!"
}

# Script execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi