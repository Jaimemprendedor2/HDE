# Configuración de la Nueva UI - Housenovo Directorios Empresariales

## 🎯 Resumen de Cambios

Se ha rediseñado completamente la UI de la plataforma con las siguientes mejoras:

### ✅ Nuevas Funcionalidades Implementadas

1. **Pantalla de Selección de Actividad** (`/`)
   - Selector de tipo: Pre-directorio, Directorio, o Jornada de Coaching
   - Lista de actividades existentes por tipo
   - Formulario de creación de nueva actividad

2. **Gestión de Actividades** (`/activity/:meetingId`)
   - Cronómetro principal con timer sin drift
   - Configuración de etapas con drag & drop
   - Tabs organizadas: Etapas, Asistencia, Notas, Evaluaciones
   - Sincronización entre pestañas con BroadcastChannel

3. **Sistema de Timer Mejorado**
   - Basado en timestamps y requestAnimationFrame
   - Sin drift temporal
   - Sincronización entre ventanas
   - Controles de navegación entre etapas

4. **Configuración de Etapas**
   - Editor visual con reordenamiento drag & drop
   - Configuración de colores y duraciones
   - Etapas por defecto según tipo de actividad

## 🗄️ Cambios en Base de Datos

### Nuevas Migraciones Aplicar

Ejecuta la siguiente migración en tu base de datos Supabase:

```sql
-- Ejecutar: database/migrations/2025-09-23-update-stages-schema.sql
```

### Tablas Actualizadas

- `meeting_stages`: Nuevas columnas `description`, `duration`, `color_hex`, `alert_color_hex`
- `meeting_sessions`: Columnas `session_type` y `activity_code` (ya existentes)

### Funciones Nuevas

- `reorder_meeting_stages()`: Para reordenamiento drag & drop
- `get_meeting_stages_ordered()`: Para obtener etapas ordenadas
- `create_default_stages()`: Para crear etapas por defecto

## 🚀 Configuración de Desarrollo

### 1. Aplicar Migraciones

```bash
# En el dashboard de Supabase, ejecuta:
database/migrations/2025-09-23-update-stages-schema.sql
```

### 2. Verificar Configuración

Asegúrate de que las siguientes variables de entorno estén configuradas:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 3. Instalación y Ejecución

```bash
npm install
npm run dev
```

## 🎛️ Flujo de Uso

### 1. Selección de Actividad
1. Al entrar al sistema, se muestra la pantalla de selección
2. Elige: Pre-directorio, Directorio, o Jornada de Coaching
3. Selecciona una actividad existente o crea una nueva

### 2. Creación de Nueva Actividad
1. Completa el formulario con nombre, descripción, fecha y código
2. El sistema crea automáticamente etapas por defecto según el tipo
3. Redirige a la pantalla de gestión

### 3. Gestión de la Actividad
1. **Etapas**: Configura y reordena las etapas de tu actividad
2. **Timer**: Inicia la sesión para activar el cronómetro
3. **Asistencia**: Gestiona participantes y marcar asistencia
4. **Notas**: Toma notas de la sesión con formato estructurado
5. **Evaluaciones**: Registra evaluaciones con rubros 1-5

### 4. Timer y Sincronización
- El timer principal se sincroniza entre pestañas
- Usa `requestAnimationFrame` para evitar drift
- Controles de teclado disponibles (Space, flechas, +/-, R)
- Ventana popup opcional para proyección

## 🎨 Características Técnicas

### Sistema de Timer
- **Sin Drift**: Usa timestamps y requestAnimationFrame
- **Sincronización**: BroadcastChannel API entre ventanas
- **Controles**: Teclado y UI unificados
- **Etapas**: Navegación automática y manual

### UI Responsive
- **Layout Dividido**: Timer arriba, tabs abajo
- **Tailwind CSS**: Componentes modulares y responsive
- **Drag & Drop**: Reordenamiento intuitivo de etapas
- **Colores Dinámicos**: Personalización por etapa

### Persistencia
- **Supabase**: Almacenamiento completo en la nube
- **RLS**: Políticas de seguridad por filas
- **Tiempo Real**: Actualizaciones automáticas

## 🔧 Archivos Principales Creados/Modificados

### Páginas Nuevas
- `src/pages/ActivitySelector.tsx` - Selección inicial
- `src/pages/ActivityManager.tsx` - Gestión principal

### Componentes Nuevos
- `src/components/StageManager.tsx` - Configuración de etapas
- `src/components/Timer.tsx` - Timer mejorado

### Base de Datos
- `database/migrations/2025-09-23-update-stages-schema.sql`

### Configuración
- `src/App.tsx` - Rutas actualizadas
- `src/app/routes.tsx` - Nuevas rutas
- `src/stores/timer.ts` - Store mejorado

## 🎯 Próximos Pasos

1. Aplicar la migración de base de datos
2. Probar el flujo completo de creación de actividad
3. Configurar etapas personalizadas
4. Verificar sincronización del timer
5. Personalizar colores y duraciones según necesidad

## 🔍 Depuración

Si encuentras problemas:

1. **Verifica la migración**: Asegúrate de que las nuevas columnas existan
2. **Revisa la consola**: Errores de Supabase o JavaScript
3. **Confirma las rutas**: Las nuevas rutas deben estar activas
4. **Testa el timer**: El sistema de sincronización debe funcionar

La nueva UI mantiene compatibilidad con el sistema existente mientras agrega las funcionalidades solicitadas de manera organizada y eficiente.
