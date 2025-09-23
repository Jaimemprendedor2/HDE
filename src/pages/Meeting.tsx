import React, { useCallback, useState, useEffect } from 'react'
import { useTimerStore } from '../stores/timer'
import { useTimerKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { syncChannel } from '../services/syncChannel'
import type { ControlAction, TimerMessage } from '../types/timer'

export const Meeting: React.FC = () => {
  const [timerDisplay, setTimerDisplay] = useState('00:00')
  const [isRunning, setIsRunning] = useState(false)
  const timerStore = useTimerStore()

  // Hook para shortcuts de teclado
  const handleTimerControl = useCallback((action: ControlAction) => {
    timerStore.control(action)
  }, [timerStore])

  useTimerKeyboardShortcuts(handleTimerControl)

  // Sincronizar con el canal de comunicación
  useEffect(() => {
    const unsubscribe = syncChannel.subscribe((message: TimerMessage) => {
      if (message.type === 'SYNC_RESPONSE' && message.payload) {
        // Aplicar estado sincronizado
        timerStore.hydrate(message.payload)
      }
    })

    return unsubscribe
  }, [timerStore])

  // Actualizar display del timer
  useEffect(() => {
    const updateDisplay = () => {
      const remainingMs = timerStore.computeRemaining()
      const totalSeconds = Math.ceil(remainingMs / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      setTimerDisplay(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      setIsRunning(timerStore.isRunning)
    }

    // Actualizar inmediatamente
    updateDisplay()

    // Actualizar cada segundo
    const interval = setInterval(updateDisplay, 1000)

    return () => clearInterval(interval)
  }, [timerStore])

  // Solicitar sincronización al cargar
  useEffect(() => {
    syncChannel.requestSync()
  }, [])

  const handlePlayPause = () => {
    timerStore.control(isRunning ? 'PAUSE' : 'PLAY')
  }

  const handleReset = () => {
    timerStore.control('RESET')
  }

  const handleNext = () => {
    timerStore.control('NEXT')
  }

  const handlePrev = () => {
    timerStore.control('PREV')
  }

  const handleAdd30 = () => {
    timerStore.control('ADD30')
  }

  const handleSub30 = () => {
    timerStore.control('SUB30')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Timer de Reunión
      </h1>
      
      {/* Timer Display */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
            {timerDisplay}
          </div>
          
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={handlePlayPause}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? 'Pausar' : 'Iniciar'}
            </button>
            
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="flex justify-center space-x-2">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              ← Anterior
            </button>
            
            <button
              onClick={handleSub30}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            >
              -30s
            </button>
            
            <button
              onClick={handleAdd30}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
            >
              +30s
            </button>
            
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* Instrucciones de shortcuts */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">
          Atajos de Teclado
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Space</kbd>
            <span className="text-blue-800">Play/Pause</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">←</kbd>
            <span className="text-blue-800">Anterior</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">→</kbd>
            <span className="text-blue-800">Siguiente</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">+</kbd>
            <span className="text-blue-800">+30 segundos</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">-</kbd>
            <span className="text-blue-800">-30 segundos</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">R</kbd>
            <span className="text-blue-800">Reset</span>
          </div>
        </div>
      </div>
    </div>
  )
}
