/**
 * Cliente que abstrae la comunicación con SharedWorker del cronómetro
 * Incluye fallback a BroadcastChannel + localStorage si SharedWorker no está disponible
 */

export interface TimerState {
  elapsedMs: number
  running: boolean
  timestamp: number
}

export type TimerStateCallback = (state: TimerState) => void

class TimerChannel {
  private worker: SharedWorker | null = null
  private port: MessagePort | null = null
  private broadcastChannel: BroadcastChannel | null = null
  private stateCallbacks: Set<TimerStateCallback> = new Set()
  private currentState: TimerState = {
    elapsedMs: 0,
    running: false,
    timestamp: 0
  }
  private isConnected = false
  private useFallback = false

  constructor() {
    this.initializeConnection()
  }

  /**
   * Inicializa la conexión (SharedWorker o fallback)
   */
  private initializeConnection() {
    try {
      // Intentar usar SharedWorker
      this.worker = new SharedWorker('/shared-timer.js', 'timer-worker')
      this.port = this.worker.port
      this.port.start()
      
      this.port.onmessage = (event) => {
        this.handleWorkerMessage(event.data)
      }
      
      this.isConnected = true
      console.log('TimerChannel: Using SharedWorker')
    } catch (error) {
      console.warn('TimerChannel: SharedWorker not supported, using fallback', error)
      this.setupFallback()
    }
  }

  /**
   * Configura fallback con BroadcastChannel + localStorage
   */
  private setupFallback() {
    this.useFallback = true
    this.broadcastChannel = new BroadcastChannel('timer')
    
    this.broadcastChannel.onmessage = (event) => {
      this.handleWorkerMessage(event.data)
    }
    
    // Leer estado inicial del localStorage
    this.readInitialState()
    this.isConnected = true
    console.log('TimerChannel: Using BroadcastChannel fallback')
  }

  /**
   * Maneja mensajes del worker o broadcast channel
   */
  private handleWorkerMessage(data: any) {
    switch (data.type) {
      case 'INIT_RESPONSE':
      case 'GET_RESPONSE':
      case 'STATE':
        this.currentState = data.payload
        this.notifyStateCallbacks()
        break
    }
  }

  /**
   * Notifica a todos los callbacks registrados
   */
  private notifyStateCallbacks() {
    this.stateCallbacks.forEach(callback => {
      try {
        callback(this.currentState)
      } catch (error) {
        console.warn('TimerChannel: Error in state callback', error)
      }
    })
  }

  /**
   * Envía mensaje al worker o broadcast channel
   */
  private sendMessage(type: string, payload?: any) {
    if (this.useFallback) {
      // Usar BroadcastChannel + localStorage
      this.broadcastChannel?.postMessage({ type, payload })
      this.updateLocalStorage(type)
    } else {
      // Usar SharedWorker
      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        this.handleWorkerMessage(event.data)
      }
      
      this.port?.postMessage({ type, payload }, [messageChannel.port2])
    }
  }

  /**
   * Actualiza localStorage para fallback
   */
  private updateLocalStorage(action: string) {
    const now = Date.now()
    const state = this.getStoredState()
    
    switch (action) {
      case 'START':
        if (!state.running) {
          state.running = true
          state.t0 = now
        }
        break
      case 'PAUSE':
        if (state.running) {
          state.pausedAccum += now - state.t0
          state.running = false
        }
        break
      case 'RESET':
        state.running = false
        state.t0 = 0
        state.pausedAccum = 0
        break
    }
    
    localStorage.setItem('timerState', JSON.stringify(state))
  }

  /**
   * Obtiene estado almacenado en localStorage
   */
  private getStoredState() {
    try {
      const stored = localStorage.getItem('timerState')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn('TimerChannel: Error reading localStorage', error)
    }
    
    return {
      running: false,
      t0: 0,
      pausedAccum: 0
    }
  }

  /**
   * Conecta al canal del cronómetro
   */
  connect(): void {
    if (!this.isConnected) {
      this.initializeConnection()
    }
  }

  /**
   * Registra callback para cambios de estado
   */
  onState(callback: TimerStateCallback): () => void {
    this.stateCallbacks.add(callback)
    
    // Enviar estado actual inmediatamente
    callback(this.currentState)
    
    // Retornar función para desregistrar
    return () => {
      this.stateCallbacks.delete(callback)
    }
  }

  /**
   * Obtiene el tick actual del cronómetro
   */
  getTick(): TimerState {
    return { ...this.currentState }
  }

  /**
   * Inicia el cronómetro
   */
  start(): void {
    this.sendMessage('START')
  }

  /**
   * Pausa el cronómetro
   */
  pause(): void {
    this.sendMessage('PAUSE')
  }

  /**
   * Reinicia el cronómetro
   */
  reset(): void {
    this.sendMessage('RESET')
  }

  /**
   * Lee el estado inicial (para hidratación)
   */
  readInitialState(): void {
    if (this.useFallback) {
      const stored = this.getStoredState()
      const now = Date.now()
      
      let elapsedMs = stored.pausedAccum
      if (stored.running && stored.t0 > 0) {
        elapsedMs += now - stored.t0
      }
      
      this.currentState = {
        elapsedMs: Math.floor(elapsedMs),
        running: stored.running,
        timestamp: now
      }
      
      this.notifyStateCallbacks()
    } else {
      this.sendMessage('GET')
    }
  }

  /**
   * Desconecta del canal
   */
  disconnect(): void {
    this.stateCallbacks.clear()
    this.port?.close()
    this.broadcastChannel?.close()
    this.isConnected = false
  }
}

// Instancia singleton
export const timerChannel = new TimerChannel()

// Auto-conectar al importar
timerChannel.connect()
