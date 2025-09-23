// ===========================================
// TIPOS PARA SISTEMA DE TIMER
// ===========================================

/**
 * Acciones de control del timer
 */
export type ControlAction = 
  | 'PLAY' 
  | 'PAUSE' 
  | 'RESET' 
  | 'NEXT' 
  | 'PREV' 
  | 'ADD30' 
  | 'SUB30'

/**
 * Configuración de colores para diferentes tiempos
 */
export interface TimerColor {
  timeInSeconds: number
  backgroundColor: string
}

/**
 * Etapa del timer con configuración de duración y colores
 */
export interface Stage {
  id?: string
  title: string
  description?: string
  duration: number // Duración en segundos
  order_index?: number
  colors?: TimerColor[]
  alertColor?: string
  alertSeconds?: number // Segundos antes del final para mostrar alerta
}

/**
 * Estado actual del timer
 */
export interface TimerState {
  directoryId: string
  stageId: string
  durationMs: number // Duración total en milisegundos
  startTimeMs: number | null // Timestamp de inicio (null si no está corriendo)
  adjustmentsMs: number // Ajustes acumulados (+/- tiempo)
  isRunning: boolean
}

/**
 * Mensaje de comunicación entre componentes del timer
 */
export interface TimerMessage {
  type: 'INIT' | 'CONTROL' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'PING' | 'PONG'
  payload?: any
  v: 'v1'
}

/**
 * Versión del protocolo de comunicación
 */
export const PROTOCOL_VERSION = 'v1' as const

// ===========================================
// TIPOS ADICIONALES PARA FUNCIONALIDADES AVANZADAS
// ===========================================

/**
 * Configuración de directorio con múltiples etapas
 */
export interface DirectoryConfig {
  id: string
  name: string
  stages: Stage[]
  totalDuration: number // Duración total en segundos
  createdAt: string
  updatedAt: string
}

/**
 * Historial de sesiones del timer
 */
export interface TimerSession {
  id: string
  directoryId: string
  stageId: string
  startTime: string
  endTime?: string
  duration: number // Duración real en segundos
  adjustments: number // Ajustes aplicados
  completed: boolean
}

/**
 * Estadísticas del timer
 */
export interface TimerStats {
  totalSessions: number
  totalTime: number // Tiempo total en segundos
  averageSessionDuration: number
  mostUsedStage: string
  completionRate: number // Porcentaje de sesiones completadas
}

/**
 * Configuración de notificaciones
 */
export interface TimerNotification {
  id: string
  stageId: string
  timeRemaining: number // Segundos restantes cuando se activa
  message: string
  type: 'warning' | 'alert' | 'info'
  enabled: boolean
}

/**
 * Estado de sincronización entre múltiples timers
 */
export interface SyncState {
  isMaster: boolean
  connectedClients: number
  lastSyncTime: string
  syncInterval: number // Intervalo de sincronización en ms
}

/**
 * Eventos del timer
 */
export type TimerEvent = 
  | { type: 'STARTED'; stageId: string; timestamp: number }
  | { type: 'PAUSED'; stageId: string; timestamp: number; elapsed: number }
  | { type: 'RESUMED'; stageId: string; timestamp: number }
  | { type: 'STOPPED'; stageId: string; timestamp: number; duration: number }
  | { type: 'STAGE_CHANGED'; fromStageId: string; toStageId: string; timestamp: number }
  | { type: 'TIME_ADJUSTED'; adjustment: number; newDuration: number; timestamp: number }
  | { type: 'ALERT'; stageId: string; timeRemaining: number; timestamp: number }
  | { type: 'COMPLETED'; stageId: string; totalDuration: number; timestamp: number }

/**
 * Configuración de persistencia del timer
 */
export interface TimerPersistence {
  autoSave: boolean
  saveInterval: number // Intervalo de guardado en ms
  maxHistoryEntries: number
  storageKey: string
}

/**
 * Configuración de sonidos del timer
 */
export interface TimerSounds {
  startSound?: string // URL del sonido de inicio
  pauseSound?: string // URL del sonido de pausa
  alertSound?: string // URL del sonido de alerta
  completeSound?: string // URL del sonido de finalización
  volume: number // Volumen entre 0 y 1
  enabled: boolean
}

/**
 * Configuración de visualización del timer
 */
export interface TimerDisplay {
  showMilliseconds: boolean
  showProgress: boolean
  showStageInfo: boolean
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  colorScheme: 'default' | 'custom'
}

/**
 * Estado completo del timer con todas las configuraciones
 */
export interface FullTimerState extends TimerState {
  config: DirectoryConfig
  currentStage: Stage
  nextStage?: Stage
  previousStage?: Stage
  display: TimerDisplay
  sounds: TimerSounds
  persistence: TimerPersistence
  notifications: TimerNotification[]
  sync: SyncState
  stats: TimerStats
}

/**
 * Callback para eventos del timer
 */
export type TimerEventHandler = (event: TimerEvent) => void

/**
 * Callback para cambios de estado
 */
export type TimerStateChangeHandler = (state: TimerState) => void

/**
 * Callback para mensajes de comunicación
 */
export type TimerMessageHandler = (message: TimerMessage) => void
