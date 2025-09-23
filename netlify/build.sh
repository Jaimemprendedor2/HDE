#!/bin/bash

# Netlify build script with automatic versioning
set -e

echo "🚀 Starting Netlify build process with automatic versioning..."

# Set environment variables
export NODE_ENV=production
export CI=true

# Configure Supabase environment variables for production
export VITE_SUPABASE_URL=https://ijqukrbbzxuczikjowaf.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcXVrcmJienh1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc4NjQsImV4cCI6MjA3NDE2Mzg2NH0.dNn8vVwwy5wx9mgEK2Grhfdgq4w0CPNJ-CMlZfuz7Bc
export VITE_APP_NAME="Housenovo Directorios Empresariales"

# Generate automatic version based on semantic version + timestamp
PACKAGE_VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +"%Y.%m.%d.%H%M")
AUTO_VERSION="v${PACKAGE_VERSION}-${TIMESTAMP}"
export VITE_APP_VERSION="$AUTO_VERSION"

# Get git information for build
GIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_HASH_SHORT=$(echo $GIT_HASH | cut -c1-7)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
DEPLOY_ID="${GIT_BRANCH}-${GIT_HASH_SHORT}-$(date +%s)"

# Debug: Show environment variables
echo "🔍 Build Information:"
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo "VITE_APP_NAME: $VITE_APP_NAME"
echo "VITE_APP_VERSION: $VITE_APP_VERSION"
echo "GIT_HASH: $GIT_HASH"
echo "GIT_BRANCH: $GIT_BRANCH"
echo "DEPLOY_ID: $DEPLOY_ID"

# Check Node.js and npm versions
echo "📋 Checking versions..."
node --version
npm --version

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --no-fund --no-audit

# Create public directory if it doesn't exist
mkdir -p public

# Generate build info (with error handling)
echo "📋 Generating build info..."
node scripts/build-info.js || echo "⚠️ Build info generation failed, continuing..."

# Build the application
echo "🏗️ Building application..."
npx vite build

# Verify build output
echo "📁 Verifying build output..."
ls -la dist/

echo "✅ Build completed successfully!"
