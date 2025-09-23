# Base de Datos - Housenovo Directorios Empresariales

## 📋 Estructura de la Base de Datos

### 🗂️ Migraciones
- `2025-09-22-schema-core.sql` - Esquema principal con todas las tablas core

### 📊 Tablas Principales

#### 1. **participants**
Almacena información de los participantes del programa.
```sql
- id (UUID, PK)
- full_name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- venture_name (VARCHAR)
- venture_code (VARCHAR, UNIQUE)
- company (VARCHAR)
- role (VARCHAR)
- created_at (TIMESTAMP)
```

#### 2. **meeting_participants**
Relación muchos a muchos entre meetings y participants.
```sql
- id (UUID, PK)
- meeting_id (UUID, FK)
- participant_id (UUID, FK)
- invited (BOOLEAN)
- active (BOOLEAN)
- created_at (TIMESTAMP)
- UNIQUE(meeting_id, participant_id)
```

#### 3. **session_attendance**
Registro de asistencia a las sesiones.
```sql
- id (UUID, PK)
- session_id (UUID, FK)
- participant_id (UUID, FK)
- status (ENUM: 'present', 'late', 'absent', 'excused')
- check_in_at (TIMESTAMP)
- note (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### 4. **session_notes**
Notas y actas de las sesiones.
```sql
- id (UUID, PK)
- session_id (UUID, FK)
- title (VARCHAR)
- summary (TEXT)
- decisions (TEXT)
- followups (TEXT)
- created_by (UUID, FK)
- created_at, updated_at (TIMESTAMP)
```

#### 5. **session_evaluations**
Evaluaciones de las sesiones.
```sql
- id (UUID, PK)
- session_id (UUID, FK)
- participant_id (UUID, FK, NULLABLE)
- evaluator_role (ENUM: 'coach', 'participante', 'coordinador')
- score_overall (INTEGER, 1-5)
- score_listening (INTEGER, 1-5)
- score_feedback (INTEGER, 1-5)
- comments (TEXT)
- created_at (TIMESTAMP)
```

### 🔒 Seguridad (RLS)

Todas las tablas tienen **Row Level Security** habilitado con políticas que permiten:

- **Participantes**: Ver y editar solo su propia información
- **Coordinadores**: Gestionar participantes y sesiones
- **Administradores**: Acceso completo a todos los datos

### 🚀 Funciones de Utilidad

#### `get_session_participants(session_uuid)`
Obtiene todos los participantes de una sesión específica.

#### `get_session_attendance_stats(session_uuid)`
Obtiene estadísticas de asistencia de una sesión.

### 📈 Índices Optimizados

- **Búsquedas por email**: `idx_participants_email`
- **Búsquedas por venture_code**: `idx_participants_venture_code`
- **Filtros por meeting**: `idx_meeting_participants_meeting_id`
- **Filtros por sesión**: `idx_session_attendance_session_id`
- **Evaluaciones por sesión**: `idx_session_evaluations_session_id`

### 🔧 Aplicar Migración

```sql
-- Ejecutar en Supabase SQL Editor
\i database/migrations/2025-09-22-schema-core.sql
```

### 📝 Notas Importantes

1. **Foreign Keys**: Todas las relaciones están correctamente definidas con CASCADE donde corresponde
2. **Constraints**: Validaciones de datos en columnas críticas (scores 1-5, status válidos)
3. **Triggers**: Actualización automática de `updated_at`
4. **Datos de Prueba**: Incluye participantes de ejemplo para testing

### 🎯 Próximos Pasos

1. Ejecutar la migración en Supabase
2. Configurar las políticas RLS según necesidades
3. Crear usuarios de prueba
4. Probar las funciones de utilidad
