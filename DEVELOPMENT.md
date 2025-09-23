# Guía de Desarrollo

## 🚀 Configuración Inicial

### Prerequisitos
- Node.js 18+ 
- npm 9+ o yarn 1.22+

### Instalación
```bash
# Instalar dependencias
npm install

# Configurar Husky para pre-commit hooks
npm run prepare
```

## 📋 Scripts Disponibles

### Desarrollo
```bash
npm run dev          # Servidor de desarrollo con hot reload
npm run build        # Build de producción (incluye lint + test)
npm run preview      # Preview del build de producción
```

### Calidad de Código
```bash
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Ejecutar ESLint con auto-fix
npm run format       # Formatear código con Prettier
npm run format:check # Verificar formato sin cambios
npm run type-check   # Verificar tipos TypeScript
```

### Testing
```bash
npm run test         # Ejecutar tests
npm run test:watch   # Ejecutar tests en modo watch
npm run test:ui      # Ejecutar tests con UI
npm run test:coverage # Ejecutar tests con coverage
```

### Utilidades
```bash
npm run clean        # Limpiar archivos generados
npm run prepare      # Configurar Husky
```

## 🛠️ Configuración del Editor

### VS Code (Recomendado)
Instalar las extensiones recomendadas:
```bash
# Las extensiones se instalan automáticamente al abrir el proyecto
code .
```

### Configuración Automática
- **Format on Save**: Habilitado con Prettier
- **Auto Fix ESLint**: Habilitado al guardar
- **Auto Import**: Habilitado para TypeScript
- **Path IntelliSense**: Configurado para alias `@/`

## 📁 Estructura del Proyecto

```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas principales
├── services/      # Servicios y API calls
├── stores/        # Estado global (Zustand)
├── types/         # Definiciones de tipos TypeScript
├── utils/         # Utilidades y helpers
├── hooks/         # Custom hooks
├── styles/        # Estilos globales
└── test/          # Configuración de tests
```

## 🔧 Configuración de Herramientas

### ESLint
- **Configuración**: `eslint.config.js`
- **Plugins**: TypeScript, React, Prettier, Import, JSX A11y
- **Reglas**: Estrictas con enfoque en calidad y accesibilidad

### Prettier
- **Configuración**: `.prettierrc`
- **Estilo**: Sin semicolons, single quotes, trailing commas
- **Integración**: Con ESLint para evitar conflictos

### TypeScript
- **Configuración**: `tsconfig.json`
- **Nivel**: Estricto con todas las verificaciones habilitadas
- **Path Mapping**: Alias `@/` para imports limpios

### Vitest
- **Configuración**: `vite.config.ts`
- **Coverage**: V8 provider con thresholds del 80%
- **Environment**: jsdom para tests de componentes

## 🎯 Estándares de Código

### Convenciones de Naming
```typescript
// Componentes: PascalCase
export const UserProfile = () => {}

// Funciones: camelCase
const getUserData = () => {}

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'

// Interfaces: PascalCase con prefijo I (opcional)
interface UserData { }
```

### Estructura de Archivos
```typescript
// 1. Imports externos
import React from 'react'
import { useState } from 'react'

// 2. Imports internos
import { Button } from '@/components'
import { useUser } from '@/hooks'

// 3. Types/Interfaces
interface Props {
  title: string
}

// 4. Componente principal
export const Component: React.FC<Props> = ({ title }) => {
  // 5. Hooks
  const [state, setState] = useState('')
  
  // 6. Handlers
  const handleClick = () => {}
  
  // 7. Render
  return <div>{title}</div>
}
```

### Imports
- **Orden**: Externos → Internos
- **Alfabetización**: A-Z dentro de cada grupo
- **Separación**: Línea en blanco entre grupos
- **Alias**: Usar `@/` para imports internos

## 🧪 Testing

### Estructura de Tests
```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
└── services/
    ├── api.ts
    └── api.test.ts
```

### Convenciones de Testing
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' }
    
    // Act
    render(<Component {...props} />)
    
    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Coverage
- **Thresholds**: 80% mínimo en branches, functions, lines, statements
- **Exclusiones**: Archivos de configuración, tipos, tests
- **Reportes**: Text, JSON, HTML

## 🔄 Git Workflow

### Pre-commit Hooks
- **ESLint**: Verificación de reglas
- **Type Check**: Verificación de tipos
- **Tests**: Ejecución de tests

### Commits
```bash
# Formato recomendado
feat: add user authentication
fix: resolve timer drift issue
docs: update development guide
test: add timer store tests
refactor: improve sync channel implementation
```

## 🚨 Troubleshooting

### Problemas Comunes

#### ESLint no funciona
```bash
# Verificar configuración
npm run lint

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### Prettier no formatea
```bash
# Verificar configuración
npm run format:check

# Formatear manualmente
npm run format
```

#### Tests fallan
```bash
# Limpiar cache
npm run clean

# Verificar configuración
npm run test -- --reporter=verbose
```

#### TypeScript errors
```bash
# Verificar tipos
npm run type-check

# Limpiar cache de TS
rm -rf node_modules/.cache
```

## 📚 Recursos

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Guide](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
