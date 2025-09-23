import { create } from 'zustand'
import { ControlAction, TimerMessage, TimerState } from '../types/timer'

/**
 * Estado extendido del timer con funcionalidades adicionales
 */
interface TimerStoreState extends TimerState {
  // Estado interno para tracking
  animationFrameId: number | null
  lastUpdateTime: number
  
  // Estado de etapas
  stages: Array<{ id: string; title: string; duration: number; description: string }>
  currentStageIndex: number
  
  // Acciones del store
  control: (action: ControlAction) => void
  computeRemaining: (now?: number) => number
  startRenderLoop: () => void
  stopRenderLoop: () => void
  hydrate: (state: Partial<TimerState>) => void
  setStages: (stages: Array<{ id: string; title: string; duration: number; description: string }>) => void
  getCurrentStage: () => { id: string; title: string; duration: number; description: string } | null
  
  // Helpers para sincronización
  createSyncResponse: () => TimerMessage
  applySyncResponse: (message: TimerMessage) => void
}

/**
 * Store del timer usando Zustand
 */
export const useTimerStore = create<TimerStoreState>((set, get) => ({
  // Estado inicial
  directoryId: '',
  stageId: '',
  durationMs: 0,
  startTimeMs: null,
  adjustmentsMs: 0,
  isRunning: false,
  animationFrameId: null,
  lastUpdateTime: 0,
  stages: [],
  currentStageIndex: 0,

  /**
   * Calcula el tiempo restante basado en el estado actual
   * @param now - Timestamp actual (performance.now() por defecto)
   * @returns Tiempo restante en milisegundos
   */
  computeRemaining: (now = performance.now()) => {
    const state = get()
    
    if (state.isRunning && state.startTimeMs !== null) {
      // Timer corriendo: duración - (tiempo transcurrido) + ajustes
      const elapsed = now - state.startTimeMs
      const remaining = state.durationMs - elapsed + state.adjustmentsMs
      return Math.max(0, remaining)
    } else {
      // Timer pausado: usar el último tiempo restante calculado
      // Si no hay startTimeMs, significa que está pausado y usamos duración + ajustes
      const lastRemaining = state.durationMs + state.adjustmentsMs
      return Math.max(0, lastRemaining)
    }
  },

  /**
   * Controla las acciones del timer
   * @param action - Acción a ejecutar
   */
  control: (action: ControlAction) => {
    const now = performance.now()
    const state = get()

    switch (action) {
      case 'PLAY':
        if (!state.isRunning) {
          set({
            isRunning: true,
            startTimeMs: now,
            lastUpdateTime: now
          })
          // Iniciar el loop de renderizado si no está activo
          if (!state.animationFrameId) {
            get().startRenderLoop()
          }
        }
        break

      case 'PAUSE':
        if (state.isRunning) {
          // Calcular y persistir el tiempo restante
          const remaining = state.computeRemaining(now)
          set({
            isRunning: false,
            startTimeMs: null,
            durationMs: remaining,
            adjustmentsMs: 0, // Reset ajustes al pausar
            lastUpdateTime: now
          })
          // El loop de renderizado se mantiene para mostrar el tiempo pausado
        }
        break

      case 'RESET':
        // Volver a la duración original (sin ajustes)
        set({
          isRunning: false,
          startTimeMs: null,
          adjustmentsMs: 0,
          lastUpdateTime: now
        })
        break

      case 'ADD30':
        // Añadir 30 segundos (30,000 ms)
        set({
          adjustmentsMs: state.adjustmentsMs + 30000,
          lastUpdateTime: now
        })
        break

      case 'SUB30':
        // Restar 30 segundos (30,000 ms)
        const newAdjustment = state.adjustmentsMs - 30000
        // No permitir ajustes negativos que hagan el tiempo restante negativo
        const currentRemaining = state.computeRemaining(now)
        const minAdjustment = -currentRemaining
        set({
          adjustmentsMs: Math.max(minAdjustment, newAdjustment),
          lastUpdateTime: now
        })
        break

      case 'NEXT':
        // Cambiar a la siguiente etapa
        const nextIndex = Math.min(state.currentStageIndex + 1, state.stages.length - 1)
        const nextStage = state.stages[nextIndex]
        if (nextStage) {
          set({
            currentStageIndex: nextIndex,
            stageId: nextStage.id,
            durationMs: nextStage.duration,
            isRunning: false,
            startTimeMs: null,
            adjustmentsMs: 0,
            lastUpdateTime: now
          })
        }
        break

      case 'PREV':
        // Cambiar a la etapa anterior
        const prevIndex = Math.max(state.currentStageIndex - 1, 0)
        const prevStage = state.stages[prevIndex]
        if (prevStage) {
          set({
            currentStageIndex: prevIndex,
            stageId: prevStage.id,
            durationMs: prevStage.duration,
            isRunning: false,
            startTimeMs: null,
            adjustmentsMs: 0,
            lastUpdateTime: now
          })
        }
        break
    }
  },

  /**
   * Inicia el loop de renderizado usando requestAnimationFrame
   */
  startRenderLoop: () => {
    const state = get()
    
    // Evitar múltiples loops
    if (state.animationFrameId) {
      return
    }

    const renderLoop = () => {
      const now = performance.now()
      const state = get()
      
      // Solo actualizar si realmente cambió el tiempo
      if (now - state.lastUpdateTime > 100) { // Actualizar máximo cada 100ms
        set({ lastUpdateTime: now })
      }
      
      // Continuar el loop solo si el timer está corriendo
      if (state.isRunning) {
        const animationFrameId = requestAnimationFrame(renderLoop)
        set({ animationFrameId })
      } else {
        // Si no está corriendo, limpiar el frame
        set({ animationFrameId: null })
      }
    }

    // Iniciar el loop
    const animationFrameId = requestAnimationFrame(renderLoop)
    set({ animationFrameId })
  },

  /**
   * Detiene el loop de renderizado
   */
  stopRenderLoop: () => {
    const state = get()
    
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
      set({ animationFrameId: null })
    }
  },

  /**
   * Hidrata el estado del timer con datos entrantes (para sincronización)
   * @param newState - Estado parcial a aplicar
   */
  hydrate: (newState: Partial<TimerState>) => {
    const now = performance.now()
    
    set({
      ...newState,
      lastUpdateTime: now
    })
  },

  /**
   * Crea un mensaje de sincronización con el estado actual
   * @returns Mensaje SYNC_RESPONSE con el estado actual
   */
  createSyncResponse: (): TimerMessage => {
    const state = get()
    
    return {
      type: 'SYNC_RESPONSE',
      payload: {
        directoryId: state.directoryId,
        stageId: state.stageId,
        durationMs: state.durationMs,
        startTimeMs: state.startTimeMs,
        adjustmentsMs: state.adjustmentsMs,
        isRunning: state.isRunning,
        timestamp: performance.now()
      },
      v: 'v1'
    }
  },

  /**
   * Aplica un mensaje de sincronización al estado del timer
   * @param message - Mensaje SYNC_RESPONSE a aplicar
   */
  applySyncResponse: (message: TimerMessage) => {
    if (message.type !== 'SYNC_RESPONSE' || message.v !== 'v1') {
      console.warn('Invalid sync message format')
      return
    }

    const payload = message.payload
    if (!payload) {
      console.warn('Sync message missing payload')
      return
    }

    // Aplicar el estado entrante
    get().hydrate({
      directoryId: payload.directoryId || '',
      stageId: payload.stageId || '',
      durationMs: payload.durationMs || 0,
      startTimeMs: payload.startTimeMs || null,
      adjustmentsMs: payload.adjustmentsMs || 0,
      isRunning: payload.isRunning || false
    })

    // Ajustar el loop de renderizado según el estado
    if (payload.isRunning && !get().animationFrameId) {
      get().startRenderLoop()
    } else if (!payload.isRunning && get().animationFrameId) {
      // Mantener el loop para mostrar el estado pausado
    }
  },

  /**
   * Configura las etapas del timer
   * @param stages - Array de etapas a configurar
   */
  setStages: (stages: Array<{ id: string; title: string; duration: number; description: string }>) => {
    const state = get()
    
    // Evitar actualizaciones innecesarias si las etapas son las mismas
    if (state.stages.length === stages.length && 
        state.stages.every((stage, index) => 
          stage.id === stages[index]?.id && 
          stage.duration === stages[index]?.duration
        )) {
      return
    }
    
    const firstStage = stages[0]
    
    set({
      stages,
      currentStageIndex: 0,
      stageId: firstStage?.id || '',
      durationMs: firstStage?.duration || 0,
      isRunning: false,
      startTimeMs: null,
      adjustmentsMs: 0,
      lastUpdateTime: performance.now()
    })
  },

  /**
   * Obtiene la etapa actual
   * @returns La etapa actual o null si no hay etapas
   */
  getCurrentStage: () => {
    const state = get()
    return state.stages[state.currentStageIndex] || null
  }
}))

/**
 * Hook personalizado para usar el timer con funcionalidades adicionales
 */
export const useTimer = () => {
  const store = useTimerStore()
  
  // Computar valores derivados
  const remainingMs = store.computeRemaining()
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const progress = store.durationMs > 0 ? (store.durationMs - remainingMs) / store.durationMs : 0
  
  return {
    ...store,
    remainingMs,
    remainingSeconds,
    progress: Math.min(1, Math.max(0, progress)),
    
    // Helpers adicionales
    formatTime: (ms: number) => {
      const totalSeconds = Math.ceil(ms / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    
    isExpired: remainingMs <= 0,
    canSubtract: remainingMs > 30000, // Solo permitir restar si quedan más de 30 segundos
  }
}

/**
 * Inicializar el timer con una configuración específica
 */
export const initializeTimer = (
  directoryId: string,
  stageId: string,
  durationMs: number
) => {
  useTimerStore.setState({
    directoryId,
    stageId,
    durationMs,
    startTimeMs: null,
    adjustmentsMs: 0,
    isRunning: false,
    animationFrameId: null,
    lastUpdateTime: performance.now()
  })
}

/**
 * Cleanup del timer al desmontar componentes
 */
export const cleanupTimer = () => {
  useTimerStore.getState().stopRenderLoop()
}
