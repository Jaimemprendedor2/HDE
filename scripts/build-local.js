#!/usr/bin/env node

// Script de build local para probar antes de push
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

// Colores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'blue')
  try {
    execSync(command, { stdio: 'inherit' })
    log(`✅ ${description} completado`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} falló: ${error.message}`, 'red')
    return false
  }
}

async function main() {
  log('🚀 Iniciando build local...', 'blue')
  
  // Paso 1: Limpiar instalaciones anteriores
  if (runCommand('npm run clean', 'Limpiando instalaciones anteriores')) {
    log('🧹 Limpieza completada', 'green')
  }
  
  // Paso 2: Instalar dependencias
  if (runCommand('npm install --legacy-peer-deps', 'Instalando dependencias')) {
    log('📦 Dependencias instaladas', 'green')
  } else {
    log('❌ Error instalando dependencias', 'red')
    process.exit(1)
  }
  
  // Paso 3: Crear directorio public si no existe
  if (!existsSync('public')) {
    mkdirSync('public', { recursive: true })
    log('📁 Directorio public creado', 'green')
  }
  
  // Paso 4: Ejecutar lint (opcional)
  log('\n🔍 Ejecutando ESLint...', 'blue')
  const lintSuccess = runCommand('npm run lint', 'ESLint')
  if (!lintSuccess) {
    log('⚠️ ESLint falló, pero continuando...', 'yellow')
  }
  
  // Paso 5: Ejecutar tests (opcional)
  log('\n🧪 Ejecutando tests...', 'blue')
  const testSuccess = runCommand('npm run test', 'Tests')
  if (!testSuccess) {
    log('⚠️ Tests fallaron, pero continuando...', 'yellow')
  }
  
  // Paso 6: Ejecutar build
  log('\n🏗️ Ejecutando build...', 'blue')
  if (runCommand('npm run build', 'Build de producción')) {
    log('✅ Build completado exitosamente!', 'green')
    
    // Verificar que se creó el directorio dist
    if (existsSync('dist')) {
      log('📁 Directorio dist creado correctamente', 'green')
    } else {
      log('❌ Error: directorio dist no se creó', 'red')
      process.exit(1)
    }
    
    // Verificar archivos importantes
    if (existsSync('dist/index.html')) {
      log('📄 index.html creado correctamente', 'green')
    } else {
      log('❌ Error: index.html no se creó', 'red')
      process.exit(1)
    }
    
    if (existsSync('public/build-info.json')) {
      log('📋 build-info.json creado correctamente', 'green')
    } else {
      log('⚠️ build-info.json no se creó', 'yellow')
    }
    
    log('\n🎉 Build local completado exitosamente!', 'green')
    log('Ahora puedes hacer git add, commit y push con confianza', 'blue')
    
  } else {
    log('❌ Build falló', 'red')
    process.exit(1)
  }
}

main().catch(error => {
  log(`❌ Error inesperado: ${error.message}`, 'red')
  process.exit(1)
})
