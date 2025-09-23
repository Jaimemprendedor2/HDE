#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function execCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue')
    const result = execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    log(`✅ ${description} completado`, 'green')
    return result
  } catch (error) {
    log(`❌ Error en ${description}:`, 'red')
    log(error.message, 'red')
    process.exit(1)
  }
}

function getBuildInfo() {
  try {
    if (existsSync('public/build-info.json')) {
      const buildInfo = JSON.parse(readFileSync('public/build-info.json', 'utf8'))
      return buildInfo
    }
  } catch (error) {
    log('⚠️ No se pudo leer build-info.json', 'yellow')
  }
  return null
}

function main() {
  log('\n🚀 INICIANDO DEPLOY AUTOMÁTICO CON VERSIONADO', 'bright')
  log('=' .repeat(50), 'cyan')

  // 1. Verificar estado de git
  log('\n📋 Verificando estado de Git...', 'blue')
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
    if (gitStatus.trim()) {
      log('⚠️ Hay cambios sin commitear:', 'yellow')
      log(gitStatus, 'yellow')
      
      const readline = await import('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      const answer = await new Promise((resolve) => {
        rl.question('¿Deseas hacer commit automático de estos cambios? (y/n): ', resolve)
      })
      rl.close()
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        execCommand('git add .', 'Agregando cambios al staging')
        
        const buildInfo = getBuildInfo()
        const commitMessage = buildInfo 
          ? `🚀 Auto-deploy ${buildInfo.autoVersion} - ${buildInfo.buildCommit}`
          : `🚀 Auto-deploy - ${new Date().toISOString()}`
        
        execCommand(`git commit -m "${commitMessage}"`, 'Haciendo commit de cambios')
      } else {
        log('❌ Deploy cancelado por el usuario', 'red')
        process.exit(1)
      }
    }
  } catch (error) {
    log('⚠️ Error verificando estado de git:', 'yellow')
    log(error.message, 'yellow')
  }

  // 2. Obtener información del build
  const buildInfo = getBuildInfo()
  if (buildInfo) {
    log(`\n📊 Información del Build:`, 'cyan')
    log(`   Versión: ${buildInfo.autoVersion}`, 'green')
    log(`   Branch: ${buildInfo.buildBranch}`, 'green')
    log(`   Commit: ${buildInfo.buildHashShort}`, 'green')
    log(`   Autor: ${buildInfo.buildAuthor}`, 'green')
    log(`   Deploy ID: ${buildInfo.deployId}`, 'green')
  }

  // 3. Push a GitHub
  execCommand('git push origin main', 'Enviando cambios a GitHub')

  // 4. Crear tag si es necesario
  if (buildInfo && buildInfo.autoVersion) {
    const tagName = buildInfo.autoVersion // Ya incluye el 'v' al inicio
    try {
      execSync(`git tag -l ${tagName}`, { encoding: 'utf8' })
      log(`✅ Tag ${tagName} ya existe`, 'green')
    } catch {
      log(`\n🏷️ Creando tag ${tagName}...`, 'blue')
      execCommand(`git tag -a ${tagName} -m "Release ${tagName}"`, 'Creando tag')
      execCommand(`git push origin ${tagName}`, 'Enviando tag a GitHub')
    }
  }

  // 5. Información final
  log('\n🎉 DEPLOY COMPLETADO EXITOSAMENTE', 'bright')
  log('=' .repeat(50), 'cyan')
  
  if (buildInfo) {
    log(`\n📱 Aplicación desplegada:`, 'green')
    log(`   Versión: ${buildInfo.autoVersion}`, 'green')
    log(`   Deploy ID: ${buildInfo.deployId}`, 'green')
    log(`   URL: https://housenovo-directorios.netlify.app`, 'cyan')
    
    log(`\n🔗 Enlaces útiles:`, 'blue')
    log(`   GitHub: https://github.com/Jaimemprendedor2/HDE`, 'cyan')
    log(`   Netlify: https://app.netlify.com/sites/housenovo-directorios`, 'cyan')
    log(`   Build Log: https://app.netlify.com/sites/housenovo-directorios/deploys`, 'cyan')
  }

  log('\n✨ El deploy automático está completo. Netlify se encargará del resto.', 'bright')
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    log(`\n❌ Error fatal en el deploy:`, 'red')
    log(error.message, 'red')
    process.exit(1)
  })
}

export { main as deploy }
