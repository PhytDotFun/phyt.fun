#!/usr/bin/env bash
set -e

# Load environment variables if they exist
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

echo "🚀 Starting development environment..."

# Use the new task-based approach for consistency
if command -v task >/dev/null 2>&1; then
    echo "Using Task runner for environment management"
    exec task dev:full
else
    echo "Task not found, falling back to direct docker-compose..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    pnpm -w install
    
    # Start development services
    echo "🐳 Starting Docker services..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile dev up -d --remove-orphans
    
    echo ""
    echo "🚀 Development environment ready!"
    echo "Frontend: http://localhost:8080"
    echo "API: http://localhost:3000"
    echo "Database: localhost:5432"
    echo "Redis: localhost:6379"
    echo ""
    echo "Services are running. Tailing logs..."
    echo "Press Ctrl+C to stop."
    
    cleanup() {
      echo "Stopping services..."
      docker compose down --remove-orphans || true
    }
    trap cleanup EXIT
    
    docker compose logs -f hono-api workers
fi