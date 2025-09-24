import { PROTOCOL_VERSION, TimerMessage } from '../types/timer'

/**
 * Configuración del canal de sincronización
 */
interface SyncChannelConfig {
  channelName: string
  heartbeatInterval: number // ms
  heartbeatTimeout: number // ms
  maxReconnectAttempts: number
  reconnectDelay: number // ms
}

/**
 * Estado de conexión del canal
 */
interface ConnectionState {
  isConnected: boolean
  lastHeartbeat: number
  reconnectAttempts: number
  isReconnecting: boolean
}

/**
 * Callback para mensajes recibidos
 */
type MessageCallback = (message: TimerMessage) => void

/**
 * Callback para cambios de estado de conexión
 */
type ConnectionCallback = (isConnected: boolean) => void

/**
 * Servicio de sincronización de canales
 * Usa BroadcastChannel como primario con fallbacks a postMessage y localStorage
 */
class SyncChannel {
  private config: SyncChannelConfig
  private broadcastChannel: BroadcastChannel | null = null
  private childWindow: Window | null = null
  private messageCallbacks: Set<MessageCallback> = new Set()
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private connectionState: ConnectionState
  private heartbeatIntervalId: NodeJS.Timeout | null = null
  private heartbeatTimeoutId: NodeJS.Timeout | null = null
  private reconnectTimeoutId: NodeJS.Timeout | null = null
  private currentDirectoryId: string | null = null

  constructor(config: Partial<SyncChannelConfig> = {}) {
    this.config = {
      channelName: 'housenovo-directorios',
      heartbeatInterval: 5000, // 5 segundos
      heartbeatTimeout: 10000, // 10 segundos
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      ...config
    }

    this.connectionState = {
      isConnected: false,
      lastHeartbeat: 0,
      reconnectAttempts: 0,
      isReconnecting: false
    }

    this.initializeChannel()
  }

  /**
   * Inicializa el canal principal (BroadcastChannel)
   */
  private initializeChannel(): void {
    try {
      // Verificar soporte de BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel(this.config.channelName)
        
        this.broadcastChannel.addEventListener('message', (event) => {
          this.handleMessage(event.data)
        })

        this.broadcastChannel.addEventListener('close', () => {
          this.handleDisconnection()
        })

        this.updateConnectionState(true)
        this.startHeartbeat()
        
        console.log('SyncChannel: BroadcastChannel inicializado')
      } else {
        console.warn('SyncChannel: BroadcastChannel no soportado, usando fallbacks')
        this.fallbackToPostMessage()
      }
    } catch (error) {
      console.error('SyncChannel: Error inicializando BroadcastChannel:', error)
      this.fallbackToPostMessage()
    }
  }

  /**
   * Configura una ventana hija para comunicación postMessage
   */
  setChildWindow(window: Window | null): void {
    this.childWindow = window
    
    if (window) {
      // Escuchar mensajes de la ventana hija
      window.addEventListener('message', (event) => {
        // Verificar origen por seguridad
        if (event.source === window) {
          this.handleMessage(event.data)
        }
      })
      
      console.log('SyncChannel: Ventana hija configurada')
    }
  }

  /**
   * Publica un mensaje a través del canal disponible
   */
  publish(message: TimerMessage): void {
    if (!this.validateMessage(message)) {
      console.warn('SyncChannel: Mensaje inválido descartado:', message)
      return
    }

    // Filtrar por directoryId si está configurado
    if (this.currentDirectoryId && this.shouldFilterByDirectoryId(message)) {
      return
    }

    try {
      // Intentar BroadcastChannel primero
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(message)
        return
      }

      // Fallback a postMessage
      if (this.childWindow) {
        this.childWindow.postMessage(message, '*')
        return
      }

      // Último recurso: localStorage
      this.publishToLocalStorage(message)
      
    } catch (error) {
      console.error('SyncChannel: Error publicando mensaje:', error)
      // Intentar fallback
      this.publishToLocalStorage(message)
    }
  }

  /**
   * Suscribe un callback para recibir mensajes
   */
  subscribe(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback)
    
    // Retornar función de unsubscribe
    return () => {
      this.messageCallbacks.delete(callback)
    }
  }

  /**
   * Suscribe un callback para cambios de estado de conexión
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    
    return () => {
      this.connectionCallbacks.delete(callback)
    }
  }

  /**
   * Configura el directoryId para filtrar mensajes
   */
  setDirectoryId(directoryId: string | null): void {
    this.currentDirectoryId = directoryId
  }

  /**
   * Cierra el canal y limpia recursos
   */
  close(): void {
    this.stopHeartbeat()
    this.clearReconnectTimeout()
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }

    this.childWindow = null
    this.updateConnectionState(false)
    
    console.log('SyncChannel: Canal cerrado')
  }

  /**
   * Maneja mensajes recibidos
   */
  private handleMessage(data: any): void {
    try {
      // Validar que sea un mensaje válido
      if (!this.validateMessage(data)) {
        return
      }

      // Filtrar por directoryId si aplica
      if (this.shouldFilterByDirectoryId(data)) {
        return
      }

      // Procesar mensajes especiales
      if (data.type === 'PING') {
        this.handlePing()
        return
      }

      if (data.type === 'PONG') {
        this.handlePong()
        return
      }

      if (data.type === 'SYNC_REQUEST') {
        this.handleSyncRequest(data)
        return
      }

      // Notificar a todos los callbacks
      this.messageCallbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('SyncChannel: Error en callback:', error)
        }
      })

    } catch (error) {
      console.error('SyncChannel: Error procesando mensaje:', error)
    }
  }

  /**
   * Valida que un mensaje tenga el formato correcto
   */
  private validateMessage(message: any): message is TimerMessage {
    return (
      message &&
      typeof message === 'object' &&
      message.v === PROTOCOL_VERSION &&
      typeof message.type === 'string' &&
      ['INIT', 'CONTROL', 'SYNC_REQUEST', 'SYNC_RESPONSE', 'PING', 'PONG'].includes(message.type)
    )
  }

  /**
   * Determina si un mensaje debe ser filtrado por directoryId
   */
  private shouldFilterByDirectoryId(message: TimerMessage): boolean {
    if (!this.currentDirectoryId) {
      return false
    }

    // Solo filtrar mensajes que tengan payload con directoryId
    if (message.payload && message.payload.directoryId) {
      return message.payload.directoryId !== this.currentDirectoryId
    }

    return false
  }

  /**
   * Inicia el heartbeat (PING/PONG)
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatIntervalId = setInterval(() => {
      this.sendPing()
    }, this.config.heartbeatInterval)
  }

  /**
   * Detiene el heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId)
      this.heartbeatIntervalId = null
    }
    
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId)
      this.heartbeatTimeoutId = null
    }
  }

  /**
   * Envía un PING
   */
  private sendPing(): void {
    const pingMessage: TimerMessage = {
      type: 'PING',
      payload: { timestamp: performance.now() },
      v: PROTOCOL_VERSION
    }

    this.publish(pingMessage)
    
    // Configurar timeout para PONG
    this.heartbeatTimeoutId = setTimeout(() => {
      this.handleHeartbeatTimeout()
    }, this.config.heartbeatTimeout)
  }

  /**
   * Maneja un PING recibido
   */
  private handlePing(): void {
    const pongMessage: TimerMessage = {
      type: 'PONG',
      payload: { timestamp: performance.now() },
      v: PROTOCOL_VERSION
    }

    this.publish(pongMessage)
  }

  /**
   * Maneja un PONG recibido
   */
  private handlePong(): void {
    this.connectionState.lastHeartbeat = performance.now()
    
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId)
      this.heartbeatTimeoutId = null
    }
  }

  /**
   * Maneja timeout del heartbeat
   */
  private handleHeartbeatTimeout(): void {
    console.warn('SyncChannel: Heartbeat timeout, intentando reconexión')
    this.handleDisconnection()
  }

  /**
   * Maneja desconexión y reconexión
   */
  private handleDisconnection(): void {
    this.updateConnectionState(false)
    this.stopHeartbeat()
    
    if (this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else {
      console.error('SyncChannel: Máximo de intentos de reconexión alcanzado')
      this.fallbackToPostMessage()
    }
  }

  /**
   * Programa una reconexión
   */
  private scheduleReconnect(): void {
    if (this.connectionState.isReconnecting) {
      return
    }

    this.connectionState.isReconnecting = true
    this.connectionState.reconnectAttempts++

    this.reconnectTimeoutId = setTimeout(() => {
      this.attemptReconnect()
    }, this.config.reconnectDelay)
  }

  /**
   * Intenta reconectar
   */
  private attemptReconnect(): void {
    this.connectionState.isReconnecting = false
    
    try {
      this.initializeChannel()
      this.connectionState.reconnectAttempts = 0
    } catch (error) {
      console.error('SyncChannel: Error en reconexión:', error)
      this.handleDisconnection()
    }
  }

  /**
   * Maneja una solicitud de sincronización
   */
  private handleSyncRequest(request: TimerMessage): void {
    // Este método debe ser implementado por el cliente
    // para responder con SYNC_RESPONSE
    console.log('SyncChannel: SYNC_REQUEST recibido:', request)
  }

  /**
   * Fallback a postMessage cuando BroadcastChannel no está disponible
   */
  private fallbackToPostMessage(): void {
    console.log('SyncChannel: Usando fallback postMessage')
    
    // Escuchar mensajes del parent window
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.addEventListener('message', (event) => {
        this.handleMessage(event.data)
      })
    }
    
    this.updateConnectionState(true)
    this.startHeartbeat()
  }

  /**
   * Último recurso: usar localStorage para sincronización
   */
  private publishToLocalStorage(message: TimerMessage): void {
    try {
      const key = `sync_${this.config.channelName}_${Date.now()}`
      localStorage.setItem(key, JSON.stringify(message))
      
      // Limpiar mensajes antiguos (más de 1 minuto)
      this.cleanupOldLocalStorageMessages()
      
    } catch (error) {
      console.error('SyncChannel: Error publicando a localStorage:', error)
    }
  }

  /**
   * Limpia mensajes antiguos del localStorage
   */
  private cleanupOldLocalStorageMessages(): void {
    try {
      const oneMinuteAgo = Date.now() - 60000
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`sync_${this.config.channelName}_`)) {
          const timestamp = parseInt(key.split('_').pop() || '0')
          if (timestamp < oneMinuteAgo) {
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('SyncChannel: Error limpiando localStorage:', error)
    }
  }

  /**
   * Actualiza el estado de conexión
   */
  private updateConnectionState(isConnected: boolean): void {
    this.connectionState.isConnected = isConnected
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(isConnected)
      } catch (error) {
        console.error('SyncChannel: Error en callback de conexión:', error)
      }
    })
  }

  /**
   * Limpia el timeout de reconexión
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }
  }

  /**
   * Obtiene el estado actual de conexión
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  /**
   * Envía una solicitud de sincronización
   */
  requestSync(directoryId?: string): void {
    const syncRequest: TimerMessage = {
      type: 'SYNC_REQUEST',
      payload: { 
        directoryId,
        timestamp: performance.now(),
        requestId: Math.random().toString(36).substr(2, 9)
      },
      v: PROTOCOL_VERSION
    }

    this.publish(syncRequest)
  }
}

// Instancia singleton del canal de sincronización
export const syncChannel = new SyncChannel()

// Exportar la clase para casos especiales
export { SyncChannel }

// Helpers para usar con el timer store
export const createTimerSyncChannel = (directoryId: string) => {
  const channel = new SyncChannel()
  channel.setDirectoryId(directoryId)
  return channel
}

// Helper para sincronizar con TimerCore (reemplaza syncWithTimerStore)
export const syncWithTimerCore = (channel: SyncChannel) => {
  // Suscribirse a mensajes de sincronización
  const unsubscribe = channel.subscribe((message: TimerMessage) => {
    if (message.type === 'SYNC_RESPONSE' && message.payload) {
      // Aplicar estado sincronizado al TimerCore
      const { timerCore } = require('../lib/timerCore')
      if (message.payload.durationMs !== undefined) {
        timerCore.updateRemainingSeconds(Math.floor(message.payload.durationMs / 1000))
      }
      if (message.payload.adjustmentsMs !== undefined) {
        timerCore.updateAdjustments(Math.floor(message.payload.adjustmentsMs / 1000))
      }
      if (message.payload.isRunning !== undefined) {
        if (message.payload.isRunning) {
          timerCore.start()
        } else {
          timerCore.pause()
        }
      }
    }
  })

  return unsubscribe
}
