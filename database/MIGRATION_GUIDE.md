# Guía de Migración - Housenovo Directorios Empresariales

## 🚨 **PROBLEMA IDENTIFICADO**
El error **"relation 'meetings' does not exist"** ocurre porque la migración original hace referencia a tablas que no existen.

## 🔧 **SOLUCIÓN: Migraciones en Orden**

### **Paso 1: Ejecutar Migración Base (OPCIONAL)**
Si quieres crear las tablas base completas:
```sql
-- Ejecutar: 2025-09-22-01-base-tables.sql
-- Esto crea: meetings, meeting_stages, meeting_sessions, stage_progress
```

### **Paso 2: Ejecutar Migración Core (RECOMENDADO)**
```sql
-- Ejecutar: 2025-09-22-02-schema-core-fixed.sql
-- Esto crea: participants, meeting_participants, session_attendance, session_notes, session_evaluations
-- SIN dependencias de tablas externas
```

### **Paso 3: Agregar Foreign Keys (OPCIONAL)**
```sql
-- Ejecutar: 2025-09-22-03-add-foreign-keys.sql
-- Esto agrega las foreign keys si las tablas base existen
```

## 🎯 **RECOMENDACIÓN: Ejecutar Solo la Migración Core**

### **1. Copiar y Ejecutar**
1. Abre `database/migrations/2025-09-22-02-schema-core-fixed.sql`
2. Copia todo el contenido
3. Pégalo en Supabase SQL Editor
4. Ejecuta la consulta

### **2. Verificar Creación**
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

### **3. Verificar Datos de Prueba**
```sql
-- Verificar que se insertaron los participantes de prueba
SELECT * FROM participants;
```

## 🔍 **Verificación Completa**

### **Verificar RLS**
```sql
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

### **Verificar Índices**
```sql
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

### **Verificar Políticas RLS**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN (
    'participants', 
    'meeting_participants', 
    'session_attendance', 
    'session_notes', 
    'session_evaluations'
);
```

## 🚀 **Próximos Pasos**

1. **Ejecutar la migración core** (2025-09-22-02-schema-core-fixed.sql)
2. **Verificar que no hay errores**
3. **Probar las funciones de utilidad**
4. **Configurar usuarios y roles** (opcional)
5. **Agregar foreign keys** (si es necesario)

## ⚠️ **Notas Importantes**

- **La migración core NO depende de tablas externas**
- **Las foreign keys se pueden agregar después**
- **Los datos de prueba se insertan automáticamente**
- **RLS está configurado con políticas básicas**

## 🎉 **Resultado Esperado**

Después de ejecutar la migración core, tendrás:
- ✅ 5 tablas principales creadas
- ✅ RLS habilitado en todas las tablas
- ✅ Índices optimizados
- ✅ Funciones de utilidad
- ✅ Datos de prueba insertados
- ✅ Sin errores de dependencias
