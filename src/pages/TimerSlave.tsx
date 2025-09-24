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
    adjustments: 0,
  })

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    source: 'none',
    lastUpdate: Date.now(),
    isHealthy: false,
    messageCount: 0,
    lastValidState: null,
  })

  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidStateRef = useRef<TimerCoreState | null>(null)
  const stateRequestTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 🎯 FUNCIÓN CENTRAL: Actualizar estado con DEBOUNCING y VALIDACIÓN
  const updateStateFromBroadcast = useCallback(
    (newState: TimerCoreState, source: 'broadcast') => {
      const now = Date.now()

      // 🔒 DEBOUNCING: Evitar actualizaciones múltiples en 100ms
      if (now - lastUpdateRef.current < 100) {
        console.log(
          'TimerSlave: Debouncing - Ignorando actualización muy rápida'
        )
        return
      }

      // ✅ VALIDACIÓN: Verificar que el estado es coherente
      if (
        !newState ||
        typeof newState.remainingSeconds !== 'number' ||
        newState.remainingSeconds < 0
      ) {
        console.log('TimerSlave: Estado inválido - Ignorando:', newState)
        return
      }

      // 🔍 VALIDACIÓN DE COHERENCIA: Comparar con último estado válido
      if (lastValidStateRef.current) {
        const timeDiff = Math.abs(
          newState.remainingSeconds - lastValidStateRef.current.remainingSeconds
        )
        const isRunning = newState.running
        const wasRunning = lastValidStateRef.current.running

        // Si está corriendo, el tiempo debe disminuir gradualmente
        if (isRunning && wasRunning && timeDiff > 5) {
          console.log('TimerSlave: Salto de tiempo sospechoso - Ignorando:', {
            previous: lastValidStateRef.current.remainingSeconds,
            current: newState.remainingSeconds,
            diff: timeDiff,
          })
          return
        }
      }

      // 🎯 ACTUALIZAR ESTADO
      setTimerState(prevState => {
        const hasChanged =
          prevState.running !== newState.running ||
          prevState.remainingSeconds !== newState.remainingSeconds ||
          prevState.currentStageIndex !== newState.currentStageIndex ||
          prevState.adjustments !== newState.adjustments

        if (hasChanged) {
          console.log(
            'TimerSlave: Estado actualizado desde BroadcastChannel:',
            newState
          )
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
        lastValidState: newState,
      }))
    },
    []
  )

  // 🚀 FUNCIÓN DE DEBOUNCING: Retrasar actualizaciones múltiples
  const debouncedUpdate = useCallback(
    (newState: TimerCoreState) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        updateStateFromBroadcast(newState, 'broadcast')
      }, 50) // Debounce de 50ms
    },
    [updateStateFromBroadcast]
  )

  // 🔄 FUNCIÓN: Solicitar estado actual del TimerCore
  const requestCurrentState = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'REQUEST_CURRENT_STATE',
        source: 'timerSlave',
        timestamp: Date.now(),
      })
      console.log('TimerSlave: Solicitando estado actual del TimerCore')
    }
  }, [])

  useEffect(() => {
    let isActive = true

    console.log(
      'TimerSlave: Inicializando BroadcastChannel MEJORADO con solicitud de estado'
    )

    // 🌐 BROADCASTCHANNEL CON TÉCNICAS AVANZADAS
    try {
      channelRef.current = new BroadcastChannel('timer-core-sync')
      channelRef.current.onmessage = event => {
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
      console.log('TimerSlave: BroadcastChannel MEJORADO - ✅ Inicializada')
    } catch (error) {
      console.warn('TimerSlave: BroadcastChannel no disponible:', error)
    }

    // 🔄 INICIALIZACIÓN MEJORADA: Múltiples estrategias para obtener estado
    const initializeState = async () => {
      try {
        // 1. Intentar obtener estado del timerCore directamente
        const initialState = timerCore.getState()
        if (initialState && initialState.remainingSeconds > 0) {
          updateStateFromBroadcast(initialState, 'broadcast')
          console.log('TimerSlave: Estado inicial obtenido del timerCore')
          return
        }

        // 2. Intentar cargar desde localStorage como respaldo
        const storedState = localStorage.getItem('timerCoreState')
        if (storedState) {
          try {
            const parsedState = JSON.parse(storedState)
            if (
              parsedState &&
              typeof parsedState === 'object' &&
              parsedState.remainingSeconds > 0
            ) {
              updateStateFromBroadcast(parsedState, 'broadcast')
              console.log(
                'TimerSlave: Estado inicial obtenido desde localStorage'
              )
              return
            }
          } catch (parseError) {
            console.warn(
              'TimerSlave: Error parseando estado desde localStorage:',
              parseError
            )
          }
        }

        // 3. Si no hay estado disponible, solicitar vía BroadcastChannel
        console.log('TimerSlave: No se encontró estado inicial, solicitando...')
        requestCurrentState()

        // 4. Reintentar después de un breve delay
        stateRequestTimeoutRef.current = setTimeout(() => {
          if (isActive) {
            console.log('TimerSlave: Reintentando obtener estado...')
            requestCurrentState()
          }
        }, 1000)
      } catch (error) {
        console.warn('TimerSlave: Error en inicialización de estado:', error)
        // Como último recurso, solicitar estado
        requestCurrentState()
      }
    }

    // Ejecutar inicialización
    initializeState()

    // 🏥 HEALTH CHECK MEJORADO: Verificar salud de la conexión
    const healthCheck = setInterval(() => {
      if (isActive) {
        const timeSinceLastUpdate = Date.now() - syncStatus.lastUpdate

        if (timeSinceLastUpdate > 5000) {
          setSyncStatus(prev => ({ ...prev, isHealthy: false }))
          console.log(
            'TimerSlave: Health check - Sin actualizaciones recientes, solicitando estado...'
          )
          // Si no hay actualizaciones recientes, solicitar estado nuevamente
          requestCurrentState()
        }
      }
    }, 2000)

    return () => {
      isActive = false

      console.log('TimerSlave: Iniciando cleanup de BroadcastChannel MEJORADO')

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      if (stateRequestTimeoutRef.current) {
        clearTimeout(stateRequestTimeoutRef.current)
      }

      if (channelRef.current) {
        channelRef.current.close()
        console.log('TimerSlave: BroadcastChannel - 🧹 Limpiada')
      }

      clearInterval(healthCheck)
      console.log(
        'TimerSlave: Cleanup completo - BroadcastChannel desconectado'
      )
    }
  }, [
    updateStateFromBroadcast,
    debouncedUpdate,
    syncStatus.lastUpdate,
    requestCurrentState,
  ])

  // Formatear tiempo en formato MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
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
    <div className='min-h-screen bg-black flex items-center justify-center p-4'>
      <div className='bg-black rounded-lg shadow-lg p-8 w-full max-w-2xl text-center'>
        {/* Status de sincronización */}
        <div
          className={`mb-6 p-4 rounded-lg border-2 transition-all duration-300 ${getStatusColor()} hidden`}
        >
          {' '}
          <div className='flex items-center justify-center space-x-2 mb-2'>
            <span className='text-2xl'>{getStatusIcon()}</span>
            <h4 className='font-bold text-lg'>Estado de Sincronización</h4>
          </div>
          <div className='text-sm font-medium'>
            <div>🔗 Fuente: {getSourceDescription()}</div>
            <div>
              ⏰ Última actualización:{' '}
              {new Date(syncStatus.lastUpdate).toLocaleTimeString()}
            </div>
            <div>
              🛡️ Estado:{' '}
              {syncStatus.isHealthy ? 'Saludable ✅' : 'Reconectando ⚠️'}
            </div>
            <div>📊 Mensajes recibidos: {syncStatus.messageCount}</div>
          </div>
        </div>

        {/* Header con indicador de estado del cronómetro */}
        <div className='mb-8 hidden'>
          {' '}
          <div className='flex items-center justify-center space-x-3 mb-4'>
            <div
              className={`w-6 h-6 rounded-full transition-colors duration-300 ${
                timerState.running
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-400'
              }`}
            />
            <h1 className='text-3xl font-bold text-white'>Cronómetro Slave</h1>
            <div className='text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-mono'>
              Broadcast MEJORADO
            </div>
          </div>
          <p className='text-gray-300'>
            {timerState.running
              ? 'Cronómetro en ejecución'
              : 'Cronómetro pausado'}
          </p>
        </div>

        {/* Display principal del tiempo */}
        <div className='mb-8'>
          <div
            className={`text-8xl font-mono font-bold mb-4 transition-colors duration-300 ${
              timerState.running ? 'text-green-400' : 'text-gray-300'
            } ${!syncStatus.isHealthy ? 'opacity-50' : ''}`}
          >
            {formatTime(timerState.remainingSeconds)}
          </div>

          {/* Indicador de estado visual */}
          <div className='hidden'>
            {' '}
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                timerState.running
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-400'
              }`}
            />
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                timerState.running ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              {timerState.running ? 'En ejecución' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Información detallada del estado */}
        <div className='bg-gray-800 rounded-lg p-6 mb-6 hidden'>
          {' '}
          <h3 className='text-lg font-semibold text-white mb-4'>
            Estado Completo del Cronómetro
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
            <div className='text-left'>
              <span className='text-gray-300'>Estado:</span>
              <span
                className={`ml-2 font-medium ${
                  timerState.running ? 'text-green-400' : 'text-gray-300'
                }`}
              >
                {timerState.running ? 'Ejecutándose' : 'Pausado'}
              </span>
            </div>

            <div className='text-left'>
              <span className='text-gray-300'>Tiempo restante:</span>
              <span className='ml-2 font-medium font-mono text-blue-400'>
                {formatTime(timerState.remainingSeconds)}
              </span>
            </div>

            <div className='text-left'>
              <span className='text-gray-300'>Etapa actual:</span>
              <span className='ml-2 font-medium text-orange-400'>
                #{timerState.currentStageIndex + 1}
              </span>
            </div>

            <div className='text-left'>
              <span className='text-gray-300'>Ajustes:</span>
              <span
                className={`ml-2 font-medium ${
                  timerState.adjustments === 0
                    ? 'text-gray-300'
                    : timerState.adjustments > 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {timerState.adjustments > 0 ? '+' : ''}
                {timerState.adjustments}s
              </span>
            </div>
          </div>
        </div>

        {/* Información de arquitectura MEJORADA */}
        <div className='bg-gray-800 border border-gray-600 rounded-lg p-4 hidden'>
          {' '}
          <h4 className='font-bold text-white mb-2'>
            🌐 BroadcastChannel MEJORADO
          </h4>
          <div className='text-gray-300 text-sm space-y-1'>
            <div>
              🔒 <strong>Debouncing:</strong> Evita actualizaciones múltiples
              (100ms)
            </div>
            <div>
              ✅ <strong>Validación:</strong> Solo estados coherentes y válidos
            </div>
            <div>
              🔍 <strong>Coherencia:</strong> Verifica saltos de tiempo
              sospechosos
            </div>
            <div>
              🏥 <strong>Health Check:</strong> Monitorea salud de la conexión
            </div>
            <div>
              📡 <strong>Solicitud de Estado:</strong> Solicita estado cuando se
              inicializa
            </div>
            <div>
              💾 <strong>Respaldo LocalStorage:</strong> Usa almacenamiento
              local como fallback
            </div>
          </div>
          <div className='mt-3 text-xs text-gray-400'>
            💡 Los controles están disponibles en la ventana principal de
            gestión de actividades.
          </div>
        </div>
      </div>
    </div>
  )
}
