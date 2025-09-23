import React, { useState, useEffect } from 'react'
import { 
  listByMeeting, 
  listActiveParticipantsByMeeting 
} from '../services/meetingParticipants'
import { 
  setAttendanceStatus, 
  listSessionAttendance, 
  getSessionAttendanceStats 
} from '../services/attendance'
import { startActiveSession } from '../services/sessions'
import { ParticipantsCsvImport } from './ParticipantsCsvImport'
import type { 
  MeetingParticipant, 
  AttendanceStatus, 
  SessionType 
} from '../services/types'

interface AttendanceListProps {
  meetingId: string
  sessionId?: string
  isSessionActive: boolean
  onSessionStarted?: (sessionId: string) => void
}

interface ParticipantWithAttendance extends MeetingParticipant {
  participant?: {
    full_name: string
    email: string
    phone?: string
    venture_name?: string
    venture_code?: string
  }
  attendance?: {
    status: AttendanceStatus
    check_in_at?: string
    note?: string
  }
}

export const AttendanceList: React.FC<AttendanceListProps> = ({
  meetingId,
  sessionId,
  isSessionActive,
  onSessionStarted
}) => {
  const [participants, setParticipants] = useState<ParticipantWithAttendance[]>([])
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    punctualityRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('directorio')
  const [activityCode, setActivityCode] = useState('')

  // Cargar participantes y asistencia
  useEffect(() => {
    loadParticipantsAndAttendance()
  }, [meetingId, sessionId])

  const loadParticipantsAndAttendance = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar participantes activos de la reunión
      const participantsResult = await listActiveParticipantsByMeeting(meetingId)
      if (participantsResult.error) {
        setError(participantsResult.error)
        return
      }

      const participantsData = participantsResult.data || []
      let participantsWithAttendance: ParticipantWithAttendance[] = participantsData

      // Si hay sesión activa, cargar datos de asistencia
      if (isSessionActive && sessionId) {
        const attendanceResult = await listSessionAttendance(sessionId)
        if (attendanceResult.data) {
          // Mapear asistencia a participantes
          participantsWithAttendance = participantsData.map(participant => {
            const attendance = attendanceResult.data?.find(
              att => att.participant_id === participant.participant_id
            )
            return {
              ...participant,
              attendance: attendance ? {
                status: attendance.status,
                check_in_at: attendance.check_in_at,
                note: attendance.note
              } : undefined
            }
          })

          // Cargar estadísticas
          const statsResult = await getSessionAttendanceStats(sessionId)
          if (statsResult.data) {
            setAttendanceStats(statsResult.data)
          }
        }
      }

      setParticipants(participantsWithAttendance)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    participantId: string, 
    newStatus: AttendanceStatus
  ) => {
    if (!sessionId) return

    try {
      const result = await setAttendanceStatus(sessionId, participantId, newStatus)
      if (result.error) {
        setError(result.error)
        return
      }

      // Actualizar estado local
      setParticipants(prev => prev.map(p => 
        p.participant_id === participantId 
          ? {
              ...p,
              attendance: {
                status: newStatus,
                check_in_at: newStatus === 'present' || newStatus === 'late' 
                  ? new Date().toISOString() 
                  : undefined,
                note: p.attendance?.note
              }
            }
          : p
      ))

      // Recargar estadísticas
      const statsResult = await getSessionAttendanceStats(sessionId)
      if (statsResult.data) {
        setAttendanceStats(statsResult.data)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error actualizando estado')
    }
  }

  const handleStartSession = async () => {
    try {
      const result = await startActiveSession(
        meetingId,
        sessionType,
        activityCode || `ACT-${Date.now()}`,
        {
          title: `Sesión ${sessionType}`,
          description: `Sesión de ${sessionType} iniciada`,
          location: 'Sala de reuniones virtual'
        }
      )

      if (result.data) {
        onSessionStarted?.(result.data.id)
        setShowSessionModal(false)
        setActivityCode('')
        // Recargar datos
        await loadParticipantsAndAttendance()
      } else {
        setError(result.error || 'Error iniciando sesión')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error iniciando sesión')
    }
  }

  const handleImportComplete = (result: { success: number; errors: string[] }) => {
    // Recargar la lista de participantes después de la importación
    loadParticipantsAndAttendance()
    setShowImportModal(false)
  }

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return '✓'
      case 'late': return '⏰'
      case 'absent': return '✗'
      case 'excused': return '📋'
      default: return '○'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando participantes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isSessionActive) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay sesión activa
        </h3>
        <p className="text-gray-600 mb-4">
          Inicia una sesión para gestionar la asistencia de los participantes.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowSessionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Importar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Total</p>
              <p className="text-2xl font-bold text-blue-900">{attendanceStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Presentes</p>
              <p className="text-2xl font-bold text-green-900">{attendanceStats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">Tardanzas</p>
              <p className="text-2xl font-bold text-yellow-900">{attendanceStats.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">% Puntualidad</p>
              <p className="text-2xl font-bold text-purple-900">
                {attendanceStats.punctualityRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Participantes */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lista de Asistencia
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gestiona el estado de asistencia de los participantes
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {participants.map((participant) => (
            <li key={participant.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {participant.participant?.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {participant.participant?.full_name || 'Sin nombre'}
                        </p>
                        {participant.participant?.venture_code && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {participant.participant.venture_code}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {participant.participant?.email}
                        </p>
                        {participant.participant?.phone && (
                          <p className="text-sm text-gray-500 truncate">
                            {participant.participant.phone}
                          </p>
                        )}
                        {participant.participant?.venture_name && (
                          <p className="text-sm text-gray-500 truncate">
                            {participant.participant.venture_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Estado */}
                <div className="flex space-x-2 ml-4">
                  {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(participant.participant_id, status)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        participant.attendance?.status === status
                          ? getStatusColor(status)
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-1">{getStatusIcon(status)}</span>
                      {status === 'present' && 'Presente'}
                      {status === 'late' && 'Tarde'}
                      {status === 'absent' && 'Ausente'}
                      {status === 'excused' && 'Justificado'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Información adicional de asistencia */}
              {participant.attendance?.check_in_at && (
                <div className="mt-2 ml-14">
                  <p className="text-xs text-gray-500">
                    Check-in: {new Date(participant.attendance.check_in_at).toLocaleString()}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>

        {participants.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600">No hay participantes registrados para esta reunión.</p>
          </div>
        )}
      </div>

      {/* Modal para iniciar sesión */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Iniciar Nueva Sesión
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Sesión
                  </label>
                  <select
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value as SessionType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="predirectorio">Pre-Directorio</option>
                    <option value="directorio">Directorio</option>
                    <option value="coaching">Coaching</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Actividad (opcional)
                  </label>
                  <input
                    type="text"
                    value={activityCode}
                    onChange={(e) => setActivityCode(e.target.value)}
                    placeholder="Ej: ACT-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStartSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Importar Participantes desde CSV
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ParticipantsCsvImport
                onImportComplete={handleImportComplete}
                onClose={() => setShowImportModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
