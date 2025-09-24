import React, { useCallback, useEffect, useRef, useState } from 'react'
import { timerCore, TimerCoreState } from '../lib/timerCore'

interface SyncStatus {
  source: 'none' | 'broadcast'
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

  const channelRef = useRef<BroadcastChannel | null>(null)

  // 🎯 FUNCIÓN CENTRAL: Actualizar estado desde BroadcastChannel
  const updateStateFromBroadcast = useCallback((newState: TimerCoreState) => {
    setTimerState(prevState => {
      const hasChanged = prevState.running !== newState.running ||
                        prevState.remainingSeconds !== newState.remainingSeconds ||
                        prevState.currentStageIndex !== newState.currentStageIndex ||
                        prevState.adjustments !== newState.adjustments
      
      if (hasChanged) {
        console.log('TimerSlave: Estado actualizado desde BroadcastChannel:', newState)
        return newState
      }
      return prevState
    })
    
    setSyncStatus({
      source: 'broadcast',
      lastUpdate: Date.now(),
      isHealthy: true
    })
  }, [])

  useEffect(() => {
    let isActive = true
    
    console.log('TimerSlave: Inicializando solo con BroadcastChannel (Capa 2)')
    
    // 🌐 CAPA 2: BROADCASTCHANNEL MULTI-PESTAÑA (Única fuente)
    try {
      channelRef.current = new BroadcastChannel('timer-core-sync')
      channelRef.current.onmessage = (event) => {
        if (isActive && event.data?.type === 'TIMER_STATE_UPDATE') {
          updateStateFromBroadcast(event.data.state)
        }
      }
      console.log('TimerSlave: BroadcastChannel - ✅ Inicializada')
    } catch (error) {
      console.warn('TimerSlave: BroadcastChannel no disponible:', error)
    }

    // 🔄 INICIALIZACIÓN: Obtener estado inicial del timerCore
    try {
      const initialState = timerCore.getState()
      updateStateFromBroadcast(initialState)
      console.log('TimerSlave: Estado inicial obtenido del timerCore')
    } catch (error) {
      console.warn('TimerSlave: Error obteniendo estado inicial del timerCore:', error)
    }

    return () => {
      isActive = false
      
      console.log('TimerSlave: Iniciando cleanup de BroadcastChannel')
      
      if (channelRef.current) {
        channelRef.current.close()
        console.log('TimerSlave: BroadcastChannel - 🧹 Limpiada')
      }
      
      console.log('TimerSlave: Cleanup completo - BroadcastChannel desconectado')
    }
  }, [updateStateFromBroadcast])

  // Formatear tiempo en formato MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Determinar color del indicador de estado
  const getStatusColor = () => {
    if (!syncStatus.isHealthy) return 'bg-red-100 border-red-200 text-red-800'
    return 'bg-blue-100 border-blue-200 text-blue-800'
  }

  const getStatusIcon = () => {
    if (!syncStatus.isHealthy) return '🔴'
    return '🔵'
  }

  const getSourceDescription = () => {
    switch (syncStatus.source) {
      case 'broadcast':
        return 'BroadcastChannel (multi-pestaña)'
      default:
        return 'Sin sincronización activa'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl text-center">
        
        {/* Status de sincronización */}
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
            <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-mono">
              Broadcast Only
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

        {/* Información de arquitectura simplificada */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-900 mb-2">🌐 Arquitectura Simplificada</h4>
          <div className="text-blue-800 text-sm space-y-1">
            <div>🌐 <strong>BroadcastChannel:</strong> Sincronización multi-pestaña única</div>
            <div>🎯 <strong>Sin competencia:</strong> Una sola fuente de verdad</div>
            <div>⚡ <strong>Máxima estabilidad:</strong> Sin oscilación</div>
          </div>
          <div className="mt-3 text-xs text-blue-700">
            💡 Los controles están disponibles en la ventana principal de gestión de actividades.
          </div>
        </div>
      </div>
    </div>
  )
}