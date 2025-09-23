#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔧 Configurando archivo .env para Housenovo Directorios Empresariales')
console.log('')

// Verificar si ya existe un archivo .env
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  console.log('⚠️  Ya existe un archivo .env')
  console.log('¿Deseas sobrescribirlo? (y/N)')
  process.exit(0)
}

// Contenido del archivo .env
const envContent = `# Configuración de Supabase - REEMPLAZA CON TUS VALORES REALES
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Configuración de la API (opcional)
VITE_API_URL=http://localhost:3001/api

# Configuración de la aplicación
VITE_APP_NAME=Housenovo Directorios Empresariales
VITE_APP_VERSION=1.0.0
`

try {
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Archivo .env creado exitosamente')
  console.log('')
  console.log('📝 Próximos pasos:')
  console.log('1. Ve a https://supabase.com y crea un proyecto')
  console.log('2. Copia tu Project URL y anon key')
  console.log('3. Reemplaza los valores en el archivo .env')
  console.log('4. Ejecuta npm run dev para verificar la configuración')
  console.log('')
  console.log('📚 Para más detalles, consulta SUPABASE_SETUP.md')
} catch (error) {
  console.error('❌ Error creando archivo .env:', error.message)
  process.exit(1)
}
