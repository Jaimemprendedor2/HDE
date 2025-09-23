# Servicios TypeScript - Housenovo Directorios Empresariales

## 📋 **Servicios Disponibles**

### 🔧 **Configuración Base**
- **`supabase.ts`** - Cliente centralizado de Supabase
- **`types.ts`** - Tipos TypeScript para todos los servicios
- **`index.ts`** - Exportaciones centralizadas

### 👥 **Servicios de Participantes**
- **`participants.ts`** - Gestión completa de participantes

#### **Funciones Principales:**
```typescript
// Listar participantes con filtros
const { data, error } = await listParticipants({
  search: 'Juan',
  company: 'TechStart',
  role: 'CEO'
})

// Crear participante
const { data, error } = await createParticipant({
  full_name: 'Juan Pérez',
  email: 'juan@email.com',
  venture_name: 'TechStart',
  venture_code: 'TS001'
})

// Importar múltiples participantes
const { data, error } = await bulkImportParticipants([
  { full_name: 'María', email: 'maria@email.com' },
  { full_name: 'Carlos', email: 'carlos@email.com' }
])
```

### 🤝 **Servicios de Meeting Participants**
- **`meetingParticipants.ts`** - Gestión de participantes en reuniones

#### **Funciones Principales:**
```typescript
// Listar participantes de una reunión
const { data, error } = await listByMeeting('meeting-id')

// Agregar participante a reunión
const { data, error } = await addParticipantToMeeting(
  'meeting-id',
  'participant-id',
  { invited: true, active: true }
)

// Remover participante
const { data, error } = await removeParticipantFromMeeting('id')
```

### 🎯 **Servicios de Sesiones**
- **`sessions.ts`** - Gestión de sesiones de reuniones

#### **Funciones Principales:**
```typescript
// Iniciar sesión activa
const { data, error } = await startActiveSession(
  'meeting-id',
  'directorio',
  'ACT001',
  { title: 'Sesión de Networking', location: 'Sala A' }
)

// Obtener sesión activa
const { data, error } = await getActiveSession('meeting-id')

// Finalizar sesión
const { data, error } = await endActiveSession('meeting-id')
```

### ✅ **Servicios de Asistencia**
- **`attendance.ts`** - Gestión de asistencia a sesiones

#### **Funciones Principales:**
```typescript
// Establecer estado de asistencia
const { data, error } = await setAttendanceStatus(
  'session-id',
  'participant-id',
  'present',
  'Llegó puntual'
)

// Obtener estadísticas de asistencia
const { data, error } = await getSessionAttendanceStats('session-id')
// Retorna: { total_participants, present_count, late_count, absent_count, excused_count }

// Check-in/Check-out
const { data, error } = await checkInParticipant('session-id', 'participant-id')
```

### 📝 **Servicios de Notas**
- **`notes.ts`** - Gestión de notas de sesiones

#### **Funciones Principales:**
```typescript
// Crear/actualizar nota
const { data, error } = await upsertNote('session-id', {
  title: 'Resumen de la sesión',
  summary: 'Se discutieron temas importantes',
  decisions: 'Decisión 1, Decisión 2',
  followups: 'Seguimiento 1, Seguimiento 2',
  created_by: 'user-id'
})

// Listar notas de sesión
const { data, error } = await listBySession('session-id')
```

### ⭐ **Servicios de Evaluaciones**
- **`evaluations.ts`** - Gestión de evaluaciones de sesiones

#### **Funciones Principales:**
```typescript
// Crear evaluación
const { data, error } = await createEvaluation(
  'session-id',
  'coach',
  { score_overall: 4, score_listening: 5, score_feedback: 4 },
  'Excelente participación',
  'participant-id'
)

// Obtener estadísticas de evaluaciones
const { data, error } = await getSessionEvaluationStats('session-id')
// Retorna: { total_evaluations, average_scores, by_evaluator, score_distribution }
```

## 🎯 **Patrón de Respuesta**

Todos los servicios siguen el patrón:
```typescript
interface ServiceResponse<T> {
  data: T | null
  error: string | null
}
```

## 🔧 **Uso en Componentes**

```typescript
import { 
  listParticipants, 
  createParticipant,
  startActiveSession,
  setAttendanceStatus 
} from '../services'

// En un componente React
const MyComponent = () => {
  const [participants, setParticipants] = useState([])
  
  useEffect(() => {
    const loadParticipants = async () => {
      const { data, error } = await listParticipants()
      if (error) {
        console.error('Error:', error)
      } else {
        setParticipants(data || [])
      }
    }
    
    loadParticipants()
  }, [])
  
  // ... resto del componente
}
```

## 📊 **Estadísticas Disponibles**

### **Participantes:**
- Total de participantes
- Distribución por empresa
- Distribución por rol

### **Asistencia:**
- Conteo por estado (presente, tarde, ausente, excusado)
- Historial por participante
- Estadísticas por sesión

### **Evaluaciones:**
- Promedios por sesión
- Distribución de scores
- Tendencia por participante
- Evaluaciones por rol

## 🚀 **Próximos Pasos**

1. **Integrar con componentes React**
2. **Agregar manejo de errores global**
3. **Implementar caché con React Query**
4. **Agregar validaciones de datos**
5. **Crear hooks personalizados**

## ⚠️ **Notas Importantes**

- **Todos los servicios son asíncronos**
- **Manejo de errores consistente**
- **Tipos TypeScript completos**
- **Validación de datos en Supabase**
- **RLS habilitado en todas las tablas**
