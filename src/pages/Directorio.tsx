import React, { useState, useEffect, useRef } from 'react'
import { SupabaseStatus } from '../components/SupabaseStatus'
import { AttendanceList } from '../components/AttendanceList'
import { SessionNotesEditor } from '../components/SessionNotesEditor'
import { SessionEvaluationForm } from '../components/SessionEvaluationForm'
import { StageColorConfig } from '../components/StageColorConfig'
import { openPopup, isPopupBlocked, buildTimerPopupUrl } from '../utils/popup'
import { syncChannel } from '../services/syncChannel'
import { startActiveSession, getActiveSession, endActiveSession } from '../services/sessions'
import { useTimerStore } from '../stores/timer'
import { useTimerKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import type { SessionType } from '../services/types'
import type { Stage, ControlAction } from '../types/timer'

export const Directorio: React.FC = () => {
  const [childWindow, setChildWindow] = useState<Window | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [showRetryBanner, setShowRetryBanner] = useState(false)
  const [activeTab, setActiveTab] = useState<'etapas' | 'asistencia' | 'notas' | 'evaluaciones' | 'configuracion'>('etapas')
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [meetingId] = useState('meeting-directorio-001') // ID de meeting de ejemplo
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
  const [stages] = useState<Stage[]>([
    { id: '1', title: 'Presentación', duration: 600, description: 'Presentación inicial de participantes' },
    { id: '2', title: 'Pitch Elevator', duration: 120, description: 'Pitch rápido de cada emprendedor' },
    { id: '3', title: 'Ronda de Preguntas', duration: 900, description: 'Preguntas y respuestas' },
    { id: '4', title: 'Feedback', duration: 600, description: 'Retroalimentación y comentarios' }
  ])
  const childWindowRef = useRef<Window | null>(null)
  const timerStore = useTimerStore()

  // Hook para shortcuts de teclado
  const handleTimerControl = useCallback((action: ControlAction) => {
    timerStore.control(action)
  }, [timerStore])

  useTimerKeyboardShortcuts(handleTimerControl)

  // Configurar syncChannel con la ventana hija
  useEffect(() => {
    syncChannel.setChildWindow(childWindow)
  }, [childWindow])

  // Verificar sesión activa al cargar
  useEffect(() => {
    const checkActiveSession = async () => {
      const result = await getActiveSession(meetingId)
      if (result.data) {
        setCurrentSession(result.data)
        setIsSessionActive(true)
      }
    }
    checkActiveSession()
  }, [meetingId])

  // Configurar syncChannel para manejar SYNC_REQUEST
  useEffect(() => {
    const unsubscribe = syncChannel.subscribe((message) => {
      if (message.type === 'SYNC_REQUEST') {
        // Responder con el estado actual del timer
        const syncResponse = timerStore.createSyncResponse()
        if (syncResponse) {
          syncChannel.publish(syncResponse)
        }
      }
    })

    return unsubscribe
  }, [timerStore])

  // Monitorear el estado de la ventana hija
  useEffect(() => {
    const checkWindowStatus = () => {
      if (childWindowRef.current && childWindowRef.current.closed) {
        setChildWindow(null)
        setChildWindow(childWindowRef.current = null)
        syncChannel.setChildWindow(null)
      }
    }

    const interval = setInterval(checkWindowStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleStartSession = async (sessionType: SessionType) => {
    try {
      const result = await startActiveSession(
        meetingId,
        sessionType,
        `ACT-${Date.now()}`,
        {
          title: `Sesión ${sessionType}`,
          description: `Sesión de ${sessionType} iniciada`,
          location: 'Sala de reuniones virtual'
        }
      )

      if (result.data) {
        setCurrentSession(result.data)
        setIsSessionActive(true)
        console.log('Sesión iniciada:', result.data)
      } else {
        console.error('Error iniciando sesión:', result.error)
      }
    } catch (error) {
      console.error('Error iniciando sesión:', error)
    }
  }

  const handleSessionStarted = (sessionId: string) => {
    // Recargar sesión activa cuando se inicia desde AttendanceList
    const reloadSession = async () => {
      const result = await getActiveSession(meetingId)
      if (result.data) {
        setCurrentSession(result.data)
        setIsSessionActive(true)
      }
    }
    reloadSession()
  }

  const handleEndSession = async () => {
    try {
      const result = await endActiveSession(meetingId)
      if (result.data) {
        setCurrentSession(null)
        setIsSessionActive(false)
        console.log('Sesión finalizada:', result.data)
      } else {
        console.error('Error finalizando sesión:', result.error)
      }
    } catch (error) {
      console.error('Error finalizando sesión:', error)
    }
  }

  const handleOpenReflejo = () => {
    // Construir URL para el popup del meeting
    const meetingUrl = buildTimerPopupUrl('/meeting', {
      mode: 'reflejo',
      timestamp: Date.now(),
      sessionId: currentSession?.id || ''
    })

    // Intentar abrir el popup
    const popup = openPopup(meetingUrl, 'HousenovoDirectoriosTimer')

    if (!popup || isPopupBlocked(popup)) {
      // Popup bloqueado
      setPopupBlocked(true)
      setShowRetryBanner(true)
      setChildWindow(null)
    } else {
      // Popup abierto exitosamente
      setPopupBlocked(false)
      setShowRetryBanner(false)
      setChildWindow(popup)
      childWindowRef.current = popup

      // Emitir mensaje INIT con estado actual del timer
      const initMessage = {
        type: 'INIT' as const,
        payload: {
          ...timerStore.createSyncResponse().payload,
          sessionId: currentSession?.id || '',
          meetingId: meetingId
        },
        v: 'v1' as const
      }
      syncChannel.publish(initMessage)

      // Configurar eventos para detectar cierre de ventana
      const checkClosed = () => {
        if (popup.closed) {
          setChildWindow(null)
          childWindowRef.current = null
          syncChannel.setChildWindow(null)
        } else {
          setTimeout(checkClosed, 1000)
        }
      }
      setTimeout(checkClosed, 1000)
    }
  }

  const handleRetry = () => {
    setShowRetryBanner(false)
    handleOpenReflejo()
  }

  const handleDismissBanner = () => {
    setShowRetryBanner(false)
  }

  const handleStageSelect = (stage: Stage) => {
    setSelectedStage(stage)
  }

  const handleStageUpdate = (updatedStage: Stage) => {
    // Aquí se podría actualizar el estado de las etapas
    console.log('Etapa actualizada:', updatedStage)
  }

  const handleStageSave = (stage: Stage) => {
    // Aquí se podría guardar la configuración de la etapa
    console.log('Etapa guardada:', stage)
    setSelectedStage(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Directorio Empresarial
      </h1>
      
      {/* Estado de Supabase */}
      <div className="mb-6">
        <SupabaseStatus />
      </div>
      
      {/* Banner de error para popups bloqueados */}
      {showRetryBanner && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Popup bloqueado
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Por favor, permite popups para este sitio y reintenta.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRetry}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={handleDismissBanner}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles de Sesión */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Sesión
          </h2>
          {currentSession && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Sesión activa: {currentSession.session_type}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          {!isSessionActive ? (
            <>
              <button
                onClick={() => handleStartSession('predirectorio')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Iniciar Pre-Directorio
              </button>
              <button
                onClick={() => handleStartSession('directorio')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Iniciar Directorio
              </button>
              <button
                onClick={() => handleStartSession('coaching')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Iniciar Coaching
              </button>
            </>
          ) : (
            <button
              onClick={handleEndSession}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Finalizar Sesión
            </button>
          )}
        </div>

        {/* Controles del Timer */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Controles del Timer
          </h3>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleOpenReflejo}
              disabled={childWindow !== null || !isSessionActive}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                childWindow !== null || !isSessionActive
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {childWindow !== null ? (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Reflejo Abierto
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                  Abrir Reflejo
                </span>
              )}
            </button>

            {childWindow && (
              <button
                onClick={() => {
                  if (childWindow && !childWindow.closed) {
                    childWindow.close()
                  }
                  setChildWindow(null)
                  childWindowRef.current = null
                  syncChannel.setChildWindow(null)
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar Reflejo
              </button>
            )}
          </div>

          {childWindow && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                <span className="font-medium">Estado:</span> Ventana de reflejo conectada y sincronizada.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sistema de Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Navegación de Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'etapas', label: 'Etapas', icon: '📋' },
              { id: 'asistencia', label: 'Asistencia', icon: '👥' },
              { id: 'notas', label: 'Notas', icon: '📝' },
              { id: 'evaluaciones', label: 'Evaluaciones', icon: '⭐' },
              { id: 'configuracion', label: 'Configuración', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de los Tabs */}
        <div className="p-6">
          {activeTab === 'etapas' && (
            <div className="space-y-6">
              {!selectedStage ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Etapas del Directorio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stages.map((stage) => (
                      <div key={stage.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => handleStageSelect(stage)}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{stage.title}</h4>
                          <span className="text-sm font-medium text-blue-600">
                            {Math.floor(stage.duration / 60)} min
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Duración: {stage.duration}s
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Configurar Colores →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <button
                        onClick={() => setSelectedStage(null)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
                      >
                        ← Volver a Etapas
                      </button>
                      <h3 className="text-lg font-medium text-gray-900">
                        Configuración: {selectedStage.title}
                      </h3>
                    </div>
                  </div>
                  
                  <StageColorConfig
                    stage={selectedStage}
                    onStageUpdate={handleStageUpdate}
                    onSave={handleStageSave}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'asistencia' && (
            <AttendanceList
              meetingId={meetingId}
              sessionId={currentSession?.id}
              isSessionActive={isSessionActive}
              onSessionStarted={handleSessionStarted}
            />
          )}

          {activeTab === 'notas' && (
            <SessionNotesEditor
              sessionId={currentSession?.id}
              isSessionActive={isSessionActive}
              currentUserId="current-user" // TODO: Obtener del contexto de autenticación
            />
          )}

          {activeTab === 'evaluaciones' && (
            <SessionEvaluationForm
              sessionId={currentSession?.id}
              isSessionActive={isSessionActive}
              currentUserId="current-user" // TODO: Obtener del contexto de autenticación
            />
          )}

          {activeTab === 'configuracion' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Configuración
              </h3>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
        <p className="text-gray-600">
                  Configuraciones del sistema y preferencias.
        </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información de shortcuts */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">
          Atajos de Teclado Disponibles
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Space</kbd>
            <span className="text-blue-800">Play/Pause Timer</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">←</kbd>
            <span className="text-blue-800">Etapa Anterior</span>
          </div>
          <div className="flex items-center space-x-2">
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">→</kbd>
            <span className="text-blue-800">Etapa Siguiente</span>
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
            <span className="text-blue-800">Reset Timer</span>
          </div>
        </div>
        <p className="text-sm text-blue-700 mt-3">
          Los atajos se desactivan automáticamente cuando escribes en campos de texto.
        </p>
      </div>
    </div>
  )
}
