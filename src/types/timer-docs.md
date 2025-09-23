# Documentación de Tipos del Timer

## 📋 **Tipos Principales**

### **ControlAction**
```typescript
type ControlAction = 'PLAY' | 'PAUSE' | 'RESET' | 'NEXT' | 'PREV' | 'ADD30' | 'SUB30'
```
Acciones disponibles para controlar el timer.

### **Stage**
```typescript
interface Stage {
  id?: string
  title: string
  description?: string
  duration: number // Duración en segundos
  order_index?: number
  colors?: TimerColor[]
  alertColor?: string
  alertSeconds?: number
}
```
Configuración de una etapa del timer con duración, colores y alertas.

### **TimerState**
```typescript
interface TimerState {
  directoryId: string
  stageId: string
  durationMs: number
  startTimeMs: number | null
  adjustmentsMs: number
  isRunning: boolean
}
```
Estado actual del timer con información de duración y ajustes.

### **TimerMessage**
```typescript
interface TimerMessage {
  type: 'INIT' | 'CONTROL' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'PING' | 'PONG'
  payload?: any
  v: 'v1'
}
```
Mensajes de comunicación entre componentes del timer.

## 🎨 **Tipos de Configuración**

### **DirectoryConfig**
Configuración completa de un directorio con múltiples etapas.

### **TimerDisplay**
Configuración de visualización del timer (tema, tamaño, colores).

### **TimerSounds**
Configuración de sonidos para diferentes eventos.

### **TimerPersistence**
Configuración de guardado automático y persistencia.

## 📊 **Tipos de Estadísticas**

### **TimerStats**
Estadísticas de uso del timer (sesiones, tiempo total, etc.).

### **TimerSession**
Historial de sesiones del timer.

## 🔄 **Tipos de Sincronización**

### **SyncState**
Estado de sincronización entre múltiples timers.

### **TimerEvent**
Eventos que puede emitir el timer.

## 🎯 **Uso en Componentes**

```typescript
import { 
  ControlAction, 
  Stage, 
  TimerState, 
  TimerMessage,
  PROTOCOL_VERSION 
} from '../types/timer'

// Ejemplo de uso
const handleControl = (action: ControlAction) => {
  const message: TimerMessage = {
    type: 'CONTROL',
    payload: { action },
    v: PROTOCOL_VERSION
  }
  // Enviar mensaje...
}

const createStage = (): Stage => ({
  title: 'Presentación',
  duration: 300, // 5 minutos
  colors: [
    { timeInSeconds: 60, backgroundColor: '#green' },
    { timeInSeconds: 30, backgroundColor: '#yellow' },
    { timeInSeconds: 10, backgroundColor: '#red' }
  ],
  alertSeconds: 30
})
```

## 🔧 **Funcionalidades Avanzadas**

### **Colores Dinámicos**
```typescript
const stage: Stage = {
  title: 'Networking',
  duration: 600,
  colors: [
    { timeInSeconds: 300, backgroundColor: '#4CAF50' }, // Verde
    { timeInSeconds: 120, backgroundColor: '#FF9800' }, // Naranja
    { timeInSeconds: 30, backgroundColor: '#F44336' }   // Rojo
  ],
  alertColor: '#FF5722',
  alertSeconds: 60
}
```

### **Eventos del Timer**
```typescript
const handleTimerEvent = (event: TimerEvent) => {
  switch (event.type) {
    case 'STARTED':
      console.log(`Timer iniciado en etapa ${event.stageId}`)
      break
    case 'ALERT':
      console.log(`Alerta: ${event.timeRemaining}s restantes`)
      break
    case 'COMPLETED':
      console.log(`Etapa completada en ${event.totalDuration}s`)
      break
  }
}
```

### **Sincronización**
```typescript
const syncState: SyncState = {
  isMaster: true,
  connectedClients: 3,
  lastSyncTime: new Date().toISOString(),
  syncInterval: 1000
}
```

## 📝 **Notas Importantes**

- **PROTOCOL_VERSION**: Versión del protocolo de comunicación ('v1')
- **Duración**: Siempre en segundos para `Stage.duration`, milisegundos para `TimerState.durationMs`
- **Timestamps**: Usar `number` para timestamps en milisegundos
- **Colores**: Formato hexadecimal o nombres de color CSS
- **Eventos**: Tipos específicos para cada evento del timer

## 🚀 **Próximos Pasos**

1. **Implementar hooks de React** para el timer
2. **Crear componentes** de visualización
3. **Agregar persistencia** con localStorage
4. **Implementar sincronización** en tiempo real
5. **Agregar sonidos** y notificaciones
