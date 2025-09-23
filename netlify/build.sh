#!/bin/bash

# Netlify build script
set -e

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=development
export CI=true

# Clear npm cache to avoid version conflicts
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install dependencies with specific flags
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps --no-fund --no-audit

# Generate build info
echo "📋 Generating build info..."
node scripts/build-info.js

# Build the application
echo "🏗️ Building application..."
npx vite build

# Verify build output
echo "📁 Verifying build output..."
ls -la dist/

echo "✅ Build completed successfully!"
