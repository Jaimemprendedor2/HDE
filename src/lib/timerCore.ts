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
    console.log('TimerCore: Initialized with simplified logic')
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
    this.state.running = false
    this.state.remainingSeconds = 0
    this.state.currentStageIndex = 0
    this.state.adjustments = 0
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
    this.callbacks.clear()
    this.isInitialized = false
    console.log('TimerCore: Disconnected')
  }
}

// Instancia singleton del Timer Core
export const timerCore = new TimerCore()