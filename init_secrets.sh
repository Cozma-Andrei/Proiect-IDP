#!/bin/bash

# Script to initialize Docker Swarm Secrets from the .env file

if [ ! -f .env ]; then
    echo "Error: .env file not found. Create it first!"
    exit 1
fi

# Function to safely create a secret
create_secret() {
    local name=$1
    local value=$2
    if [ -z "$value" ]; then
        echo "Skipping $name (value is empty)"
        return
    fi

    # Check if secret already exists
    if docker secret inspect "$name" >/dev/null 2>&1; then
        echo "Secret $name already exists, removing..."
        docker secret rm "$name"
    fi

    echo -n "$value" | docker secret create "$name" -
    echo "Created secret: $name"
}

# Load .env and create secrets for sensitive keys
# We only create secrets for the keys explicitly requested or sensitive ones

# Secrets to migration
SECRETS=(
    "JWT_SECRET"
    "MAIL_USER"
    "MAIL_PASS"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET_NAME"
    "AWS_REGION"
)

for key in "${SECRETS[@]}"; do
    # Extract value from .env (ignoring comments and handling potential quotes)
    value=$(grep "^$key=" .env | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    if [ ! -z "$value" ]; then
        create_secret "$key" "$value"
    fi
done

echo "Secrets initialization complete."
