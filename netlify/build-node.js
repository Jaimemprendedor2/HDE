#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

console.log('🚀 Starting Node.js-based Netlify build...')

// Set environment variables
process.env.NODE_ENV = 'production'
process.env.CI = 'true'
process.env.VITE_SUPABASE_URL = 'https://ijqukrbbzxuczikjowaf.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcXVrcmJienh1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc4NjQsImV4cCI6MjA3NDE2Mzg2NH0.dNn8vVwwy5wx9mgEK2Grhfdgq4w0CPNJ-CMlZfuz7Bc'
process.env.VITE_APP_NAME = 'Housenovo Directorios Empresariales'

// Generate version
const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2, '0')
const day = String(now.getDate()).padStart(2, '0')
const hour = String(now.getHours()).padStart(2, '0')
const minute = String(now.getMinutes()).padStart(2, '0')
const version = `v1.1.1-${year}.${month}.${day}.${hour}${minute}`
process.env.VITE_APP_VERSION = version

console.log(`📋 Environment configured:`)
console.log(`   Node: ${process.version}`)
console.log(`   Version: ${version}`)
console.log(`   Supabase URL: ${process.env.VITE_SUPABASE_URL}`)

try {
  // Install dependencies
  console.log('📦 Installing dependencies...')
  try {
    execSync('npm ci --silent', { stdio: 'inherit' })
  } catch (error) {
    console.log('⚠️ npm ci failed, trying npm install...')
    execSync('npm install --silent', { stdio: 'inherit' })
  }

  // Verify critical files
  console.log('🔍 Checking critical files...')
  const criticalFiles = [
    'node_modules/@vitejs/plugin-react/dist/index.js',
    'node_modules/vite/bin/vite.js',
    'vite.config.ts'
  ]
  
  criticalFiles.forEach(file => {
    if (existsSync(file)) {
      console.log(`✅ ${file} found`)
    } else {
      console.log(`❌ ${file} missing`)
    }
  })

  // Create build info
  console.log('📋 Creating build info...')
  mkdirSync('public', { recursive: true })
  const buildInfo = {
    buildDate: now.toISOString(),
    version: version,
    autoVersion: version,
    environment: 'production',
    timestamp: Date.now()
  }
  writeFileSync('public/build-info.json', JSON.stringify(buildInfo, null, 2))

  // Build application
  console.log('🏗️ Building application...')
  execSync('npx vite build --mode production', { stdio: 'inherit' })

  // Verify output
  console.log('📁 Verifying build...')
  if (existsSync('dist') && existsSync('dist/index.html')) {
    console.log('✅ Build successful!')
    try {
      execSync('ls -la dist/', { stdio: 'inherit' })
    } catch {
      // Fallback for Windows
      execSync('dir dist', { stdio: 'inherit', shell: true })
    }
  } else {
    console.error('❌ Build failed - missing dist/index.html')
    process.exit(1)
  }

  console.log('✅ Node.js build completed successfully!')

} catch (error) {
  console.error('❌ Build failed:', error.message)
  console.error('Stack:', error.stack)
  process.exit(1)
}
