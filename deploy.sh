#!/bin/sh
# deploy.sh - Build and deploy with automatic version and date from git/package.json

# Read version from frontend/package.json
APP_VERSION=$(node -p "require('./frontend/package.json').version" 2>/dev/null || echo "1.0.0")

# Read build date from last git commit (Month Year format)
BUILD_DATE=$(git log -1 --format="%cd" --date=format:"%B %Y" 2>/dev/null || date "+%B %Y")

echo "Deploying version $APP_VERSION ($BUILD_DATE)..."

export APP_VERSION
export BUILD_DATE

docker compose up -d --build "$@"
