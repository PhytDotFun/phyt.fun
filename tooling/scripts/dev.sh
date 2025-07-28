#!/bin/bash

# Spin up containers
docker compose up -d

# Function to cleanup on exit
cleanup() {
    echo "Stopping containers..."
    
    # Kill the concurrently process group
    if [ ! -z "$CONCURRENT_PID" ]; then
        kill -TERM $CONCURRENT_PID 2>/dev/null
        wait $CONCURRENT_PID 2>/dev/null
    fi
    
    # Stop docker containers
    docker compose stop
    
    echo "Cleanup complete"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start the dev processes and capture PID
concurrently \
    --kill-others-on-fail \
    --prefix-colors "cyan,magenta,redBright" \
    "pnpm dev:web" \
    "pnpm dev:gw" \
    "pnpm dev:wrk" &

CONCURRENT_PID=$!

# Wait for background processes
wait $CONCURRENT_PID