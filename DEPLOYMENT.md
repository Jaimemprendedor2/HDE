# Guía de Deployment

## 🚀 GitHub Actions CI/CD

### Configuración Automática
El proyecto incluye workflows de GitHub Actions que se ejecutan automáticamente:

- **Push a main**: Lint → Test → Build → Deploy a producción
- **Pull Request**: Lint → Test → Build → Deploy preview
- **Dependencias**: Verificación semanal de dependencias obsoletas

### Secrets Requeridos
Configurar en GitHub Settings > Secrets:

```bash
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id
LHCI_GITHUB_APP_TOKEN=your-lighthouse-ci-token
```

## 🌐 Netlify Configuration

### Configuración Automática
El archivo `netlify.toml` configura automáticamente:

- **Node.js**: Versión 18
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`
- **SPA Routing**: Redirects configurados
- **Headers de Seguridad**: Configurados
- **Cache**: Assets estáticos cacheados

### Configuración Manual
Si prefieres configurar manualmente en Netlify:

1. **Site Settings > Build & Deploy > Build Settings**:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - Node Version: `18`

2. **Site Settings > Build & Deploy > Environment Variables**:
   ```bash
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Site Settings > Build & Deploy > Post Processing > Snippet Injection**:
   ```html
   <!-- Add any global scripts here -->
   ```

## 🔧 Build Process

### Scripts de Build
```bash
npm run build          # Build completo con lint + test
npm run build:info     # Generar información de build
npm run preview        # Preview del build local
```

### Información de Build
El build genera automáticamente:
- `dist/build-info.json`: Información del build (hash, fecha, branch)
- Assets optimizados y cacheados
- Service Worker (si está configurado)

## 🌍 Environment Variables

### Desarrollo Local
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Producción (Netlify)
Configurar en Netlify Dashboard:
```bash
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
```

## 📊 Performance Monitoring

### Lighthouse CI
- **Automatizado**: En cada deploy a producción
- **Thresholds**: Performance 80%, Accessibility 90%
- **Reports**: Subidos a GitHub como comentarios

### Configuración
```bash
# Instalar Lighthouse CI
npm install -g @lhci/cli@0.12.x

# Ejecutar localmente
lhci autorun
```

## 🔒 Security Headers

### Configurados Automáticamente
```http
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Cache Headers
```http
# Static assets
/assets/*: Cache-Control: public, max-age=31536000, immutable

# Service Worker
/sw.js: Cache-Control: public, max-age=0, must-revalidate
```

## 🚀 Deployment Steps

### 1. Preparación
```bash
# Verificar que todo funciona
npm run lint
npm run test
npm run build
npm run preview
```

### 2. Deploy Automático
```bash
# Push a main branch
git push origin main

# GitHub Actions se ejecuta automáticamente:
# 1. Lint code
# 2. Run tests
# 3. Build application
# 4. Deploy to Netlify
# 5. Run Lighthouse audit
```

### 3. Deploy Manual
```bash
# Build local
npm run build

# Deploy con Netlify CLI
npx netlify deploy --prod --dir=dist
```

## 🔍 Troubleshooting

### Build Fails
```bash
# Verificar dependencias
npm ci

# Limpiar cache
npm run clean

# Verificar variables de entorno
npm run build -- --mode=development
```

### Deploy Fails
```bash
# Verificar Netlify logs
npx netlify logs

# Verificar configuración
npx netlify status

# Verificar secrets
echo $NETLIFY_AUTH_TOKEN
```

### Performance Issues
```bash
# Analizar bundle
npm run build
npx vite-bundle-analyzer dist/assets/*.js

# Verificar Lighthouse
npm run preview
# Abrir http://localhost:4173 en Lighthouse
```

## 📈 Monitoring

### Netlify Analytics
- **Page Views**: Automático en Netlify
- **Performance**: Core Web Vitals
- **Errors**: 404s y errores de build

### GitHub Actions
- **Build Status**: En cada commit
- **Test Coverage**: Reportes automáticos
- **Security**: Audit de dependencias

### Custom Analytics
```javascript
// En tu aplicación
if (import.meta.env.VITE_ENABLE_ANALYTICS) {
  // Configurar analytics
  gtag('config', 'GA_TRACKING_ID')
}
```

## 🔄 Rollback

### Netlify
```bash
# Ver deploys
npx netlify deploy:list

# Rollback a deploy anterior
npx netlify deploy:rollback
```

### GitHub
```bash
# Revert commit
git revert HEAD
git push origin main
```

## 📚 Recursos

- [Netlify Docs](https://docs.netlify.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Vite Build](https://vitejs.dev/guide/build.html)
