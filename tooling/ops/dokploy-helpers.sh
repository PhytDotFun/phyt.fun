#!/usr/bin/env bash
set -euo pipefail

# Dokploy integration helpers for phyt.fun deployments

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

# Check required environment variables
check_dokploy_config() {
    local missing_vars=()
    
    if [ -z "${DOKPLOY_API_URL:-}" ]; then
        missing_vars+=("DOKPLOY_API_URL")
    fi
    
    if [ -z "${DOKPLOY_API_TOKEN:-}" ]; then
        missing_vars+=("DOKPLOY_API_TOKEN")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        error "Missing required environment variables: ${missing_vars[*]}
        
Please set:
export DOKPLOY_API_URL=\"https://your-dokploy-instance.com/api\"
export DOKPLOY_API_TOKEN=\"your-dokploy-api-token\"
export DOKPLOY_PROJECT_ID=\"your-project-id\" (optional, can be passed as argument)"
    fi
}

# Make authenticated API call to Dokploy
dokploy_api() {
    local method="${1}"
    local endpoint="${2}"
    local data="${3:-}"
    
    local url="${DOKPLOY_API_URL}${endpoint}"
    local curl_args=(-X "$method" -H "Authorization: Bearer $DOKPLOY_API_TOKEN" -H "Content-Type: application/json")
    
    if [ -n "$data" ]; then
        curl_args+=(-d "$data")
    fi
    
    if ! curl -s -f "${curl_args[@]}" "$url"; then
        error "Dokploy API call failed: $method $endpoint"
    fi
}

# List all projects
list_projects() {
    log "Listing Dokploy projects..."
    
    check_dokploy_config
    
    local response
    response=$(dokploy_api "GET" "/projects")
    
    echo "$response" | jq -r '.[] | "\(.id) - \(.name) (\(.status))"' 2>/dev/null || echo "$response"
}

# Get project details
get_project() {
    local project_id="${1:-$DOKPLOY_PROJECT_ID}"
    
    if [ -z "$project_id" ]; then
        error "Project ID required. Use: $0 get-project <project-id>"
    fi
    
    log "Getting project details for: $project_id"
    
    check_dokploy_config
    
    local response
    response=$(dokploy_api "GET" "/projects/$project_id")
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Trigger deployment
trigger_deployment() {
    local project_id="${1:-$DOKPLOY_PROJECT_ID}"
    local environment="${2:-staging}"
    
    if [ -z "$project_id" ]; then
        error "Project ID required. Use: $0 deploy <project-id> [environment]"
    fi
    
    log "Triggering deployment for project: $project_id (environment: $environment)"
    
    check_dokploy_config
    
    local deploy_data
    deploy_data=$(jq -n --arg env "$environment" '{
        environment: $env,
        force: true,
        timestamp: now
    }')
    
    local response
    response=$(dokploy_api "POST" "/projects/$project_id/deploy" "$deploy_data")
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    log "✅ Deployment triggered successfully"
    
    # Monitor deployment status
    if [ "${MONITOR_DEPLOYMENT:-true}" = "true" ]; then
        monitor_deployment "$project_id"
    fi
}

# Monitor deployment status
monitor_deployment() {
    local project_id="${1:-$DOKPLOY_PROJECT_ID}"
    local max_wait="${2:-600}" # 10 minutes default
    local check_interval="${3:-10}" # 10 seconds
    
    if [ -z "$project_id" ]; then
        error "Project ID required. Use: $0 monitor <project-id>"
    fi
    
    log "Monitoring deployment status for project: $project_id"
    
    check_dokploy_config
    
    local elapsed=0
    local last_status=""
    
    while [ $elapsed -lt $max_wait ]; do
        local response
        response=$(dokploy_api "GET" "/projects/$project_id/status" 2>/dev/null || echo '{"status":"unknown"}')
        
        local status
        status=$(echo "$response" | jq -r '.status // "unknown"')
        
        if [ "$status" != "$last_status" ]; then
            info "Deployment status: $status"
            last_status="$status"
        fi
        
        case "$status" in
            "completed"|"success")
                log "✅ Deployment completed successfully"
                return 0
                ;;
            "failed"|"error")
                error "❌ Deployment failed"
                return 1
                ;;
            "running"|"deploying")
                info "⏳ Deployment in progress... (${elapsed}s elapsed)"
                ;;
        esac
        
        sleep "$check_interval"
        elapsed=$((elapsed + check_interval))
    done
    
    warn "⏰ Deployment monitoring timeout reached (${max_wait}s)"
    info "Check deployment status manually in Dokploy dashboard"
}

# Get deployment logs
get_deployment_logs() {
    local project_id="${1:-$DOKPLOY_PROJECT_ID}"
    local lines="${2:-100}"
    
    if [ -z "$project_id" ]; then
        error "Project ID required. Use: $0 logs <project-id> [lines]"
    fi
    
    log "Getting deployment logs for project: $project_id (last $lines lines)"
    
    check_dokploy_config
    
    local response
    response=$(dokploy_api "GET" "/projects/$project_id/logs?lines=$lines")
    
    echo "$response" | jq -r '.logs[]? // empty' 2>/dev/null || echo "$response"
}

# Rollback deployment
rollback_deployment() {
    local project_id="${1:-$DOKPLOY_PROJECT_ID}"
    local version="${2:-previous}"
    
    if [ -z "$project_id" ]; then
        error "Project ID required. Use: $0 rollback <project-id> [version]"
    fi
    
    log "Rolling back deployment for project: $project_id to version: $version"
    
    check_dokploy_config
    
    local rollback_data
    rollback_data=$(jq -n --arg version "$version" '{
        version: $version,
        force: true,
        timestamp: now
    }')
    
    local response
    response=$(dokploy_api "POST" "/projects/$project_id/rollback" "$rollback_data")
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    log "✅ Rollback initiated successfully"
    
    # Monitor rollback status
    if [ "${MONITOR_DEPLOYMENT:-true}" = "true" ]; then
        monitor_deployment "$project_id"
    fi
}

# Setup deployment webhook
setup_webhook() {
    local project_id="${1:-$DOKPLOY_PROJECT_ID}"
    local webhook_url="${2}"
    
    if [ -z "$project_id" ] || [ -z "$webhook_url" ]; then
        error "Usage: $0 setup-webhook <project-id> <webhook-url>"
    fi
    
    log "Setting up deployment webhook for project: $project_id"
    
    check_dokploy_config
    
    local webhook_data
    webhook_data=$(jq -n --arg url "$webhook_url" '{
        url: $url,
        events: ["deployment.success", "deployment.failure"],
        active: true
    }')
    
    local response
    response=$(dokploy_api "POST" "/projects/$project_id/webhooks" "$webhook_data")
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    log "✅ Webhook configured successfully"
}

# Create new Dokploy project configuration
create_project_config() {
    local project_name="${1:-phyt-staging}"
    local git_repo="${2:-https://github.com/your-org/phyt.fun.git}"
    local branch="${3:-main}"
    
    log "Creating Dokploy project configuration..."
    
    local config_file="dokploy-$project_name.json"
    
    cat > "$config_file" << EOF
{
  "name": "$project_name",
  "type": "docker-compose",
  "source": {
    "type": "git",
    "repository": "$git_repo",
    "branch": "$branch",
    "dockerfile": "./docker-compose.yml"
  },
  "environment": {
    "COMPOSE_FILE": "docker-compose.yml:docker-compose.staging.yml"
  },
  "domains": [
    {
      "domain": "staging.phyt.fun",
      "ssl": true,
      "redirect_to_ssl": true
    }
  ],
  "health_check": {
    "enabled": true,
    "path": "/health",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  },
  "auto_deploy": {
    "enabled": true,
    "branch": "$branch"
  }
}
EOF
    
    log "✅ Project configuration created: $config_file"
    info "Edit this file and import it into Dokploy dashboard"
}

# Test Dokploy connection
test_connection() {
    log "Testing Dokploy connection..."
    
    check_dokploy_config
    
    info "API URL: $DOKPLOY_API_URL"
    
    if dokploy_api "GET" "/health" >/dev/null 2>&1; then
        log "✅ Dokploy connection successful"
    else
        error "❌ Dokploy connection failed"
    fi
}

# Main script logic
main() {
    case "${1:-help}" in
        "test")
            test_connection
            ;;
        "projects")
            list_projects
            ;;
        "get-project")
            get_project "$2"
            ;;
        "deploy")
            trigger_deployment "${2:-}" "${3:-staging}"
            ;;
        "monitor")
            monitor_deployment "${2:-}" "${3:-600}" "${4:-10}"
            ;;
        "logs")
            get_deployment_logs "${2:-}" "${3:-100}"
            ;;
        "rollback")
            rollback_deployment "${2:-}" "${3:-previous}"
            ;;
        "setup-webhook")
            setup_webhook "${2:-}" "${3:-}"
            ;;
        "create-config")
            create_project_config "${2:-}" "${3:-}" "${4:-}"
            ;;
        *)
            echo "Dokploy Integration Helper for phyt.fun"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  test                          Test Dokploy connection"
            echo "  projects                      List all projects"
            echo "  get-project <id>             Get project details"
            echo "  deploy <id> [env]            Trigger deployment"
            echo "  monitor <id> [timeout]       Monitor deployment status"
            echo "  logs <id> [lines]            Get deployment logs"
            echo "  rollback <id> [version]      Rollback deployment"
            echo "  setup-webhook <id> <url>     Setup deployment webhook"
            echo "  create-config [name] [repo]  Create project config template"
            echo ""
            echo "Environment Variables (required):"
            echo "  DOKPLOY_API_URL              Dokploy API endpoint"
            echo "  DOKPLOY_API_TOKEN            Dokploy API token"
            echo "  DOKPLOY_PROJECT_ID           Default project ID (optional)"
            echo ""
            echo "Examples:"
            echo "  $0 test                      # Test connection"
            echo "  $0 projects                  # List all projects"
            echo "  $0 deploy abc123 staging     # Deploy project abc123 to staging"
            echo "  $0 monitor abc123            # Monitor deployment"
            echo "  $0 logs abc123 50            # Get last 50 log lines"
            echo ""
            echo "Setup:"
            echo "1. Set environment variables:"
            echo "   export DOKPLOY_API_URL=\"https://dokploy.your-domain.com/api\""
            echo "   export DOKPLOY_API_TOKEN=\"your-api-token\""
            echo "   export DOKPLOY_PROJECT_ID=\"your-project-id\""
            echo ""
            echo "2. Test connection:"
            echo "   $0 test"
            echo ""
            echo "3. Deploy:"
            echo "   $0 deploy"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"