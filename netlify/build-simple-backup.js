#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'

console.log('🚀 Starting simplified Netlify build...')

// Set minimal environment variables
process.env.NODE_ENV = 'production'
process.env.CI = 'true'
process.env.VITE_SUPABASE_URL = 'https://ijqukrbbzxuczikjowaf.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcXVrcmJienh1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc4NjQsImV4cCI6MjA3NDE2Mzg2NH0.dNn8vVwwy5wx9mgEK2Grhfdgq4w0CPNJ-CMlZfuz7Bc'
process.env.VITE_APP_NAME = 'Housenovo Directorios Empresariales'

// Generate simple version
const now = new Date()
const version = `v1.1.1-${now.toISOString().slice(0, 19).replace(/[:T]/g, '.')}`
process.env.VITE_APP_VERSION = version

console.log(`📋 Environment: ${process.env.NODE_ENV}`)
console.log(`📋 Version: ${version}`)

try {
  // Simple dependency installation
  console.log('📦 Installing dependencies...')
  execSync('npm install', { stdio: 'inherit' })

  // Create build info
  console.log('📋 Creating build info...')
  mkdirSync('public', { recursive: true })
  const buildInfo = {
    buildDate: now.toISOString(),
    version: version,
    environment: 'production',
    timestamp: Date.now()
  }
  writeFileSync('public/build-info.json', JSON.stringify(buildInfo, null, 2))

  // Build with explicit configuration
  console.log('🏗️ Building application...')
  execSync('npx vite build --mode production', { stdio: 'inherit' })

  console.log('✅ Simplified build completed successfully!')

} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}
