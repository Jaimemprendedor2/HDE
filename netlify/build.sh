#!/bin/bash

# Netlify build script
set -e

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=development
export CI=true

# Configure Supabase environment variables for production
export VITE_SUPABASE_URL=https://ijqukrbbzxuczikjowaf.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcXVrcmJienh1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc4NjQsImV4cCI6MjA3NDE2Mzg2NH0.dNn8vVwwy5wx9mgEK2Grhfdgq4w0CPNJ-CMlZfuz7Bc
export VITE_APP_NAME="Housenovo Directorios Empresariales"
export VITE_APP_VERSION="1.0.0"

# Debug: Show environment variables
echo "🔍 Environment variables:"
echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo "VITE_APP_NAME: $VITE_APP_NAME"

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
