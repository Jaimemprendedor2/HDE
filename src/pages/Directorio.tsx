import React, { useEffect, useRef, useState } from 'react'
import { timerCore, TimerCoreState } from '../lib/timerCore'

export const Directorio: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerCoreState>({
    running: false,
    remainingSeconds: 0,
    currentStageIndex: 0,
    adjustments: 0
  })
  
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const animationFrameRef = useRef<number>()

  // Conectar al timerCore al montar
  useEffect(() => {
    // Suscribirse a cambios de estado del TimerCore
    unsubscribeRef.current = timerCore.subscribe((state) => {
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

  // Formatear tiempo restante
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handlers de control del cronómetro
  const handleStart = () => {
    timerCore.start()
  }

  const handlePause = () => {
    timerCore.pause()
  }

  const handleReset = () => {
    timerCore.reset()
  }

  // Abrir ventana espejo del cronómetro
  const handleOpenTimerWindow = () => {
    const timerUrl = '/meeting'
    const windowName = 'HousenovoDirectoriosTimer'
    
    // Configuración para ventana normal (no popup)
    const features = 'width=1200,height=800,menubar=yes,toolbar=yes,location=yes,scrollbars=yes,resizable=yes'
    
    try {
      const timerWindow = window.open(timerUrl, windowName, features)
      
      if (!timerWindow) {
        alert('No se pudo abrir la ventana del cronómetro. Verifica que los popups estén permitidos.')
        return
      }
      
      // Verificar si la ventana se cerró inmediatamente (bloqueo de popup)
      setTimeout(() => {
        if (timerWindow.closed) {
          alert('La ventana del cronómetro fue bloqueada. Por favor, permite ventanas emergentes para este sitio.')
        }
      }, 100)
      
    } catch (error) {
      console.error('Error abriendo ventana del cronómetro:', error)
      alert('Error al abrir la ventana del cronómetro.')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Directorio Empresarial
      </h1>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Información del cronómetro */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Cronómetro de Actividad
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div 
                className={`text-6xl font-mono font-bold mb-4 transition-colors duration-300 ${
                  timerState.running ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                {formatTime(timerState.remainingSeconds)}
              </div>
              
              <div className="flex items-center justify-center space-x-2 mb-4">
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
          </div>

          {/* Controles del cronómetro */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={handleStart}
              disabled={timerState.running}
              className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                timerState.running
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Iniciar
              </span>
            </button>
            
            <button
              onClick={handlePause}
              disabled={!timerState.running}
              className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                !timerState.running
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pausar
              </span>
            </button>
            
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all transform hover:scale-105"
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
              </span>
            </button>
          </div>

          {/* Botón para abrir ventana espejo */}
          <div className="text-center">
            <button
              onClick={handleOpenTimerWindow}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
                Abrir Ventana Espejo
              </span>
            </button>
          </div>
        </div>

        {/* Información de gestión */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Gestión de Directorios
          </h3>
          
          <p className="text-gray-600 mb-6">
            Para crear y gestionar directorios empresariales, utiliza el flujo principal de la aplicación.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 <strong>Tip:</strong> Ve al inicio de la aplicación para seleccionar el tipo de actividad y crear un nuevo directorio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}