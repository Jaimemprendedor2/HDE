import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AttendanceList } from '../components/AttendanceList'
import { SessionEvaluationForm } from '../components/SessionEvaluationForm'
import { SessionNotesEditor } from '../components/SessionNotesEditor'
import { StageManager } from '../components/StageManager'
import { TimerMaster } from '../components/TimerMaster'
import { useTimerKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { supabase } from '../services/supabaseClient'
import { syncChannel } from '../services/syncChannel'
import type { SessionType } from '../services/types'
import { useTimerStore } from '../stores/timer'
import type { ControlAction } from '../types/timer'
import { buildTimerPopupUrl, openPopup } from '../utils/popup'

interface Meeting {
  id: string
  title: string
  description?: string
  start_date: string
  status: string
  created_at: string
}

interface Session {
  id: string
  meeting_id: string
  title: string
  description?: string
  session_type?: SessionType
  activity_code?: string
  status: string
  start_time: string
  end_time?: string
}

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

export const ActivityManager: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  
  // Estados principales
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'stages' | 'attendance' | 'notes' | 'evaluations'>('stages')
  const [showTimer, setShowTimer] = useState(false)
  const [childWindow, setChildWindow] = useState<Window | null>(null)
  const childWindowRef = useRef<Window | null>(null)
  
  // Timer store
  const timerStore = useTimerStore()

  // Hook para shortcuts de teclado
  const handleTimerControl = useCallback((action: ControlAction) => {
    timerStore.control(action)
  }, []) // Removido timerStore de las dependencias

  useTimerKeyboardShortcuts(handleTimerControl)

  // Configurar syncChannel con la ventana hija
  useEffect(() => {
    syncChannel.setChildWindow(childWindow)
  }, [childWindow])

  // Cargar datos al montar
  useEffect(() => {
    if (meetingId) {
      loadMeetingData()
    }
  }, [meetingId])

  // Configurar timer con etapas cuando se cargan
  useEffect(() => {
    if (stages.length > 0) {
      // Convertir etapas a formato del timer
      const timerStages = stages.map(stage => ({
        id: stage.id,
        title: stage.stage_name,
        duration: stage.duration,
        description: stage.description || ''
      }))
      
      timerStore.setStages(timerStages)
    }
  }, [stages]) // Removido timerStore de las dependencias

  // Configurar syncChannel para manejar SYNC_REQUEST
  useEffect(() => {
    const unsubscribe = syncChannel.subscribe((message) => {
      if (message.type === 'SYNC_REQUEST') {
        const syncResponse = timerStore.createSyncResponse()
        if (syncResponse) {
          syncChannel.publish(syncResponse)
        }
      }
    })

    return unsubscribe
  }, []) // Removido timerStore de las dependencias

  // Monitorear ventana hija
  useEffect(() => {
    const checkWindowStatus = () => {
      if (childWindowRef.current && childWindowRef.current.closed) {
        setChildWindow(null)
        childWindowRef.current = null
        syncChannel.setChildWindow(null)
      }
    }

    const interval = setInterval(checkWindowStatus, 1000)
    return () => clearInterval(interval)
  }, [])

  const loadMeetingData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!meetingId) {
        throw new Error('ID de reunión no proporcionado')
      }

      // Cargar meeting
      const { data: meetingData, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()

      if (meetingError) throw meetingError
      setMeeting(meetingData)

      // Cargar sesión activa
      const { data: sessionData, error: sessionError } = await supabase
        .from('meeting_sessions')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('status', 'active')
        .maybeSingle()

      if (sessionError) throw sessionError
      if (sessionData) {
        setSession(sessionData)
        setIsSessionActive(true)
      }

      // Cargar etapas
      const { data: stagesData, error: stagesError } = await supabase
        .rpc('get_meeting_stages_ordered', { p_meeting_id: meetingId })

      if (stagesError) throw stagesError
      setStages(stagesData || [])

      // Si hay sesión activa, inicializar cronómetro en primera etapa
      if (sessionData && stagesData && stagesData.length > 0) {
        const sortedStages = [...stagesData].sort((a, b) => a.stage_order - b.stage_order)
        const firstStage = sortedStages[0]
        
        // Importar timerCore dinámicamente
        import('../lib/timerCore').then(({ timerCore }) => {
          timerCore.updateCurrentStageIndex(0)
          timerCore.updateRemainingSeconds(firstStage.duration)
          timerCore.updateAdjustments(0)
          timerCore.pauseOnly() // Asegurar que esté en pausa
          console.log('ActivityManager: Sesión existente - Cronómetro inicializado en primera etapa:', firstStage.stage_name)
        })
      }

    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!meeting || !meetingId) return

    try {
      setError(null)
      
      // Crear nueva sesión activa
      const { data: sessionData, error: sessionError } = await supabase
        .from('meeting_sessions')
        .insert({
          meeting_id: meetingId,
          title: meeting.title,
          description: meeting.description,
          start_time: new Date().toISOString(),
          status: 'active',
          session_type: 'directorio', // Por defecto, se podría obtener del contexto
          activity_code: `ACT-${Date.now().toString().slice(-6)}`
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      setSession(sessionData)
      setIsSessionActive(true)

      // Activar timer
      setShowTimer(true)

      // Forzar cronómetro a primera etapa y pausa al iniciar directorio
      if (stages.length > 0) {
        const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order)
        const firstStage = sortedStages[0]
        
        // Importar timerCore dinámicamente para evitar dependencias circulares
        import('../lib/timerCore').then(({ timerCore }) => {
          timerCore.updateCurrentStageIndex(0)
          timerCore.updateRemainingSeconds(firstStage.duration)
          timerCore.updateAdjustments(0)
          timerCore.pauseOnly() // Asegurar que esté en pausa
          console.log('ActivityManager: Cronómetro inicializado en primera etapa:', firstStage.stage_name, 'duración:', firstStage.duration)
        })
      }

    } catch (err) {
      console.error('Error iniciando sesión:', err)
      setError('Error al iniciar la sesión')
    }
  }

  const handleEndSession = async () => {
    if (!session) return

    try {
      setError(null)

      const { error: sessionError } = await supabase
        .from('meeting_sessions')
        .update({
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', session.id)

      if (sessionError) throw sessionError

      setSession(null)
      setIsSessionActive(false)
      setShowTimer(false)

      // Detener timer
      timerStore.control('RESET')

    } catch (err) {
      console.error('Error finalizando sesión:', err)
      setError('Error al finalizar la sesión')
    }
  }

  const handleOpenTimerPopup = () => {
    if (!session) return

    const timerUrl = buildTimerPopupUrl('/timer-popup', {
      mode: 'popup',
      sessionId: session.id,
      meetingId: meetingId || '',
      timestamp: Date.now()
    })

    const popup = openPopup(timerUrl, 'HousenovoTimer', 800, 600)

    if (popup) {
      setChildWindow(popup)
      childWindowRef.current = popup

      // Emitir mensaje INIT
      const initMessage = {
        type: 'INIT' as const,
        payload: {
          ...timerStore.createSyncResponse().payload,
          sessionId: session.id,
          meetingId: meetingId || ''
        },
        v: 'v1' as const
      }
      
      setTimeout(() => {
        syncChannel.publish(initMessage)
      }, 1000)
    }
  }

  const getSessionTypeInfo = (type?: SessionType) => {
    if (!type) return { title: 'Actividad', icon: '📋' }
    
    switch (type) {
      case 'predirectorio': return { title: 'Pre-Directorio', icon: '🤝' }
      case 'directorio': return { title: 'Directorio', icon: '💼' }
      case 'coaching': return { title: 'Jornada de Coaching', icon: '🎯' }
      default: return { title: 'Actividad', icon: '📋' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-600">Cargando actividad...</p>
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la actividad'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  const sessionTypeInfo = getSessionTypeInfo(session?.session_type)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">{sessionTypeInfo.icon}</span>
                  {meeting.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Fecha: {new Date(meeting.start_date).toLocaleDateString('es-ES')}</span>
                  {session?.activity_code && (
                    <span className="font-mono">{session.activity_code}</span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isSessionActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isSessionActive ? 'Sesión Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isSessionActive ? (
                <>
                  <button
                    onClick={handleOpenTimerPopup}
                    disabled={childWindow !== null}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      childWindow !== null
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {childWindow ? 'Timer Abierto' : 'Abrir Timer'}
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Finalizar Sesión
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartSession}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Layout dividido: Timer arriba, tabs abajo */}
        <div className="space-y-6">
          {/* Timer Section */}
          {(showTimer || isSessionActive) && (
            <div className="bg-white rounded-lg shadow-md">
              <TimerMaster 
                stages={stages}
                isSessionActive={isSessionActive}
              />
            </div>
          )}

          {/* Tabs Section */}
          <div className="bg-white rounded-lg shadow-md">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'stages', label: 'Etapas', icon: '📋' },
                  { id: 'attendance', label: 'Asistencia', icon: '👥' },
                  { id: 'notes', label: 'Notas', icon: '📝' },
                  { id: 'evaluations', label: 'Evaluaciones', icon: '⭐' }
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

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'stages' && (
                <StageManager
                  meetingId={meetingId || ''}
                  stages={stages}
                  onStagesUpdate={setStages}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceList
                  meetingId={meetingId || ''}
                  sessionId={session?.id}
                  isSessionActive={isSessionActive}
                  onSessionStarted={() => {}}
                />
              )}

              {activeTab === 'notes' && (
                <SessionNotesEditor
                  sessionId={session?.id}
                  isSessionActive={isSessionActive}
                  currentUserId="current-user" // TODO: obtener del contexto
                />
              )}

              {activeTab === 'evaluations' && (
                <SessionEvaluationForm
                  sessionId={session?.id}
                  isSessionActive={isSessionActive}
                  currentUserId="current-user" // TODO: obtener del contexto
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
