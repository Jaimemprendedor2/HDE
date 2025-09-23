#!/bin/bash

# Netlify build script
set -e

echo "🚀 Starting Netlify build process..."

# Set environment variables
export NODE_ENV=development
export CI=true

# Install dependencies (including devDependencies)
echo "📦 Installing dependencies..."
npm ci --include=dev

# Verify installation
echo "🔍 Verifying dependencies..."
npm list --depth=0

# Run linting
echo "🔍 Running ESLint..."
npm run lint || echo "⚠️ Linting failed, continuing..."

# Type check
echo "🔧 Type checking..."
npm run type-check || echo "⚠️ Type check failed, continuing..."

# Generate build info
echo "📋 Generating build info..."
node scripts/build-info.js

# Build the application
echo "🏗️ Building application..."
npm run build

# Verify build output
echo "📁 Verifying build output..."
ls -la dist/

echo "✅ Build completed successfully!"
