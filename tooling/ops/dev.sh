#!/usr/bin/env bash
set -e

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

echo "Starting development environment with Docker Compose..."
docker compose up -d --build

echo "Services are running. Tailing logs..."
echo "Press Ctrl+C to stop."

cleanup() {
  echo "Stopping services..."
  svcs="$(docker compose ps --services | grep -v '^tailscale$' || true)"
  if [ -n "$svcs" ]; then
    docker compose stop $svcs || true
  fi
}
trap cleanup EXIT

docker compose logs -f hono-gateway workers