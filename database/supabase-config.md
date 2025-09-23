# Configuración de Supabase para HDE

## 🚀 Pasos para Aplicar el Esquema

### 1. Acceder a Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. Ve a **SQL Editor**

### 2. Ejecutar la Migración
1. Copia el contenido de `database/migrations/2025-09-22-schema-core.sql`
2. Pégalo en el SQL Editor
3. Ejecuta la consulta

### 3. Verificar la Creación
```sql
-- Verificar que las tablas se crearon
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'participants', 
    'meeting_participants', 
    'session_attendance', 
    'session_notes', 
    'session_evaluations'
);
```

### 4. Verificar RLS
```sql
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
    'participants', 
    'meeting_participants', 
    'session_attendance', 
    'session_notes', 
    'session_evaluations'
);
```

## 🔧 Configuración Adicional

### Crear Usuarios de Prueba
```sql
-- Insertar usuarios de prueba
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'admin@housenovo.com', crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (uuid_generate_v4(), 'coordinator@housenovo.com', crypt('coord123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (uuid_generate_v4(), 'participant@housenovo.com', crypt('part123', gen_salt('bf')), NOW(), NOW(), NOW());
```

### Configurar Roles
```sql
-- Crear tabla de roles (si no existe)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles de prueba
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'admin@housenovo.com'
UNION ALL
SELECT id, 'coordinator' FROM auth.users WHERE email = 'coordinator@housenovo.com'
UNION ALL
SELECT id, 'participant' FROM auth.users WHERE email = 'participant@housenovo.com';
```

## 🧪 Testing de Funciones

### Probar Funciones de Utilidad
```sql
-- Crear una sesión de prueba
INSERT INTO meeting_sessions (id, meeting_id, title, start_time, end_time)
VALUES (uuid_generate_v4(), (SELECT id FROM meetings LIMIT 1), 'Sesión de Prueba', NOW(), NOW() + INTERVAL '2 hours');

-- Probar función de participantes
SELECT * FROM get_session_participants('session-id-aqui');

-- Probar función de estadísticas
SELECT * FROM get_session_attendance_stats('session-id-aqui');
```

## 📊 Monitoreo

### Verificar Políticas RLS
```sql
-- Ver todas las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN (
    'participants', 
    'meeting_participants', 
    'session_attendance', 
    'session_notes', 
    'session_evaluations'
);
```

### Verificar Índices
```sql
-- Ver índices creados
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename IN (
    'participants', 
    'meeting_participants', 
    'session_attendance', 
    'session_notes', 
    'session_evaluations'
)
ORDER BY tablename, indexname;
```

## 🚨 Troubleshooting

### Error: "relation does not exist"
- Verificar que las tablas `meetings` y `meeting_sessions` existen
- Ejecutar las migraciones en el orden correcto

### Error: "permission denied"
- Verificar que RLS está configurado correctamente
- Verificar que los usuarios tienen los roles apropiados

### Error: "duplicate key value"
- Verificar que los constraints UNIQUE están funcionando
- Limpiar datos duplicados si es necesario
