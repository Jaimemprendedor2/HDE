import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

try {
  // Get build information
  const buildDate = new Date().toISOString()
  const buildHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  const buildBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  const buildCommit = execSync('git log -1 --pretty=format:"%s"', { encoding: 'utf8' }).trim()

  // Create build info object
  const buildInfo = {
    buildDate,
    buildHash,
    buildBranch,
    buildCommit,
    version: process.env.VITE_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

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
    buildBranch: 'unknown',
    buildCommit: 'unknown',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }

  writeFileSync(
    'public/build-info.json',
    JSON.stringify(buildInfo, null, 2)
  )
}
