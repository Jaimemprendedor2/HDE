/**
 * Timer Core - Sistema centralizado de cronómetro
 * Maneja todos los cálculos y estado del cronómetro
 */

export interface TimerCoreState {
  elapsedMs: number
  running: boolean
  timestamp: number
  remainingSeconds: number
  currentStageIndex: number
  adjustments: number
}

export type TimerCoreCallback = (state: TimerCoreState) => void

class TimerCore {
  private state: TimerCoreState = {
    elapsedMs: 0,
    running: false,
    timestamp: 0,
    remainingSeconds: 0,
    currentStageIndex: 0,
    adjustments: 0
  }
  
  private callbacks: Set<TimerCoreCallback> = new Set()
  private animationFrameId: number | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  /**
   * Inicializa el Timer Core
   */
  private initialize() {
    this.loadStateFromStorage()
    this.startUpdateLoop()
    this.isInitialized = true
    console.log('TimerCore: Initialized')
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
   * Inicia el loop de actualización
   */
  private startUpdateLoop() {
    const update = () => {
      this.updateState()
      this.animationFrameId = requestAnimationFrame(update)
    }
    this.animationFrameId = requestAnimationFrame(update)
  }

  /**
   * Actualiza el estado del cronómetro
   */
  private updateState() {
    const now = performance.now()
    
    if (this.state.running && this.state.timestamp > 0) {
      // Calcular tiempo transcurrido
      const elapsed = now - this.state.timestamp
      this.state.elapsedMs = Math.floor(elapsed)
    }
    
    this.state.timestamp = now
    this.notifyCallbacks()
  }

  /**
   * Notifica a todos los callbacks
   */
  private notifyCallbacks() {
    this.callbacks.forEach(callback => {
      try {
        callback({ ...this.state })
      } catch (error) {
        console.warn('TimerCore: Error in callback', error)
      }
    })
  }

  /**
   * Inicia el cronómetro
   */
  start() {
    if (!this.state.running) {
      this.state.running = true
      this.state.timestamp = performance.now()
      this.state.elapsedMs = 0
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
   * Reinicia el cronómetro
   */
  reset() {
    this.state = {
      elapsedMs: 0,
      running: false,
      timestamp: performance.now(),
      remainingSeconds: 0,
      currentStageIndex: 0,
      adjustments: 0
    }
    this.saveStateToStorage()
    this.notifyCallbacks()
    console.log('TimerCore: Reset')
  }

  /**
   * Actualiza el tiempo restante (llamado desde el componente principal)
   */
  updateRemainingSeconds(remainingSeconds: number) {
    this.state.remainingSeconds = remainingSeconds
    this.saveStateToStorage()
    this.notifyCallbacks()
  }

  /**
   * Actualiza el índice de etapa (llamado desde el componente principal)
   */
  updateCurrentStageIndex(stageIndex: number) {
    this.state.currentStageIndex = stageIndex
    this.saveStateToStorage()
    this.notifyCallbacks()
  }

  /**
   * Actualiza los ajustes (llamado desde el componente principal)
   */
  updateAdjustments(adjustments: number) {
    this.state.adjustments = adjustments
    this.saveStateToStorage()
    this.notifyCallbacks()
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
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.callbacks.clear()
    this.isInitialized = false
    console.log('TimerCore: Disconnected')
  }
}

// Instancia singleton del Timer Core
export const timerCore = new TimerCore()
