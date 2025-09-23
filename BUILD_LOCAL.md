# 🚀 Build Local - Guía de Uso

## 📋 Scripts Disponibles

### **Build Local Completo**
```bash
npm run build:local
```
- Limpia instalaciones anteriores
- Instala dependencias
- Ejecuta lint, tests y build
- Verifica que todo funcione correctamente
- **Recomendado antes de hacer push**

### **Build Rápido**
```bash
npm run build:quick
```
- Solo ejecuta el build
- **Usar solo si ya tienes node_modules instalado**

### **Verificación Rápida**
```bash
npm run build:check
```
- Ejecuta lint + test + build
- **Ideal para verificación rápida**

## 🔄 Proceso Recomendado

### **1. Desarrollo Normal**
```bash
# Hacer cambios en el código
# Probar localmente
npm run build:local

# Si funciona, hacer commit
git add .
git commit -m "fix: descripción de los cambios"
git push
```

### **2. Desarrollo Rápido**
```bash
# Si ya tienes node_modules
npm run build:quick

# Si funciona, hacer commit
git add .
git commit -m "fix: descripción de los cambios"
git push
```

### **3. Verificación Pre-commit**
```bash
# El hook automático ejecutará:
npm run build:check

# Si falla, el commit se cancela
# Si pasa, el commit continúa
```

## 🛠️ Configuración

### **Pre-commit Hook**
El archivo `.husky/pre-commit` está configurado para:
- Ejecutar `npm run build:check` antes de cada commit
- Cancelar el commit si el build falla
- Permitir el commit solo si todo pasa

### **Workflow Simplificado**
El archivo `.github/workflows/ci-simple.yml` está configurado para:
- Solo ejecutar build (sin lint ni tests)
- Ser más rápido y confiable
- Subir artifacts al final

## 🎯 Ventajas

1. **Detección Temprana**: Encuentras errores antes de hacer push
2. **Menos Commits**: Solo commiteas cuando sabes que funciona
3. **Feedback Rápido**: No esperas a que falle en GitHub Actions
4. **Confianza**: Sabes que el build funcionará en CI/CD
5. **Ahorro de Tiempo**: No pierdes tiempo con builds que fallan

## 🚨 Solución de Problemas

### **Error: "npm run build:local" no funciona**
```bash
# Verificar que el archivo existe
ls -la scripts/build-local.js

# Dar permisos de ejecución
chmod +x scripts/build-local.js
```

### **Error: "Pre-commit hook no funciona"**
```bash
# Verificar que Husky está instalado
npm run prepare

# Verificar que el hook existe
ls -la .husky/pre-commit
```

### **Error: "Build falla localmente"**
```bash
# Limpiar todo y empezar de nuevo
npm run clean
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build:local
```

## 📝 Notas

- **build:local**: Usar para verificación completa antes de push
- **build:quick**: Usar para desarrollo rápido
- **build:check**: Usar para verificación sin limpieza
- **pre-commit**: Se ejecuta automáticamente en cada commit
