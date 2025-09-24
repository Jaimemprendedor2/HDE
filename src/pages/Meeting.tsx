import React, { useEffect, useRef, useState } from 'react'
import { timerChannel, TimerState } from '../lib/timerChannel'

export const Meeting: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    elapsedMs: 0,
    running: false,
    timestamp: 0
  })
  
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const animationFrameRef = useRef<number>()

  // Conectar al timerChannel al montar
  useEffect(() => {
    // Conectar al canal del cronómetro
    timerChannel.connect()
    
    // Leer estado inicial para hidratación
    timerChannel.readInitialState()
    
    // Suscribirse a cambios de estado
    unsubscribeRef.current = timerChannel.onState((state) => {
      setTimerState(state)
    })

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Loop de actualización usando requestAnimationFrame
  useEffect(() => {
    const updateDisplay = () => {
      // El estado se actualiza automáticamente a través del callback
      // Solo necesitamos mantener el loop activo
      if (timerState.running) {
        animationFrameRef.current = requestAnimationFrame(updateDisplay)
      }
    }

    if (timerState.running) {
      animationFrameRef.current = requestAnimationFrame(updateDisplay)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [timerState.running])

  // Formatear tiempo transcurrido
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }

  // Calcular tiempo transcurrido en tiempo real
  const getCurrentElapsed = () => {
    if (!timerState.running) {
      return timerState.elapsedMs
    }
    
    // Usar el timestamp del timerChannel que ya está sincronizado
    const now = Date.now()
    const timeSinceLastUpdate = now - (timerState.timestamp || now)
    return timerState.elapsedMs + timeSinceLastUpdate
  }

  const currentElapsed = getCurrentElapsed()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div 
              className={`w-4 h-4 rounded-full transition-colors duration-300 ${
                timerState.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Cronómetro de Reunión
            </h1>
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
            }`}
          >
            {formatTime(currentElapsed)}
          </div>
          
          {/* Indicador de estado */}
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

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información del Cronómetro
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-left">
              <span className="text-gray-600">Estado:</span>
              <span className={`ml-2 font-medium ${
                timerState.running ? 'text-green-600' : 'text-gray-600'
              }`}>
                {timerState.running ? 'Ejecutándose' : 'Pausado'}
              </span>
            </div>
            
            <div className="text-left">
              <span className="text-gray-600">Tiempo transcurrido:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatTime(currentElapsed)}
              </span>
            </div>
            
            <div className="text-left">
              <span className="text-gray-600">Última actualización:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(timerState.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="text-left">
              <span className="text-gray-600">Sincronización:</span>
              <span className="ml-2 font-medium text-green-600">
                ✓ Activa
              </span>
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Vista espejo:</strong> Este cronómetro se sincroniza automáticamente con el cronómetro principal. 
            Los controles están disponibles en la ventana principal de gestión de actividades.
          </p>
        </div>
      </div>
    </div>
  )
}