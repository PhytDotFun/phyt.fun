#!/bin/sh
set -e

# Wait for secret file
if [ ! -z "$WAIT_FOR_SECRET_FILE" ]; then
    echo "Waiting for secrets at $WAIT_FOR_SECRET_FILE..."
    timeout=60
    elapsed=0

    while [ ! -f "$WAIT_FOR_SECRET_FILE" ]; do
        if [ $elapsed -ge $timeout ]; then
            echo "ERROR: Timeout waiting for secrets!"
            exit 1
        fi
        
        sleep 1
        elapsed=$((elapsed + 1))
    done

    echo "Secrets found, loading environment..."

    # Source env file
    set -a
    . "$WAIT_FOR_SECRET_FILE"
    set +a
fi

# Execute
exec "$@"