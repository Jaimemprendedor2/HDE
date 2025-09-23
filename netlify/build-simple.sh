#!/bin/bash
set -e

echo "🚀 Starting simplified Netlify build..."

# Basic environment setup
export NODE_ENV=production
export CI=true

# Configure Supabase (hardcoded for reliability)
export VITE_SUPABASE_URL=https://ijqukrbbzxuczikjowaf.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcXVrcmJienh1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc4NjQsImV4cCI6MjA3NDE2Mzg2NH0.dNn8vVwwy5wx9mgEK2Grhfdgq4w0CPNJ-CMlZfuz7Bc
export VITE_APP_NAME="Housenovo Directorios Empresariales"
export VITE_APP_VERSION="v1.1.1-$(date +%Y.%m.%d.%H%M)"

echo "Environment configured:"
echo "NODE_VERSION: $(node --version)"
echo "NPM_VERSION: $(npm --version)"
echo "VITE_APP_VERSION: $VITE_APP_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --silent

# Verify key dependencies exist
echo "🔍 Checking critical files..."
test -f node_modules/@vitejs/plugin-react/dist/index.js && echo "✅ @vitejs/plugin-react found" || echo "❌ @vitejs/plugin-react missing"
test -f node_modules/vite/bin/vite.js && echo "✅ vite found" || echo "❌ vite missing"
test -f vite.config.ts && echo "✅ vite.config.ts found" || echo "❌ vite.config.ts missing"

# Create minimal build info
echo "📋 Creating build info..."
mkdir -p public
cat > public/build-info.json << EOF
{
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "version": "$VITE_APP_VERSION",
  "autoVersion": "$VITE_APP_VERSION",
  "environment": "production",
  "timestamp": $(date +%s)000
}
EOF

# Build with minimal config
echo "🏗️ Building application..."
npx vite build --mode production

# Verify output
echo "📁 Build verification..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Build successful!"
    ls -la dist/
else
    echo "❌ Build failed - no dist directory or index.html"
    exit 1
fi

echo "✅ Simple build completed successfully!"
