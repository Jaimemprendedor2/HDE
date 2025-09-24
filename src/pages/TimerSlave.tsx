import React, { useCallback, useEffect, useRef, useState } from 'react'
import { timerCore, TimerCoreState } from '../lib/timerCore'

interface SyncStatus {
  source: 'none' | 'direct' | 'broadcast' | 'storage' | 'initial' | 'direct-recovery' | 'initial-storage'
  lastUpdate: number
  isHealthy: boolean
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
    isHealthy: false
  })

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const healthCheckRef = useRef<number>()
  const fallbackTimerRef = useRef<number>()

  // 🎯 FUNCIÓN CENTRAL: Actualizar estado con tracking de fuente
  const updateStateFromSource = useCallback((newState: TimerCoreState, source: SyncStatus['source']) => {
    setTimerState(newState)
    setSyncStatus({
      source,
      lastUpdate: Date.now(),
      isHealthy: true
    })
    console.log(`TimerSlave: Estado actualizado desde ${source}:`, newState)
  }, [])

  useEffect(() => {
    let isActive = true
    
    console.log('TimerSlave: Inicializando arquitectura súper robusta de 4 capas')
    
    // 🏆 CAPA 1: SUSCRIPCIÓN DIRECTA AL CORE (Prioridad máxima)
    // - 100% dependencia del timerCore
    // - Actualizaciones instantáneas
    // - Funciona igual que TimerMaster
    try {
      unsubscribeRef.current = timerCore.subscribe((state) => {
        if (isActive) {
          updateStateFromSource(state, 'direct')
        }
      })
      console.log('TimerSlave: Capa 1 (Suscripción directa) - ✅ Inicializada')
    } catch (error) {
      console.error('TimerSlave: Error en Capa 1 (Suscripción directa):', error)
    }

    // 🌐 CAPA 2: BROADCASTCHANNEL MULTI-PESTAÑA (Redundancia)
    // - Sincronización entre pestañas
    // - Backup si la suscripción directa falla
    try {
      channelRef.current = new BroadcastChannel('timer-core-sync')
      channelRef.current.onmessage = (event) => {
        if (isActive && event.data?.type === 'TIMER_STATE_UPDATE') {
          // Solo usar BroadcastChannel si no hay actualización directa reciente
          const timeSinceLastUpdate = Date.now() - syncStatus.lastUpdate
          if (timeSinceLastUpdate > 2000 || syncStatus.source === 'storage') {
            updateStateFromSource(event.data.state, 'broadcast')
          }
        }
      }
      console.log('TimerSlave: Capa 2 (BroadcastChannel) - ✅ Inicializada')
    } catch (error) {
      console.warn('TimerSlave: Capa 2 (BroadcastChannel) no disponible:', error)
    }

    // 💾 CAPA 3: LOCALSTORAGE POLLING (Fallback robusto)
    // - Recovery si las otras capas fallan
    // - Persistencia entre reinicios
    const storagePolling = setInterval(() => {
      if (isActive) {
        try {
          const stored = localStorage.getItem('timerCoreState')
          if (stored) {
            const storedState = JSON.parse(stored)
            // Solo usar storage si no hay updates recientes de fuentes mejores
            const timeSinceLastUpdate = Date.now() - syncStatus.lastUpdate
            if (timeSinceLastUpdate > 5000) {
              updateStateFromSource(storedState, 'storage')
            }
          }
        } catch (error) {
          console.warn('TimerSlave: Error en Capa 3 (localStorage):', error)
        }
      }
    }, 3000) // Polling cada 3 segundos
    console.log('TimerSlave: Capa 3 (localStorage polling) - ✅ Inicializada')

    // 🔍 CAPA 4: HEALTH CHECK Y AUTO-RECOVERY
    // - Detecta desconexiones
    // - Intenta reconectar automáticamente
    const healthCheck = setInterval(() => {
      if (isActive) {
        const timeSinceLastUpdate = Date.now() - syncStatus.lastUpdate
        
        if (timeSinceLastUpdate > 10000) {
          // No hay updates por 10 segundos - marcar como unhealthy
          setSyncStatus(prev => ({ ...prev, isHealthy: false }))
          
          // Intentar re-suscripción directa
          try {
            if (unsubscribeRef.current) {
              unsubscribeRef.current()
            }
            unsubscribeRef.current = timerCore.subscribe((state) => {
              if (isActive) {
                updateStateFromSource(state, 'direct-recovery')
              }
            })
            
            console.log('TimerSlave: Capa 4 (Auto-recovery) - Re-suscripción ejecutada')
          } catch (error) {
            console.error('TimerSlave: Error en auto-recovery:', error)
          }
        }
      }
    }, 5000) // Health check cada 5 segundos
    console.log('TimerSlave: Capa 4 (Health check & Auto-recovery) - ✅ Inicializada')

    // 🔄 INICIALIZACIÓN: Obtener estado inicial del timerCore
    try {
      const initialState = timerCore.getState()
      updateStateFromSource(initialState, 'initial')
      console.log('TimerSlave: Estado inicial obtenido del timerCore')
    } catch (error) {
      // Fallback a localStorage si el core falla
      console.warn('TimerSlave: Error obteniendo estado inicial del timerCore:', error)
      try {
        const stored = localStorage.getItem('timerCoreState')
        if (stored) {
          updateStateFromSource(JSON.parse(stored), 'initial-storage')
          console.log('TimerSlave: Estado inicial obtenido de localStorage')
        }
      } catch (storageError) {
        console.error('TimerSlave: Error en inicialización completa:', error, storageError)
      }
    }

    // Referencias para cleanup
    healthCheckRef.current = healthCheck
    fallbackTimerRef.current = storagePolling

    return () => {
      isActive = false
      
      console.log('TimerSlave: Iniciando cleanup de 4 capas')
      
      // Cleanup suscripción directa
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        console.log('TimerSlave: Capa 1 (Suscripción directa) - 🧹 Limpiada')
      }
      
      // Cleanup BroadcastChannel
      if (channelRef.current) {
        channelRef.current.close()
        console.log('TimerSlave: Capa 2 (BroadcastChannel) - 🧹 Limpiada')
      }
      
      // Cleanup timers
      clearInterval(storagePolling)
      clearInterval(healthCheck)
      console.log('TimerSlave: Capas 3 y 4 (Polling & Health check) - 🧹 Limpiadas')
      
      console.log('TimerSlave: Cleanup completo - Todas las capas desconectadas')
    }
  }, [updateStateFromSource])

  // Formatear tiempo en formato MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Determinar color del indicador de estado
  const getStatusColor = () => {
    if (!syncStatus.isHealthy) return 'bg-red-100 border-red-200 text-red-800'
    
    switch (syncStatus.source) {
      case 'direct':
      case 'direct-recovery':
      case 'initial':
        return 'bg-green-100 border-green-200 text-green-800'
      case 'broadcast':
        return 'bg-blue-100 border-blue-200 text-blue-800'
      case 'storage':
      case 'initial-storage':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800'
    }
  }

  const getStatusIcon = () => {
    if (!syncStatus.isHealthy) return '🔴'
    
    switch (syncStatus.source) {
      case 'direct':
      case 'direct-recovery':
      case 'initial':
        return '🟢'
      case 'broadcast':
        return '🔵'
      case 'storage':
      case 'initial-storage':
        return '🟡'
      default:
        return '⚪'
    }
  }

  const getSourceDescription = () => {
    switch (syncStatus.source) {
      case 'direct':
        return 'Suscripción directa al timerCore'
      case 'broadcast':
        return 'BroadcastChannel (multi-pestaña)'
      case 'storage':
        return 'localStorage (fallback)'
      case 'initial':
        return 'Estado inicial del timerCore'
      case 'direct-recovery':
        return 'Re-suscripción automática'
      case 'initial-storage':
        return 'Estado inicial desde localStorage'
      default:
        return 'Sin sincronización activa'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl text-center">
        
        {/* Status de sincronización súper robusto */}
        <div className={`mb-6 p-4 rounded-lg border-2 transition-all duration-300 ${getStatusColor()}`}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">{getStatusIcon()}</span>
            <h4 className="font-bold text-lg">Estado de Sincronización</h4>
          </div>
          <div className="text-sm font-medium">
            <div>🔗 Fuente: {getSourceDescription()}</div>
            <div>⏰ Última actualización: {new Date(syncStatus.lastUpdate).toLocaleTimeString()}</div>
            <div>🛡️ Estado: {syncStatus.isHealthy ? 'Saludable ✅' : 'Reconectando ⚠️'}</div>
          </div>
        </div>

        {/* Header con indicador de estado del cronómetro */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div 
              className={`w-6 h-6 rounded-full transition-colors duration-300 ${
                timerState.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Cronómetro Slave
            </h1>
            <div className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-mono">
              4-Capas
            </div>
          </div>
          
          <p className="text-gray-600">
            {timerState.running ? 'Cronómetro en ejecución' : 'Cronómetro pausado'}
          </p>
        </div>

        {/* Display principal del tiempo */}
        <div className="mb-8">
          <div 
            className={`text-8xl font-mono font-bold mb-4 transition-colors duration-300 ${
              timerState.running ? 'text-green-600' : 'text-gray-600'
            } ${!syncStatus.isHealthy ? 'opacity-50' : ''}`}
          >
            {formatTime(timerState.remainingSeconds)}
          </div>
          
          {/* Indicador de estado visual */}
          <div className="flex items-center justify-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                timerState.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className={`text-sm font-medium transition-colors duration-300 ${
              timerState.running ? 'text-green-600' : 'text-gray-500'
            }`}>
              {timerState.running ? 'En ejecución' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Información detallada del estado */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado Completo del Cronómetro
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-left">
              <span className="text-gray-600">Estado:</span>
              <span className={`ml-2 font-medium ${
                timerState.running ? 'text-green-600' : 'text-gray-600'
              }`}>
                {timerState.running ? 'Ejecutándose' : 'Pausado'}
              </span>
            </div>
            
            <div className="text-left">
              <span className="text-gray-600">Tiempo restante:</span>
              <span className="ml-2 font-medium font-mono text-blue-600">
                {formatTime(timerState.remainingSeconds)}
              </span>
            </div>
            
            <div className="text-left">
              <span className="text-gray-600">Etapa actual:</span>
              <span className="ml-2 font-medium text-orange-600">
                #{timerState.currentStageIndex + 1}
              </span>
            </div>
            
            <div className="text-left">
              <span className="text-gray-600">Ajustes:</span>
              <span className={`ml-2 font-medium ${
                timerState.adjustments === 0 ? 'text-gray-600' : 
                timerState.adjustments > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {timerState.adjustments > 0 ? '+' : ''}{timerState.adjustments}s
              </span>
            </div>
          </div>
        </div>

        {/* Información de arquitectura */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-bold text-purple-900 mb-2">🛡️ Arquitectura Súper Robusta</h4>
          <div className="text-purple-800 text-sm space-y-1">
            <div>🏆 <strong>Capa 1:</strong> Suscripción directa al timerCore (100% dependencia)</div>
            <div>🌐 <strong>Capa 2:</strong> BroadcastChannel para multi-pestaña</div>
            <div>💾 <strong>Capa 3:</strong> localStorage polling como fallback</div>
            <div>🔍 <strong>Capa 4:</strong> Health check y auto-recovery</div>
          </div>
          <div className="mt-3 text-xs text-purple-700">
            💡 Los controles están disponibles en la ventana principal de gestión de actividades.
          </div>
        </div>
      </div>
    </div>
  )
}