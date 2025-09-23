#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'

console.log('🚀 Starting Node.js-based Netlify build...')

// Set environment variables
process.env.NODE_ENV = 'production'
process.env.CI = 'true'
process.env.VITE_SUPABASE_URL = 'https://ijqukrbbzxuczikjowaf.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcXVrcmJienh1Y3ppa2pvd2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODc4NjQsImV4cCI6MjA3NDE2Mzg2NH0.dNn8vVwwy5wx9mgEK2Grhfdgq4w0CPNJ-CMlZfuz7Bc'
process.env.VITE_APP_NAME = 'Housenovo Directorios Empresariales'

// Generate version from package.json
console.log('📋 Reading version from package.json...')
let packageVersion = '1.0.0'
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  packageVersion = packageJson.version || '1.0.0'
  console.log(`✅ Package version found: ${packageVersion}`)
} catch (error) {
  console.warn('⚠️ Could not read package.json, using default version:', error.message)
}

const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2, '0')
const day = String(now.getDate()).padStart(2, '0')
const hour = String(now.getHours()).padStart(2, '0')
const minute = String(now.getMinutes()).padStart(2, '0')
const version = `v${packageVersion}-${year}.${month}.${day}.${hour}${minute}`
process.env.VITE_APP_VERSION = version

console.log(`📋 Environment configured:`)
console.log(`   Node: ${process.version}`)
console.log(`   Package Version: ${packageVersion}`)
console.log(`   Full Version: ${version}`)
console.log(`   Supabase URL: ${process.env.VITE_SUPABASE_URL}`)

try {
  // Install dependencies with a simple approach
  console.log('📦 Installing dependencies...')
  execSync('npm install --production=false', { stdio: 'inherit' })

  // Quick verification
  console.log('🔍 Verifying installation...')
  if (existsSync('node_modules') && existsSync('vite.config.ts')) {
    console.log('✅ Basic files found, proceeding with build...')
  } else {
    console.log('⚠️ Some files missing, but attempting build anyway...')
  }

  // Create build info
  console.log('📋 Creating build info...')
  mkdirSync('public', { recursive: true })
  const buildInfo = {
    buildDate: now.toISOString(),
    version: version,
    autoVersion: version,
    environment: 'production',
    timestamp: Date.now(),
    packageVersion: packageVersion
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
      // Try ls first (Unix/Linux/macOS)
      execSync('ls -la dist/', { stdio: 'inherit' })
    } catch {
      try {
        // Fallback for Windows PowerShell
        execSync('Get-ChildItem dist', { stdio: 'inherit', shell: 'powershell.exe' })
      } catch {
        // Final fallback for Windows CMD
        execSync('dir dist', { stdio: 'inherit', shell: true })
      }
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