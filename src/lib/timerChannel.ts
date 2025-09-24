/**
 * Cliente mejorado para sincronización del cronómetro
 * Evita conflictos entre múltiples ventanas usando un sistema de liderazgo
 */

export interface TimerState {
  elapsedMs: number
  running: boolean
  timestamp: number
}

export type TimerStateCallback = (state: TimerState) => void

class TimerChannel {
  private broadcastChannel: BroadcastChannel | null = null
  private stateCallbacks: Set<TimerStateCallback> = new Set()
  private currentState: TimerState = {
    elapsedMs: 0,
    running: false,
    timestamp: 0
  }
  private isConnected = false
  private intervalId: number | null = null
  private windowId: string
  private isLeader: boolean = false
  private lastSyncTime: number = 0

  constructor() {
    // Generar ID único para esta ventana
    this.windowId = `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.initializeConnection()
  }

  /**
   * Inicializa la conexión usando BroadcastChannel + localStorage
   */
  private initializeConnection() {
    try {
      this.broadcastChannel = new BroadcastChannel('timer')
      
      this.broadcastChannel.onmessage = (event) => {
        this.handleMessage(event.data)
      }
      
      // Leer estado inicial del localStorage
      this.readInitialState()
      this.isConnected = true
      console.log(`TimerChannel: Using BroadcastChannel (window: ${this.windowId})`)
      
      // Iniciar sistema de liderazgo
      this.startLeadershipSystem()
      
    } catch (error) {
      console.error('TimerChannel: Error initializing connection:', error)
      this.setupLocalOnly()
    }
  }

  /**
   * Configura modo local solamente
   */
  private setupLocalOnly() {
    this.isConnected = true
    this.readInitialState()
    this.isLeader = true
    console.log('TimerChannel: Using local-only mode')
    this.startUpdateLoop()
  }

  /**
   * Sistema de liderazgo para evitar conflictos entre ventanas
   */
  private startLeadershipSystem() {
    // Verificar si hay un líder activo
    this.checkForLeader()
    
    // Intentar convertirse en líder
    setTimeout(() => {
      this.attemptLeadership()
    }, 100)
    
    // Verificar liderazgo periódicamente
    setInterval(() => {
      this.checkLeadership()
    }, 2000)
  }

  /**
   * Verifica si hay un líder activo
   */
  private checkForLeader() {
    try {
      const leaderInfo = localStorage.getItem('timerLeader')
      if (leaderInfo) {
        const leader = JSON.parse(leaderInfo)
        const now = Date.now()
        
        // Si el líder no ha enviado heartbeat en 3 segundos, está inactivo
        if (now - leader.lastHeartbeat > 3000) {
          console.log('TimerChannel: Leader is inactive, attempting to take over')
          this.attemptLeadership()
        } else {
          console.log('TimerChannel: Following existing leader')
          this.isLeader = false
          this.startUpdateLoop()
        }
      } else {
        this.attemptLeadership()
      }
    } catch (error) {
      console.warn('TimerChannel: Error checking leader:', error)
      this.attemptLeadership()
    }
  }

  /**
   * Intenta convertirse en líder
   */
  private attemptLeadership() {
    try {
      const leaderInfo = {
        windowId: this.windowId,
        lastHeartbeat: Date.now()
      }
      localStorage.setItem('timerLeader', JSON.stringify(leaderInfo))
      this.isLeader = true
      console.log(`TimerChannel: Became leader (${this.windowId})`)
      this.startUpdateLoop()
      this.startHeartbeat()
    } catch (error) {
      console.warn('TimerChannel: Could not become leader:', error)
      this.isLeader = false
      this.startUpdateLoop()
    }
  }

  /**
   * Verifica el estado del liderazgo
   */
  private checkLeadership() {
    if (!this.isLeader) return
    
    try {
      const leaderInfo = localStorage.getItem('timerLeader')
      if (leaderInfo) {
        const leader = JSON.parse(leaderInfo)
        if (leader.windowId !== this.windowId) {
          // Otro líder tomó el control
          this.isLeader = false
          console.log('TimerChannel: Lost leadership to another window')
        }
      }
    } catch (error) {
      console.warn('TimerChannel: Error checking leadership:', error)
    }
  }

  /**
   * Inicia el heartbeat del líder
   */
  private startHeartbeat() {
    if (!this.isLeader) return
    
    setInterval(() => {
      if (this.isLeader) {
        try {
          const leaderInfo = {
            windowId: this.windowId,
            lastHeartbeat: Date.now()
          }
          localStorage.setItem('timerLeader', JSON.stringify(leaderInfo))
        } catch (error) {
          console.warn('TimerChannel: Error sending heartbeat:', error)
        }
      }
    }, 1000)
  }

  /**
   * Inicia el loop de actualización
   */
  private startUpdateLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    
    this.intervalId = window.setInterval(() => {
      this.updateState()
    }, 100)
  }

  /**
   * Actualiza el estado del cronómetro
   */
  private updateState() {
    const stored = this.getStoredState()
    const now = Date.now()
    
    let elapsedMs = stored.pausedAccum
    let running = stored.running
    
    if (stored.running && stored.t0 > 0) {
      elapsedMs += now - stored.t0
    }
    
    this.currentState = {
      elapsedMs: Math.floor(elapsedMs),
      running: running,
      timestamp: now
    }
    
    this.notifyStateCallbacks()
    
    // Solo el líder actualiza el estado compartido
    if (this.isLeader && now - this.lastSyncTime > 500) {
      this.broadcastState()
      this.lastSyncTime = now
    }
  }

  /**
   * Envía el estado actual por broadcast
   */
  private broadcastState() {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'STATE',
        payload: this.currentState,
        windowId: this.windowId
      })
    }
  }

  /**
   * Maneja mensajes del broadcast channel
   */
  private handleMessage(data: any) {
    // Ignorar mensajes de la misma ventana
    if (data.windowId === this.windowId) return
    
    switch (data.type) {
      case 'START':
        if (!this.isLeader) {
          this.handleStart()
        }
        break
      case 'PAUSE':
        if (!this.isLeader) {
          this.handlePause()
        }
        break
      case 'RESET':
        if (!this.isLeader) {
          this.handleReset()
        }
        break
      case 'STATE':
        if (data.payload && !this.isLeader) {
          this.currentState = data.payload
          this.notifyStateCallbacks()
        }
        break
    }
  }

  /**
   * Maneja inicio del cronómetro
   */
  private handleStart() {
    console.log('TimerChannel: Starting timer')
    const now = Date.now()
    const state = this.getStoredState()
    
    if (!state.running) {
      state.running = true
      state.t0 = now
      this.saveState(state)
      this.broadcastMessage('START')
      console.log('TimerChannel: Timer started successfully')
    }
  }

  /**
   * Maneja pausa del cronómetro
   */
  private handlePause() {
    console.log('TimerChannel: Pausing timer')
    const now = Date.now()
    const state = this.getStoredState()
    
    if (state.running) {
      state.pausedAccum += now - state.t0
      state.running = false
      this.saveState(state)
      this.broadcastMessage('PAUSE')
      console.log('TimerChannel: Timer paused successfully')
    }
  }

  /**
   * Maneja reset del cronómetro
   */
  private handleReset() {
    console.log('TimerChannel: Resetting timer')
    const state = {
      running: false,
      t0: 0,
      pausedAccum: 0
    }
    
    this.saveState(state)
    this.broadcastMessage('RESET')
    console.log('TimerChannel: Timer reset successfully')
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
   * Guarda estado en localStorage
   */
  private saveState(state: any) {
    try {
      localStorage.setItem('timerState', JSON.stringify(state))
    } catch (error) {
      console.warn('TimerChannel: Error saving to localStorage', error)
    }
  }

  /**
   * Envía mensaje por broadcast channel
   */
  private broadcastMessage(type: string) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ 
        type,
        windowId: this.windowId
      })
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
    console.log('TimerChannel: start() called')
    this.handleStart()
  }

  /**
   * Pausa el cronómetro
   */
  pause(): void {
    console.log('TimerChannel: pause() called')
    this.handlePause()
  }

  /**
   * Reinicia el cronómetro
   */
  reset(): void {
    console.log('TimerChannel: reset() called')
    this.handleReset()
  }

  /**
   * Lee el estado inicial (para hidratación)
   */
  readInitialState(): void {
    this.updateState()
  }

  /**
   * Desconecta del canal
   */
  disconnect(): void {
    this.stateCallbacks.clear()
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.broadcastChannel?.close()
    this.isConnected = false
  }
}

// Instancia singleton
export const timerChannel = new TimerChannel()

// Auto-conectar al importar
timerChannel.connect()