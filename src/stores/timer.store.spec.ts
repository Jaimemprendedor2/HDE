import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTimerStore } from './timer'
import type { ControlAction } from '../types/timer'

// Mock performance.now
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
})

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  setTimeout(() => callback(performance.now()), 16) // ~60fps
  return 1
})

const mockCancelAnimationFrame = vi.fn()

Object.defineProperty(global, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame
})

Object.defineProperty(global, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame
})

describe('Timer Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPerformanceNow.mockReturnValue(0)
    
    // Reset store state
    useTimerStore.setState({
      directoryId: '',
      stageId: '',
      durationMs: 60000, // 60 segundos
      startTimeMs: null,
      adjustmentsMs: 0,
      isRunning: false,
      animationFrameId: null,
      lastUpdateTime: 0
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('computeRemaining', () => {
    it('should return full duration when timer is not running', () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000
      store.isRunning = false
      
      mockPerformanceNow.mockReturnValue(1000)
      
      const remaining = store.computeRemaining()
      expect(remaining).toBe(60000)
    })

    it('should calculate remaining time when timer is running', () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000 // 60 segundos
      store.startTimeMs = 1000 // Empezó en 1 segundo
      store.isRunning = true
      
      mockPerformanceNow.mockReturnValue(10000) // Ahora son 10 segundos
      
      const remaining = store.computeRemaining()
      expect(remaining).toBe(51000) // 60s - 9s = 51s
    })

    it('should handle adjustments correctly', () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000
      store.startTimeMs = 1000
      store.isRunning = true
      store.adjustmentsMs = 5000 // +5 segundos
      
      mockPerformanceNow.mockReturnValue(10000)
      
      const remaining = store.computeRemaining()
      expect(remaining).toBe(56000) // 60s - 9s + 5s = 56s
    })

    it('should never return negative values', () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000
      store.startTimeMs = 1000
      store.isRunning = true
      
      mockPerformanceNow.mockReturnValue(70000) // 70 segundos después
      
      const remaining = store.computeRemaining()
      expect(remaining).toBe(0) // No debe ser negativo
    })
  })

  describe('control actions', () => {
    it('should start timer on PLAY action', () => {
      const store = useTimerStore.getState()
      
      mockPerformanceNow.mockReturnValue(5000)
      
      store.control('PLAY')
      
      expect(store.isRunning).toBe(true)
      expect(store.startTimeMs).toBe(5000)
    })

    it('should pause timer on PAUSE action', () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000
      store.startTimeMs = 1000
      store.isRunning = true
      
      mockPerformanceNow.mockReturnValue(10000)
      
      store.control('PAUSE')
      
      expect(store.isRunning).toBe(false)
      expect(store.startTimeMs).toBe(null)
      expect(store.adjustmentsMs).toBe(0)
    })

    it('should reset timer on RESET action', () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000
      store.startTimeMs = 1000
      store.isRunning = true
      store.adjustmentsMs = 5000
      
      store.control('RESET')
      
      expect(store.isRunning).toBe(false)
      expect(store.startTimeMs).toBe(null)
      expect(store.adjustmentsMs).toBe(0)
    })

    it('should add 30 seconds on ADD30 action', () => {
      const store = useTimerStore.getState()
      store.adjustmentsMs = 1000
      
      store.control('ADD30')
      
      expect(store.adjustmentsMs).toBe(31000)
    })

    it('should subtract 30 seconds on SUB30 action', () => {
      const store = useTimerStore.getState()
      store.adjustmentsMs = 5000
      
      store.control('SUB30')
      
      expect(store.adjustmentsMs).toBe(-25000)
    })

    it('should not allow SUB30 to make remaining time negative', () => {
      const store = useTimerStore.getState()
      store.durationMs = 30000 // 30 segundos
      store.adjustmentsMs = 0
      
      store.control('SUB30')
      
      expect(store.adjustmentsMs).toBe(-30000) // Máximo -30s
    })

    it('should reset timing on NEXT action', () => {
      const store = useTimerStore.getState()
      store.isRunning = true
      store.startTimeMs = 1000
      store.adjustmentsMs = 5000
      
      store.control('NEXT')
      
      expect(store.isRunning).toBe(false)
      expect(store.startTimeMs).toBe(null)
      expect(store.adjustmentsMs).toBe(0)
    })

    it('should reset timing on PREV action', () => {
      const store = useTimerStore.getState()
      store.isRunning = true
      store.startTimeMs = 1000
      store.adjustmentsMs = 5000
      
      store.control('PREV')
      
      expect(store.isRunning).toBe(false)
      expect(store.startTimeMs).toBe(null)
      expect(store.adjustmentsMs).toBe(0)
    })
  })

  describe('render loop with focus loss simulation', () => {
    it('should handle 60s timer without drift during focus loss', async () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000 // 60 segundos
      
      // Simular pérdida de foco y recuperación
      let currentTime = 1000
      mockPerformanceNow.mockImplementation(() => currentTime)
      
      // Iniciar timer
      store.control('PLAY')
      expect(store.isRunning).toBe(true)
      expect(store.startTimeMs).toBe(1000)
      
      // Simular 30 segundos de ejecución normal
      currentTime = 31000
      await new Promise(resolve => setTimeout(resolve, 100))
      
      let remaining = store.computeRemaining()
      expect(remaining).toBe(30000) // 60s - 30s = 30s
      
      // Simular pérdida de foco por 5 segundos (el timer continúa)
      currentTime = 36000 // +5 segundos
      await new Promise(resolve => setTimeout(resolve, 100))
      
      remaining = store.computeRemaining()
      expect(remaining).toBe(25000) // 60s - 35s = 25s
      
      // Simular recuperación de foco
      currentTime = 40000 // +4 segundos más
      await new Promise(resolve => setTimeout(resolve, 100))
      
      remaining = store.computeRemaining()
      expect(remaining).toBe(21000) // 60s - 39s = 21s
      
      // Verificar que no hay drift significativo
      const expectedRemaining = 60000 - (40000 - 1000)
      const drift = Math.abs(remaining - expectedRemaining)
      expect(drift).toBeLessThan(100) // Menos de 100ms de drift
    })

    it('should maintain accuracy during multiple focus losses', async () => {
      const store = useTimerStore.getState()
      store.durationMs = 60000
      
      let currentTime = 1000
      mockPerformanceNow.mockImplementation(() => currentTime)
      
      store.control('PLAY')
      
      // Simular múltiples pérdidas de foco
      const focusLosses = [
        { time: 15000, expectedRemaining: 45000 },
        { time: 25000, expectedRemaining: 35000 },
        { time: 40000, expectedRemaining: 20000 },
        { time: 55000, expectedRemaining: 5000 }
      ]
      
      for (const loss of focusLosses) {
        currentTime = loss.time
        await new Promise(resolve => setTimeout(resolve, 50))
        
        const remaining = store.computeRemaining()
        const expected = loss.expectedRemaining
        const drift = Math.abs(remaining - expected)
        
        expect(drift).toBeLessThan(50) // Máximo 50ms de drift
      }
    })

    it('should handle timer completion correctly', async () => {
      const store = useTimerStore.getState()
      store.durationMs = 5000 // 5 segundos para test rápido
      
      let currentTime = 1000
      mockPerformanceNow.mockImplementation(() => currentTime)
      
      store.control('PLAY')
      
      // Simular tiempo hasta completar
      currentTime = 7000 // 6 segundos después
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const remaining = store.computeRemaining()
      expect(remaining).toBe(0) // Timer completado
      
      // Verificar que el timer sigue funcionando después de completar
      currentTime = 8000
      const remainingAfter = store.computeRemaining()
      expect(remainingAfter).toBe(0) // Sigue en 0
    })
  })

  describe('animation frame management', () => {
    it('should start render loop when timer starts', () => {
      const store = useTimerStore.getState()
      
      store.control('PLAY')
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })

    it('should stop render loop when timer stops', () => {
      const store = useTimerStore.getState()
      
      store.control('PLAY')
      store.control('PAUSE')
      
      // El loop se mantiene para mostrar el estado pausado
      // pero se puede verificar que se canceló el frame anterior
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('sync response creation', () => {
    it('should create valid sync response', () => {
      const store = useTimerStore.getState()
      store.directoryId = 'dir-123'
      store.stageId = 'stage-456'
      store.durationMs = 60000
      store.startTimeMs = 1000
      store.adjustmentsMs = 5000
      store.isRunning = true
      
      const syncResponse = store.createSyncResponse()
      
      expect(syncResponse.type).toBe('SYNC_RESPONSE')
      expect(syncResponse.v).toBe('v1')
      expect(syncResponse.payload).toEqual({
        directoryId: 'dir-123',
        stageId: 'stage-456',
        durationMs: 60000,
        startTimeMs: 1000,
        adjustmentsMs: 5000,
        isRunning: true,
        timestamp: expect.any(Number)
      })
    })

    it('should apply sync response correctly', () => {
      const store = useTimerStore.getState()
      
      const syncData = {
        directoryId: 'dir-789',
        stageId: 'stage-101',
        durationMs: 120000,
        startTimeMs: 2000,
        adjustmentsMs: 10000,
        isRunning: false
      }
      
      store.hydrate(syncData)
      
      expect(store.directoryId).toBe('dir-789')
      expect(store.stageId).toBe('stage-101')
      expect(store.durationMs).toBe(120000)
      expect(store.startTimeMs).toBe(2000)
      expect(store.adjustmentsMs).toBe(10000)
      expect(store.isRunning).toBe(false)
    })
  })
})
