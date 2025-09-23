import React, { useCallback, useEffect, useRef, useState } from 'react'
import { syncChannel } from '../services/syncChannel'
import { useTimerStore } from '../stores/timer'
import type { ControlAction, TimerMessage } from '../types/timer'

interface Stage {
  id: string
  meeting_id: string
  stage_name: string
  description?: string
  duration: number
  color_hex: string
  alert_color_hex: string
  stage_order: number
  status: string
  start_time?: string
  end_time?: string
}

interface TimerProps {
  stages: Stage[]
  isSessionActive: boolean
}

export const Timer: React.FC<TimerProps> = ({ stages, isSessionActive }) => {
  const [display, setDisplay] = useState('00:00')
  const [isRunning, setIsRunning] = useState(false)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isAlertPhase, setIsAlertPhase] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const timerStore = useTimerStore()
  const animationFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(Date.now())

  // Configurar etapas en el store cuando cambien
  useEffect(() => {
    if (stages.length > 0) {
      const timerStages = stages
        .sort((a, b) => a.stage_order - b.stage_order)
        .map(stage => ({
          id: stage.id,
          title: stage.stage_name,
          duration: stage.duration * 1000, // Convertir a ms
          description: stage.description || ''
        }))
      
      timerStore.setStages(timerStages)
    }
  }, [stages])

  // Sincronización con el canal de comunicación
  useEffect(() => {
    const unsubscribe = syncChannel.subscribe((message: TimerMessage) => {
      if (message.type === 'SYNC_RESPONSE' && message.payload) {
        timerStore.hydrate(message.payload)
      }
    })

    return unsubscribe
  }, [])

  // Función para actualizar el display del timer
  const updateDisplay = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastUpdateRef.current
    
    // Solo actualizar si ha pasado tiempo suficiente (evitar actualizaciones excesivas)
    if (elapsed < 100) {
      if (timerStore.isRunning) {
        animationFrameRef.current = requestAnimationFrame(updateDisplay)
      }
      return
    }

    lastUpdateRef.current = now

    // Obtener estado actual del timer
    const remainingMs = timerStore.computeRemaining()
    const currentStage = timerStore.getCurrentStage()
    const isTimerRunning = timerStore.isRunning

    // Actualizar display
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const displayText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    
    setDisplay(displayText)
    setIsRunning(isTimerRunning)

    // Actualizar índice de etapa actual
    if (currentStage && stages.length > 0) {
      const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order)
      const stageIndex = sortedStages.findIndex(s => s.id === currentStage.id)
      if (stageIndex !== -1) {
        setCurrentStageIndex(stageIndex)
      }
    }

    // Calcular progreso de la etapa actual
    if (currentStage) {
      const stageDurationMs = currentStage.duration
      const stageRemainingMs = remainingMs
      const stageElapsedMs = stageDurationMs - stageRemainingMs
      const stageProgress = Math.max(0, Math.min(100, (stageElapsedMs / stageDurationMs) * 100))
      setProgress(stageProgress)

      // Determinar si estamos en fase de alerta (últimos 30 segundos)
      setIsAlertPhase(stageRemainingMs <= 30000 && stageRemainingMs > 0)
    }

    // Continuar animación si el timer está corriendo
    if (isTimerRunning) {
      animationFrameRef.current = requestAnimationFrame(updateDisplay)
    }
  }, [])

  // Iniciar/detener loop de actualización
  useEffect(() => {
    if (isRunning) {
      lastUpdateRef.current = Date.now()
      animationFrameRef.current = requestAnimationFrame(updateDisplay)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Actualizar una vez más cuando se pausa
      updateDisplay()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRunning, updateDisplay])

  // Actualizar display inicial
  useEffect(() => {
    updateDisplay()
  }, [])

  // Controles del timer
  const handleControl = (action: ControlAction) => {
    timerStore.control(action)
  }

  const handlePlayPause = () => {
    handleControl(isRunning ? 'PAUSE' : 'PLAY')
  }

  const handleReset = () => {
    handleControl('RESET')
  }

  const handleNext = () => {
    handleControl('NEXT')
  }

  const handlePrev = () => {
    handleControl('PREV')
  }

  const handleAdd30 = () => {
    handleControl('ADD30')
  }

  const handleSub30 = () => {
    handleControl('SUB30')
  }

  // Obtener información de la etapa actual
  const getCurrentStageInfo = () => {
    if (stages.length === 0) return null
    const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order)
    return sortedStages[currentStageIndex] || sortedStages[0]
  }

  const currentStageInfo = getCurrentStageInfo()

  // Si no hay etapas, mostrar mensaje
  if (stages.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">⏱️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay etapas configuradas
        </h3>
        <p className="text-gray-600">
          Configura las etapas de tu actividad en la pestaña "Etapas" para poder usar el cronómetro.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header con información de la etapa */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ 
              backgroundColor: isAlertPhase 
                ? currentStageInfo?.alert_color_hex || '#EF4444'
                : currentStageInfo?.color_hex || '#3B82F6'
            }}
          />
          <h2 className="text-xl font-semibold text-gray-900">
            Etapa {currentStageIndex + 1}: {currentStageInfo?.stage_name || 'Sin nombre'}
          </h2>
        </div>
        {currentStageInfo?.description && (
          <p className="text-gray-600 text-sm">
            {currentStageInfo.description}
          </p>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progreso de la etapa</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: isAlertPhase 
                ? currentStageInfo?.alert_color_hex || '#EF4444'
                : currentStageInfo?.color_hex || '#3B82F6'
            }}
          />
        </div>
      </div>

      {/* Display principal del timer */}
      <div className="text-center mb-8">
        <div 
          className={`text-8xl font-mono font-bold mb-4 transition-colors duration-300 ${
            isAlertPhase ? 'text-red-600' : 'text-gray-900'
          }`}
        >
          {display}
        </div>
        
        {/* Controles principales */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handlePlayPause}
            disabled={!isSessionActive}
            className={`px-8 py-4 rounded-lg font-medium text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pausar
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Iniciar
              </span>
            )}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!isSessionActive}
            className="px-6 py-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-lg transition-all transform hover:scale-105"
          >
            <span className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Reset
            </span>
          </button>
        </div>

        {/* Controles secundarios */}
        <div className="flex justify-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={!isSessionActive || currentStageIndex === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            title="Etapa anterior"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={handleSub30}
            disabled={!isSessionActive}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            title="Restar 30 segundos"
          >
            -30s
          </button>
          
          <button
            onClick={handleAdd30}
            disabled={!isSessionActive}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            title="Agregar 30 segundos"
          >
            +30s
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isSessionActive || currentStageIndex >= stages.length - 1}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            title="Siguiente etapa"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Indicador de etapas */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Etapas de la actividad
        </h4>
        <div className="flex flex-wrap gap-2">
          {stages
            .sort((a, b) => a.stage_order - b.stage_order)
            .map((stage, index) => (
            <div
              key={stage.id}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                index === currentStageIndex
                  ? 'text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={index === currentStageIndex ? {
                backgroundColor: isAlertPhase 
                  ? stage.alert_color_hex 
                  : stage.color_hex
              } : {}}
            >
              <div className="flex items-center space-x-2">
                <span>{index + 1}</span>
                <span>{stage.stage_name}</span>
                <span className="text-xs opacity-75">
                  {Math.floor(stage.duration / 60)}:{(stage.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estado de sincronización */}
      {!isSessionActive && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">
              Inicia la sesión para activar el cronómetro
            </span>
          </div>
        </div>
      )}
    </div>
  )
}