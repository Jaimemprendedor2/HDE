#!/bin/bash

# Netlify build script
set -e

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=development
export CI=true

# Install dependencies (including devDependencies)
echo "📦 Installing dependencies..."
npm ci

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
