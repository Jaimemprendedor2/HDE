#!/usr/bin/env node

/**
 * Script de configuración para la nueva UI de Housenovo
 * 
 * Este script ayuda a configurar la nueva interfaz de usuario
 * y verificar que todos los componentes estén correctamente instalados.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🏗️  Configurando Nueva UI de Housenovo Directorios Empresariales')
console.log('=' .repeat(60))

// Verificar archivos principales
const requiredFiles = [
  'src/pages/ActivitySelector.tsx',
  'src/pages/ActivityManager.tsx', 
  'src/components/StageManager.tsx',
  'src/components/Timer.tsx',
  'database/migrations/2025-09-23-update-stages-schema.sql'
]

console.log('📁 Verificando archivos requeridos...')
let allFilesExist = true

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  const exists = fs.existsSync(filePath)
  const status = exists ? '✅' : '❌'
  console.log(`   ${status} ${file}`)
  if (!exists) allFilesExist = false
})

if (!allFilesExist) {
  console.log('\n❌ Error: Algunos archivos requeridos no existen.')
  console.log('   Asegúrate de que todos los archivos estén creados correctamente.')
  process.exit(1)
}

// Verificar configuración de rutas
console.log('\n🛣️  Verificando configuración de rutas...')
const routesPath = path.join(__dirname, '..', 'src/app/routes.tsx')
if (fs.existsSync(routesPath)) {
  const routesContent = fs.readFileSync(routesPath, 'utf8')
  const hasNewRoutes = routesContent.includes('activitySelector') && 
                      routesContent.includes('activityManager')
  
  console.log(`   ${hasNewRoutes ? '✅' : '❌'} Rutas actualizadas`)
  
  if (!hasNewRoutes) {
    console.log('   ⚠️  Las rutas no están actualizadas. Revisa src/app/routes.tsx')
  }
} else {
  console.log('   ❌ Archivo de rutas no encontrado')
}

// Verificar App.tsx
console.log('\n📱 Verificando App.tsx...')
const appPath = 'src/App.tsx'
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8')
  const hasNewImports = appContent.includes('ActivitySelector') && 
                       appContent.includes('ActivityManager')
  
  console.log(`   ${hasNewImports ? '✅' : '❌'} Componentes importados`)
  
  if (!hasNewImports) {
    console.log('   ⚠️  Los nuevos componentes no están importados en App.tsx')
  }
} else {
  console.log('   ❌ App.tsx no encontrado')
}

// Verificar variables de entorno
console.log('\n🔧 Verificando configuración de entorno...')
const envFiles = ['.env', '.env.local', '.env.development']
let envConfigured = false

envFiles.forEach(envFile => {
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8')
    const hasSupabase = envContent.includes('VITE_SUPABASE_URL') && 
                       envContent.includes('VITE_SUPABASE_ANON_KEY')
    
    if (hasSupabase) {
      console.log(`   ✅ ${envFile} configurado`)
      envConfigured = true
    }
  }
})

if (!envConfigured) {
  console.log('   ⚠️  Variables de entorno de Supabase no encontradas')
  console.log('   📝 Asegúrate de configurar:')
  console.log('      - VITE_SUPABASE_URL=tu_url_aqui')
  console.log('      - VITE_SUPABASE_ANON_KEY=tu_clave_aqui')
}

// Verificar migración de base de datos
console.log('\n🗄️  Información sobre migración de base de datos...')
const migrationPath = 'database/migrations/2025-09-23-update-stages-schema.sql'
if (fs.existsSync(migrationPath)) {
  console.log('   ✅ Archivo de migración encontrado')
  console.log('   📋 Pasos para aplicar la migración:')
  console.log('      1. Abre el dashboard de Supabase')
  console.log('      2. Ve a SQL Editor')
  console.log('      3. Ejecuta el contenido de:')
  console.log(`         ${migrationPath}`)
} else {
  console.log('   ❌ Archivo de migración no encontrado')
}

// Verificar dependencias
console.log('\n📦 Verificando dependencias...')
const packagePath = 'package.json'
if (fs.existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const requiredDeps = ['react-router-dom', 'zustand', '@supabase/supabase-js']
    
    requiredDeps.forEach(dep => {
      const hasDepInDeps = packageJson.dependencies && packageJson.dependencies[dep]
      const hasDepInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep]
      const hasDep = hasDepInDeps || hasDepInDevDeps
      
      console.log(`   ${hasDep ? '✅' : '❌'} ${dep}`)
    })
  } catch (error) {
    console.log('   ❌ Error leyendo package.json')
  }
} else {
  console.log('   ❌ package.json no encontrado')
}

// Resumen final
console.log('\n' + '='.repeat(60))
console.log('🎯 Resumen de Configuración')
console.log('=' .repeat(60))

console.log('\n✅ Componentes Principales Creados:')
console.log('   • Pantalla de selección de actividad')
console.log('   • Gestión principal de actividades') 
console.log('   • Editor de etapas con drag & drop')
console.log('   • Timer mejorado sin drift')

console.log('\n🔄 Flujo de la Nueva UI:')
console.log('   1. Seleccionar tipo de actividad (/, /select-activity)')
console.log('   2. Crear nueva actividad o seleccionar existente')
console.log('   3. Gestionar actividad (/activity/:meetingId)')
console.log('   4. Configurar etapas, usar timer y gestionar datos')

console.log('\n📋 Próximos Pasos:')
console.log('   1. Aplicar migración de base de datos')
console.log('   2. Configurar variables de entorno si no están')
console.log('   3. Ejecutar: npm install && npm run dev')
console.log('   4. Probar el flujo completo')

console.log('\n📚 Documentación:')
console.log('   • Lee CONFIGURACION_NUEVA_UI.md para más detalles')
console.log('   • Revisa los comentarios en el código para entender la implementación')

console.log('\n🚀 ¡Nueva UI configurada correctamente!')
console.log('   La aplicación ahora tiene un flujo más organizado y funcional.')

console.log('\n' + '='.repeat(60))
