import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { dirname } from 'path'

// Función para obtener la versión semántica base
function getSemanticVersion() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    return packageJson.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

// Función para generar número de versión automático
function generateVersionNumber() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  
  const semanticVersion = getSemanticVersion()
  const timestamp = `${year}.${month}.${day}.${hour}${minute}`
  
  // Formato: v1.1.1-2025.09.23.0220
  return `v${semanticVersion}-${timestamp}`
}

// Función para obtener número de commits desde el último tag
function getCommitsSinceLastTag() {
  try {
    const result = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim()
    return parseInt(result, 10)
  } catch {
    return 0
  }
}

// Función para obtener el último tag
function getLastTag() {
  try {
    return execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
  } catch {
    return 'v0.0.0'
  }
}

try {
  // Get build information
  const buildDate = new Date().toISOString()
  const buildHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  const buildHashShort = buildHash.substring(0, 7)
  const buildBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  const buildCommit = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim()
  const buildAuthor = execSync('git log -1 --pretty=format:"%an"', { encoding: 'utf8' }).trim()
  
  // Generate version information
  const autoVersion = generateVersionNumber()
  const commitCount = getCommitsSinceLastTag()
  const lastTag = getLastTag()
  
  // Create build info object
  const buildInfo = {
    buildDate,
    buildHash,
    buildHashShort,
    buildBranch,
    buildCommit,
    buildAuthor,
    version: process.env.VITE_APP_VERSION || autoVersion,
    autoVersion,
    commitCount,
    lastTag,
    environment: process.env.NODE_ENV || 'development',
    timestamp: Date.now(),
    deployId: `${buildBranch}-${buildHashShort}-${Date.now()}`
  }

  // Ensure public directory exists
  const publicDir = 'public'
  mkdirSync(publicDir, { recursive: true })
  
  // Write build info to public directory
  writeFileSync(
    'public/build-info.json',
    JSON.stringify(buildInfo, null, 2)
  )

  console.log('Build info generated:', buildInfo)
} catch (error) {
  console.log('Build info generation failed, using defaults:', error.message)
  
  // Create default build info
  const buildInfo = {
    buildDate: new Date().toISOString(),
    buildHash: 'unknown',
    buildHashShort: 'unknown',
    buildBranch: 'unknown',
    buildCommit: 'unknown',
    buildAuthor: 'unknown',
    version: process.env.VITE_APP_VERSION || generateVersionNumber(),
    autoVersion: generateVersionNumber(),
    commitCount: 0,
    lastTag: 'v0.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: Date.now(),
    deployId: `unknown-${Date.now()}`
  }

  // Ensure public directory exists
  const publicDir = 'public'
  mkdirSync(publicDir, { recursive: true })

  writeFileSync(
    'public/build-info.json',
    JSON.stringify(buildInfo, null, 2)
  )
}
