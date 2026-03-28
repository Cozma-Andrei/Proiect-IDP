#!/bin/sh

# Wrapper script to map Docker Secrets to environment variables
# For each secret file in /run/secrets/, it exports it as an environment variable

if [ -d /run/secrets ]; then
    for secret in /run/secrets/*; do
        secret_name=$(basename "$secret")
        # Ensure secret_name is a valid environment variable name
        if [ -f "$secret" ]; then
            export "$secret_name"="$(cat "$secret")"
            # echo "Imported secret: $secret_name" # Optional: for debugging
        fi
    done
fi

# Execute the application command
exec "$@"
