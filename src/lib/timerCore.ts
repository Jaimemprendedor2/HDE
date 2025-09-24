/**
 * Timer Core - Sistema centralizado simplificado
 * Una sola fuente de verdad para el cronómetro
 */

export interface TimerCoreState {
  running: boolean
  remainingSeconds: number
  currentStageIndex: number
  adjustments: number
}

export type TimerCoreCallback = (state: TimerCoreState) => void

class TimerCore {
  private state: TimerCoreState = {
    running: false,
    remainingSeconds: 0,
    currentStageIndex: 0,
    adjustments: 0
  }
  
  private callbacks: Set<TimerCoreCallback> = new Set()
  private intervalId: number | null = null
  private isInitialized = false
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    this.initialize()
    this.initializeBroadcastChannel()
  }

  /**
   * Inicializa el Timer Core
   */
  private initialize() {
    this.loadStateFromStorage()
    this.startUpdateLoop()
    this.isInitialized = true
    console.log('TimerCore: Initialized with simplified logic')
  }

  /**
   * Inicializa BroadcastChannel para sincronización entre ventanas
   */
  private initializeBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('timer-core-sync')
      console.log('TimerCore: BroadcastChannel inicializado para sincronización')
    } catch (error) {
      console.warn('TimerCore: BroadcastChannel no disponible:', error)
    }
  }

  /**
   * Carga estado desde localStorage
   */
  private loadStateFromStorage() {
    try {
      const stored = localStorage.getItem('timerCoreState')
      if (stored) {
        const parsed = JSON.parse(stored)
        this.state = { ...this.state, ...parsed }
        console.log('TimerCore: State loaded from storage', this.state)
      }
    } catch (error) {
      console.warn('TimerCore: Error loading state from storage', error)
    }
  }

  /**
   * Guarda estado en localStorage
   */
  private saveStateToStorage() {
    try {
      localStorage.setItem('timerCoreState', JSON.stringify(this.state))
    } catch (error) {
      console.warn('TimerCore: Error saving state to storage', error)
    }
  }

  /**
   * Inicia el loop de actualización (cada segundo)
   */
  private startUpdateLoop() {
    this.intervalId = window.setInterval(() => {
      if (this.state.running && this.state.remainingSeconds > 0) {
        this.state.remainingSeconds = Math.max(0, this.state.remainingSeconds - 1)
        this.saveStateToStorage()
        this.notifyCallbacks()
        console.log(`TimerCore: Tick - ${this.state.remainingSeconds} seconds remaining`)
      }
    }, 1000) // Actualizar cada segundo
  }

  /**
   * Notifica a todos los callbacks y sincroniza vía BroadcastChannel
   */
  private notifyCallbacks() {
    const stateSnapshot = { ...this.state }
    
    // Notificar callbacks locales (suscripciones directas)
    this.callbacks.forEach(callback => {
      try {
        callback(stateSnapshot)
      } catch (error) {
        console.warn('TimerCore: Error in callback', error)
      }
    })
    
    // Sincronizar con otras ventanas/pestañas vía BroadcastChannel
    this.broadcastStateUpdate(stateSnapshot)
  }

  /**
   * Publica el estado actualizado vía BroadcastChannel
   */
  private broadcastStateUpdate(state: TimerCoreState) {
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'TIMER_STATE_UPDATE',
          state: state,
          timestamp: Date.now(),
          source: 'timerCore'
        })
        console.log('TimerCore: Estado sincronizado vía BroadcastChannel')
      }
    } catch (error) {
      console.warn('TimerCore: Error broadcasting state:', error)
    }
  }

  /**
   * Inicia el cronómetro
   */
  start() {
    if (!this.state.running) {
      this.state.running = true
      this.saveStateToStorage()
      this.notifyCallbacks()
      console.log('TimerCore: Started')
    }
  }

  /**
   * Pausa el cronómetro
   */
  pause() {
    if (this.state.running) {
      this.state.running = false
      this.saveStateToStorage()
      this.notifyCallbacks()
      console.log('TimerCore: Paused')
    }
  }

  /**
   * Reinicia el cronómetro (resetea todo)
   */
  reset() {
    this.state.running = false
    this.state.remainingSeconds = 0
    this.state.currentStageIndex = 0
    this.state.adjustments = 0
    this.saveStateToStorage()
    this.notifyCallbacks()
    console.log('TimerCore: Reset')
  }

  /**
   * Solo pausa el cronómetro sin resetear valores
   */
  pauseOnly() {
    this.state.running = false
    this.saveStateToStorage()
    this.notifyCallbacks()
    console.log('TimerCore: Paused only')
  }

  /**
   * Actualiza el tiempo restante (llamado desde el componente principal)
   */
  updateRemainingSeconds(remainingSeconds: number) {
    this.state.remainingSeconds = remainingSeconds
    this.saveStateToStorage()
    this.notifyCallbacks()
    console.log(`TimerCore: Updated remaining seconds to ${remainingSeconds}`)
  }

  /**
   * Actualiza el índice de etapa (llamado desde el componente principal)
   */
  updateCurrentStageIndex(stageIndex: number) {
    this.state.currentStageIndex = stageIndex
    this.saveStateToStorage()
    this.notifyCallbacks()
    console.log(`TimerCore: Updated stage index to ${stageIndex}`)
  }

  /**
   * Actualiza los ajustes (llamado desde el componente principal)
   */
  updateAdjustments(adjustments: number) {
    this.state.adjustments = adjustments
    this.saveStateToStorage()
    this.notifyCallbacks()
    console.log(`TimerCore: Updated adjustments to ${adjustments}`)
  }

  /**
   * Obtiene el estado actual
   */
  getState(): TimerCoreState {
    return { ...this.state }
  }

  /**
   * Suscribe a cambios de estado
   */
  subscribe(callback: TimerCoreCallback): () => void {
    this.callbacks.add(callback)
    
    // Enviar estado actual inmediatamente
    callback({ ...this.state })
    
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Desconecta el Timer Core
   */
  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
    
    this.callbacks.clear()
    this.isInitialized = false
    console.log('TimerCore: Disconnected')
  }
}

// Instancia singleton del Timer Core
export const timerCore = new TimerCore()