#!/bin/bash

# Netlify build script
set -e

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=development
export CI=true

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
