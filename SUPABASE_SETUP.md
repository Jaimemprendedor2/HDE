# Configuración de Supabase

## 📋 Pasos para configurar Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - **Name**: `housenovo-directorios`
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Selecciona la más cercana

### 2. Obtener las credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon public** key (VITE_SUPABASE_ANON_KEY)

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui

# Configuración de la API (opcional)
VITE_API_URL=http://localhost:3001/api

# Configuración de la aplicación
VITE_APP_NAME=Housenovo Directorios Empresariales
VITE_APP_VERSION=1.0.0
```

### 4. Verificar la configuración

1. Ejecuta el proyecto:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:5173`
3. Verifica que el componente "SupabaseStatus" muestre:
   - ✅ Supabase conectado (si está bien configurado)
   - ❌ Error con instrucciones (si falta configuración)

## 🔧 Estructura de la base de datos

### Tablas recomendadas:

```sql
-- Tabla de empresas
CREATE TABLE empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  sector VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  website VARCHAR(255),
  logo VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reuniones
CREATE TABLE reuniones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  hora TIME NOT NULL,
  participantes TEXT[],
  estado VARCHAR(20) DEFAULT 'programada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rol VARCHAR(20) DEFAULT 'usuario',
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Uso del cliente

```typescript
import { supabase } from '../services/supabaseClient'

// Ejemplo de uso
const { data, error } = await supabase
  .from('empresas')
  .select('*')
  .limit(10)
```

## 🔍 Troubleshooting

### Error: "VITE_SUPABASE_URL no está definida"
- Verifica que el archivo `.env` existe
- Verifica que la variable está escrita correctamente
- Reinicia el servidor de desarrollo

### Error: "VITE_SUPABASE_ANON_KEY no está definida"
- Verifica que copiaste la clave correcta desde Supabase
- Verifica que no hay espacios extra en la clave

### Error de conexión
- Verifica que la URL de Supabase es correcta
- Verifica que el proyecto está activo en Supabase
- Verifica tu conexión a internet

## 📚 Recursos adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de autenticación](https://supabase.com/docs/guides/auth)
- [Guía de base de datos](https://supabase.com/docs/guides/database)
