# 🚀 Guía de Deploy con Versionado Automático

## Sistema de Deploy Implementado

Hemos implementado un sistema completo de deploy con versionado automático para **Housenovo Directorios Empresariales**.

### ✨ Características del Sistema

- **🔄 Versionado Automático**: Versiones basadas en timestamp (YYYY.MM.DD.HHMM)
- **📊 Información de Build**: Hash de Git, branch, autor, commits
- **🏷️ Tags Automáticos**: Creación automática de tags de Git
- **🔍 Debug Mejorado**: Información detallada de versión en la UI
- **⚡ Deploy Rápido**: Scripts optimizados para diferentes escenarios

## 🛠️ Scripts Disponibles

### Deploy Completo (Recomendado)
```bash
npm run deploy
```
- ✅ Verifica cambios pendientes
- ✅ Genera información de build
- ✅ Crea commit automático si es necesario
- ✅ Push a GitHub con tags
- ✅ Información detallada del deploy

### Deploy Rápido
```bash
npm run deploy:quick
```
- ⚡ Deploy directo sin confirmaciones
- 🚀 Para cambios menores y hotfixes

### Deploy Forzado
```bash
npm run deploy:force
```
- 💥 Force push (usar con cuidado)
- 🔥 Para resolver conflictos de Git

### Generar Solo Información de Versión
```bash
npm run version:auto
```
- 📋 Solo genera `build-info.json`
- 🔧 Para testing local

## 📊 Información de Versión

### Formato de Versión
- **Automático**: `v{MAJOR.MINOR.PATCH}-{YYYY.MM.DD.HHMM}` (ej: `v1.1.1-2025.09.23.0220`)
- **Manual**: Se puede sobrescribir con `VITE_APP_VERSION`
- **Semántica**: Basado en `package.json` + timestamp único

### Información Incluida
```json
{
  "buildDate": "2025-01-15T14:30:00.000Z",
  "buildHash": "a1b2c3d4e5f6...",
  "buildHashShort": "a1b2c3d",
  "buildBranch": "main",
  "buildCommit": "🚀 Implementar versionado automático",
  "buildAuthor": "Jaime",
  "version": "v1.1.1-2025.09.23.0220",
  "autoVersion": "v1.1.1-2025.09.23.0220",
  "commitCount": 42,
  "lastTag": "v2025.01.15.1420",
  "environment": "production",
  "timestamp": 1737037800000,
  "deployId": "main-a1b2c3d-1737037800000"
}
```

## 🔍 Verificación de Deploy

### En la Aplicación
1. **Debug Info**: Expandir la sección "🔧 Información de Debug y Versión"
2. **Verificar**: Versión, Deploy ID, Git Hash, Build Date
3. **Conexión**: Estado de Supabase y tablas

### En Netlify
1. **Dashboard**: https://app.netlify.com/sites/housenovo-directorios
2. **Deploys**: Ver historial de deploys con versiones
3. **Build Logs**: Verificar información de build

### En GitHub
1. **Commits**: Ver commits automáticos con versión
2. **Tags**: Ver tags creados automáticamente
3. **Releases**: Historial de versiones

## 🚨 Resolución de Problemas

### Error de Build
```bash
# Verificar sintaxis
npm run lint

# Build local
npm run build:local

# Verificar dependencias
npm install
```

### Error de Git
```bash
# Verificar estado
git status

# Limpiar staging
git reset HEAD

# Forzar push si es necesario
npm run deploy:force
```

### Error de Netlify
1. **Verificar Variables**: Supabase URL y Key
2. **Build Logs**: Revisar logs en Netlify
3. **Redeploy**: Forzar nuevo deploy

## 📈 Flujo de Trabajo Recomendado

### Desarrollo Normal
1. **Hacer cambios** en el código
2. **Probar localmente**: `npm run dev`
3. **Deploy**: `npm run deploy`
4. **Verificar**: Revisar Debug Info en producción

### Hotfix Urgente
1. **Cambios rápidos**
2. **Deploy rápido**: `npm run deploy:quick`
3. **Verificar**: Funcionalidad en producción

### Rollback
1. **Identificar versión anterior** en GitHub tags
2. **Revertir cambios**: `git revert <commit>`
3. **Deploy**: `npm run deploy`

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Local (.env)
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_key
VITE_APP_VERSION=version_personalizada

# Netlify (Dashboard)
VITE_SUPABASE_URL=tu_url_produccion
VITE_SUPABASE_ANON_KEY=tu_key_produccion
```

### Personalizar Versionado
Editar `scripts/build-info.js`:
- Cambiar formato de fecha
- Agregar información adicional
- Modificar lógica de versionado

## 📞 Soporte

### Comandos Útiles
```bash
# Estado completo
git status && npm run version:auto

# Información de build
cat public/build-info.json

# Últimos commits
git log --oneline -5

# Últimos tags
git tag --sort=-version:refname | head -5
```

### Enlaces Importantes
- **App**: https://housenovo-directorios.netlify.app
- **GitHub**: https://github.com/Jaimemprendedor2/HDE
- **Netlify**: https://app.netlify.com/sites/housenovo-directorios
- **Supabase**: https://ijqukrbbzxuczikjowaf.supabase.co

---

**✨ ¡El sistema de deploy está listo! Usa `npm run deploy` para deploys completos y automáticos.**
