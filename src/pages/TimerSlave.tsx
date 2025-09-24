import React, { useCallback, useEffect, useRef, useState } from 'react'
import { timerCore, TimerCoreState } from '../lib/timerCore'

interface SyncStatus {
  source: 'none' | 'broadcast'
  lastUpdate: number
  isHealthy: boolean
  messageCount: number
  lastValidState: TimerCoreState | null
}

export const TimerSlave: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerCoreState>({
    running: false,
    remainingSeconds: 0,
    currentStageIndex: 0,
    adjustments: 0
  })

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    source: 'none',
    lastUpdate: Date.now(),
    isHealthy: false,
    messageCount: 0,
    lastValidState: null
  })

  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidStateRef = useRef<TimerCoreState | null>(null)

  // 🎯 FUNCIÓN CENTRAL: Actualizar estado con DEBOUNCING y VALIDACIÓN
  const updateStateFromBroadcast = useCallback((newState: TimerCoreState, source: 'broadcast') => {
    const now = Date.now()
    
    // 🔒 DEBOUNCING: Evitar actualizaciones múltiples en 100ms
    if (now - lastUpdateRef.current < 100) {
      console.log('TimerSlave: Debouncing - Ignorando actualización muy rápida')
      return
    }
    
    // ✅ VALIDACIÓN: Verificar que el estado es coherente
    if (!newState || typeof newState.remainingSeconds !== 'number' || newState.remainingSeconds < 0) {
      console.log('TimerSlave: Estado inválido - Ignorando:', newState)
      return
    }
    
    // 🔍 VALIDACIÓN DE COHERENCIA: Comparar con último estado válido
    if (lastValidStateRef.current) {
      const timeDiff = Math.abs(newState.remainingSeconds - lastValidStateRef.current.remainingSeconds)
      const isRunning = newState.running
      const wasRunning = lastValidStateRef.current.running
      
      // Si está corriendo, el tiempo debe disminuir gradualmente
      if (isRunning && wasRunning && timeDiff > 5) {
        console.log('TimerSlave: Salto de tiempo sospechoso - Ignorando:', {
          previous: lastValidStateRef.current.remainingSeconds,
          current: newState.remainingSeconds,
          diff: timeDiff
        })
        return
      }
    }
    
    // 🎯 ACTUALIZAR ESTADO
    setTimerState(prevState => {
      const hasChanged = prevState.running !== newState.running ||
                        prevState.remainingSeconds !== newState.remainingSeconds ||
                        prevState.currentStageIndex !== newState.currentStageIndex ||
                        prevState.adjustments !== newState.adjustments
      
      if (hasChanged) {
        console.log('TimerSlave: Estado actualizado desde BroadcastChannel:', newState)
        lastValidStateRef.current = newState
        lastUpdateRef.current = now
        return newState
      }
      return prevState
    })
    
    setSyncStatus(prev => ({
      source,
      lastUpdate: now,
      isHealthy: true,
      messageCount: prev.messageCount + 1,
      lastValidState: newState
    }))
  }, [])

  // 🚀 FUNCIÓN DE DEBOUNCING: Retrasar actualizaciones múltiples
  const debouncedUpdate = useCallback((newState: TimerCoreState) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      updateStateFromBroadcast(newState, 'broadcast')
    }, 50) // Debounce de 50ms
  }, [updateStateFromBroadcast])

  useEffect(() => {
    let isActive = true
    
    // 📝 CAMBIAR TÍTULO DE LA PESTAÑA
    document.title = 'Cronómetro Slave'
    
    console.log('TimerSlave: Inicializando BroadcastChannel ESTABLE con técnicas avanzadas')
    
    // 🌐 BROADCASTCHANNEL CON TÉCNICAS AVANZADAS
    try {
      channelRef.current = new BroadcastChannel('timer-core-sync')
      channelRef.current.onmessage = (event) => {
        if (isActive && event.data?.type === 'TIMER_STATE_UPDATE') {
          const newState = event.data.state
          
          // 🔍 VALIDACIÓN INICIAL: Verificar estructura del mensaje
          if (!newState || typeof newState !== 'object') {
            console.log('TimerSlave: Mensaje inválido - Ignorando:', event.data)
            return
          }
          
          // 🎯 APLICAR DEBOUNCING
          debouncedUpdate(newState)
        }
      }
      console.log('TimerSlave: BroadcastChannel ESTABLE - ✅ Inicializada')
    } catch (error) {
      console.warn('TimerSlave: BroadcastChannel no disponible:', error)
    }

    // 🔄 INICIALIZACIÓN: Obtener estado inicial del timerCore
    try {
      const initialState = timerCore.getState()
      if (initialState) {
        updateStateFromBroadcast(initialState, 'broadcast')
        console.log('TimerSlave: Estado inicial obtenido del timerCore')
      }
    } catch (error) {
      console.warn('TimerSlave: Error obteniendo estado inicial del timerCore:', error)
    }

    // 🏥 HEALTH CHECK: Verificar salud de la conexión
    const healthCheck = setInterval(() => {
      if (isActive) {
        const timeSinceLastUpdate = Date.now() - syncStatus.lastUpdate
        
        if (timeSinceLastUpdate > 5000) {
          setSyncStatus(prev => ({ ...prev, isHealthy: false }))
          console.log('TimerSlave: Health check - Sin actualizaciones recientes')
        }
      }
    }, 2000)

    return () => {
      isActive = false
      
      // 📝 RESTAURAR TÍTULO ORIGINAL DE LA PESTAÑA
      document.title = 'Housenovo Directorios Empresariales'
      
      console.log('TimerSlave: Iniciando cleanup de BroadcastChannel ESTABLE')
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      if (channelRef.current) {
        channelRef.current.close()
        console.log('TimerSlave: BroadcastChannel - 🧹 Limpiada')
      }
      
      clearInterval(healthCheck)
      console.log('TimerSlave: Cleanup completo - BroadcastChannel desconectado')
    }
  }, [updateStateFromBroadcast, debouncedUpdate, syncStatus.lastUpdate])

  // Formatear tiempo en formato MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl text-center">
        
        {/* SOLO EL TIEMPO DEL CRONÓMETRO EN EL CENTRO */}
        <div className="mb-8">
          <div 
            className={`text-8xl font-mono font-bold mb-4 transition-colors duration-300 ${
              timerState.running ? 'text-green-600' : 'text-gray-600'
            }`}
          >
            {formatTime(timerState.remainingSeconds)}
          </div>
        </div>

      </div>
    </div>
  )
}