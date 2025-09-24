import React, { useEffect, useState } from 'react'
import { timerCore, TimerCoreState } from '../lib/timerCore'

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

export const TimerMasterDebug: React.FC<TimerProps> = ({ stages, isSessionActive }) => {
  const [timerState, setTimerState] = useState<TimerCoreState>({
    running: false,
    remainingSeconds: 0,
    currentStageIndex: 0,
    adjustments: 0
  })
  
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      console.log('TimerMasterDebug: Inicializando...')
      
      // Suscribirse al timerCore
      const unsubscribe = timerCore.subscribe((state) => {
        console.log('TimerMasterDebug: Estado recibido:', state)
        setTimerState(state)
      })

      // Inicializar con la primera etapa
      if (stages.length > 0) {
        const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order)
        const firstStage = sortedStages[0]
        
        console.log('TimerMasterDebug: Inicializando con etapa:', firstStage)
        timerCore.updateCurrentStageIndex(0)
        timerCore.updateRemainingSeconds(firstStage.duration)
        timerCore.updateAdjustments(0)
      }

      return () => {
        console.log('TimerMasterDebug: Desconectando...')
        unsubscribe()
      }
    } catch (err) {
      console.error('TimerMasterDebug: Error:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }, [stages])

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Error en Timer Master
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Recargar página
        </button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Timer Master Debug
        </h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Estado del Timer Core:</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Running: {timerState.running ? 'Sí' : 'No'}</div>
            <div>Tiempo restante: {timerState.remainingSeconds}s</div>
            <div>Etapa actual: {timerState.currentStageIndex}</div>
            <div>Ajustes: {timerState.adjustments}s</div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Información de etapas:</h3>
          <div className="text-sm text-gray-700">
            <div>Total etapas: {stages.length}</div>
            {stages.length > 0 && (
              <div>Primera etapa: {stages[0]?.stage_name}</div>
            )}
          </div>
        </div>

        <div className="flex space-x-4 justify-center">
          <button 
            onClick={() => timerCore.start()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Iniciar
          </button>
          <button 
            onClick={() => timerCore.pause()}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Pausar
          </button>
          <button 
            onClick={() => timerCore.reset()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
