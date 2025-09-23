#!/bin/bash

# Netlify build script
set -e

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=development
export CI=true

# Configure Supabase environment variables for production
export VITE_SUPABASE_URL=https://bbzxuczikjowaf.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJienF1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxMTQzNzMsImV4cCI6MjA0MjY5MDM3M30.iBorNEcdx_VkxN_mLxVzOI5LKu3YSKOhLdqvYbINr2w
export VITE_APP_NAME="Housenovo Directorios Empresariales"
export VITE_APP_VERSION="1.0.0"

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
