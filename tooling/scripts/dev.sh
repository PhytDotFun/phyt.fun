#!/bin/bash

# Spin up containers
docker compose up -d

# Function to cleanup on exit
cleanup() {
    # Prevent double cleanup
    if [ "${CLEANUP_DONE:-}" = "true" ]; then
        return
    fi
    CLEANUP_DONE=true
    
    echo "Stopping containers..."
    
    # Kill the concurrently process group
    if [ ! -z "$CONCURRENT_PID" ]; then
        kill -TERM $CONCURRENT_PID 2>/dev/null
        wait $CONCURRENT_PID 2>/dev/null
    else
        # If CONCURRENT_PID is not set, try to kill any concurrently processes
        pkill -f "concurrently.*pnpm dev:" 2>/dev/null || true
    fi
    
    # Stop docker containers
    docker compose stop
    
    echo "Cleanup complete"
}

# Trap SIGINT (Ctrl+C), SIGTERM, and EXIT
trap cleanup SIGINT SIGTERM EXIT

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