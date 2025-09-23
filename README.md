# Housenovo Directorios Empresariales

Una aplicación React + TypeScript para la gestión de directorios empresariales y reuniones.

## 🚀 Tecnologías

- **React 18** con TypeScript
- **Vite** como bundler
- **React Router DOM** para navegación
- **Zustand** para manejo de estado
- **Supabase** para base de datos y autenticación
- **Tailwind CSS** para estilos
- **ESLint + Prettier** para calidad de código
- **Vitest + Testing Library** para testing

## 📁 Estructura del Proyecto

```
src/
├── app/
│   └── routes.tsx          # Configuración de rutas
├── pages/
│   ├── Directorio.tsx      # Página del directorio
│   └── Meeting.tsx         # Página de reuniones
├── components/
│   ├── Header.tsx          # Componente de cabecera
│   ├── Navigation.tsx      # Navegación principal
│   ├── LoadingSpinner.tsx  # Spinner de carga
│   ├── ErrorMessage.tsx    # Mensaje de error
│   └── index.ts           # Exportaciones de componentes
├── stores/
│   └── useAppStore.ts      # Store de Zustand
├── services/
│   ├── api.ts              # Servicios de API
│   └── supabaseClient.ts   # Cliente de Supabase
├── types/
│   └── index.ts            # Tipos TypeScript
├── utils/
│   └── index.ts            # Utilidades
├── styles/
│   └── globals.css         # Estilos globales
└── test/
    └── setup.ts            # Configuración de tests
```

## 🛠️ Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Ejecutar en modo desarrollo:
```bash
npm run dev
```

3. Construir para producción:
```bash
npm run build
```

4. Ejecutar tests:
```bash
npm test
```

5. Ejecutar linting:
```bash
npm run lint
```

## 🎯 Rutas Disponibles

- `/` - Redirige al directorio
- `/directorio` - Página del directorio empresarial
- `/meeting` - Página de reuniones

## 🎨 Características

- ✅ Configuración completa de TypeScript
- ✅ Routing con React Router DOM
- ✅ Estado global con Zustand
- ✅ **Integración con Supabase** para base de datos
- ✅ **Validación de variables de entorno** con errores claros
- ✅ **Componente de estado de Supabase** para monitoreo
- ✅ Estilos con Tailwind CSS
- ✅ Linting y formateo automático
- ✅ Testing con Vitest
- ✅ Estructura de carpetas organizada
- ✅ Componentes reutilizables
- ✅ Tipos TypeScript definidos
- ✅ Servicios de API configurados

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de la construcción
- `npm run lint` - Verificar código con ESLint
- `npm run lint:fix` - Corregir errores de ESLint automáticamente
- `npm test` - Ejecutar tests
- `npm run test:ui` - Interfaz de tests
- `npm run test:coverage` - Tests con cobertura

## 📝 Variables de Entorno

Crear un archivo `.env` con:

```env
# Configuración de Supabase (REQUERIDO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui

# Configuración de la API (opcional)
VITE_API_URL=http://localhost:3001/api

# Configuración de la aplicación
VITE_APP_NAME=Housenovo Directorios Empresariales
VITE_APP_VERSION=1.0.0
```

> **⚠️ Importante**: Las variables de Supabase son **requeridas** para que la aplicación funcione correctamente. Ver [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para instrucciones detalladas.

## 🚀 Desarrollo

El proyecto está listo para desarrollo. Puedes:

1. Agregar nuevos componentes en `src/components/`
2. Crear nuevas páginas en `src/pages/`
3. Definir tipos en `src/types/`
4. Agregar utilidades en `src/utils/`
5. Configurar servicios de API en `src/services/`
6. Manejar estado global en `src/stores/`

¡El proyecto está completamente configurado y listo para usar! 🎉
