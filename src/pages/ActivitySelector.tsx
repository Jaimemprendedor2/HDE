import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import type { SessionType } from '../services/types'

interface Meeting {
  id: string
  title: string
  description?: string
  start_date: string
  status: string
  session_type?: SessionType
  activity_code?: string
  created_at: string
}

export const ActivitySelector: React.FC = () => {
  const [selectedType, setSelectedType] = useState<SessionType | null>(null)
  const [existingMeetings, setExistingMeetings] = useState<Meeting[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Cargar actividades existentes al montar el componente
  useEffect(() => {
    loadExistingMeetings()
  }, [])

  const loadExistingMeetings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          description,
          start_date,
          status,
          meeting_sessions!inner (
            session_type,
            activity_code
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Aplanar los datos para facilitar el uso
      const meetings = data?.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        start_date: meeting.start_date,
        status: meeting.status,
        session_type: meeting.meeting_sessions[0]?.session_type,
        activity_code: meeting.meeting_sessions[0]?.activity_code,
        created_at: meeting.created_at
      })) || []

      setExistingMeetings(meetings)
    } catch (err) {
      console.error('Error cargando reuniones:', err)
      setError('Error al cargar las actividades existentes')
    } finally {
      setLoading(false)
    }
  }

  const handleTypeSelect = (type: SessionType) => {
    setSelectedType(type)
    setError(null)
  }

  const handleCreateNew = () => {
    if (!selectedType) {
      setError('Por favor selecciona un tipo de actividad')
      return
    }
    setShowCreateForm(true)
  }

  const handleSelectExisting = (meetingId: string) => {
    // Navegar directamente a la pantalla principal con la reunión seleccionada
    navigate(`/activity/${meetingId}`)
  }

  const getTypeInfo = (type: SessionType) => {
    switch (type) {
      case 'predirectorio':
        return {
          title: 'Pre-Directorio',
          description: 'Sesión preparatoria para conocer a los participantes y establecer conexiones iniciales.',
          icon: '🤝',
          color: 'bg-blue-500',
          hoverColor: 'hover:bg-blue-600'
        }
      case 'directorio':
        return {
          title: 'Directorio',
          description: 'Sesión principal de presentaciones, networking y desarrollo de negocios.',
          icon: '💼',
          color: 'bg-green-500',
          hoverColor: 'hover:bg-green-600'
        }
      case 'coaching':
        return {
          title: 'Jornada de Coaching Empresarial',
          description: 'Sesión de coaching especializada para desarrollo empresarial y estratégico.',
          icon: '🎯',
          color: 'bg-purple-500',
          hoverColor: 'hover:bg-purple-600'
        }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Programada', color: 'bg-gray-100 text-gray-800' },
      active: { label: 'Activa', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (showCreateForm) {
    return <CreateActivityForm type={selectedType!} onCancel={() => setShowCreateForm(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Housenovo Directorios Empresariales
          </h1>
          <p className="text-lg text-gray-600">
            Selecciona el tipo de actividad que deseas gestionar
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Type Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Selecciona el tipo de actividad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['predirectorio', 'directorio', 'coaching'] as SessionType[]).map(type => {
              const info = getTypeInfo(type)
              const isSelected = selectedType === type
              
              return (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">{info.icon}</span>
                    <h3 className="text-lg font-medium text-gray-900">
                      {info.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {info.description}
                  </p>
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        {selectedType && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. ¿Qué deseas hacer?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCreateNew}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Crear Nueva Actividad
              </button>
            </div>
          </div>
        )}

        {/* Existing Activities */}
        {selectedType && existingMeetings.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Actividades existentes de {getTypeInfo(selectedType).title}
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {existingMeetings
                    .filter(meeting => meeting.session_type === selectedType)
                    .map(meeting => (
                    <div
                      key={meeting.id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleSelectExisting(meeting.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {meeting.title}
                            </h3>
                            {getStatusBadge(meeting.status)}
                            {meeting.activity_code && (
                              <span className="text-sm text-gray-500 font-mono">
                                {meeting.activity_code}
                              </span>
                            )}
                          </div>
                          {meeting.description && (
                            <p className="text-gray-600 mb-2">{meeting.description}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Fecha: {new Date(meeting.start_date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="ml-4">
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  {existingMeetings.filter(meeting => meeting.session_type === selectedType).length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      No hay actividades de tipo {getTypeInfo(selectedType).title} aún.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente separado para el formulario de creación
interface CreateActivityFormProps {
  type: SessionType
  onCancel: () => void
}

const CreateActivityForm: React.FC<CreateActivityFormProps> = ({ type, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    activityCode: `${type.toUpperCase()}-${Date.now().toString().slice(-6)}`
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('El nombre de la actividad es requerido')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Crear el meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: formData.title,
          description: formData.description,
          start_date: formData.date,
          status: 'scheduled'
        })
        .select()
        .single()

      if (meetingError) throw meetingError

      // 2. Crear la sesión
      const { data: session, error: sessionError } = await supabase
        .from('meeting_sessions')
        .insert({
          meeting_id: meeting.id,
          title: formData.title,
          description: formData.description,
          start_time: new Date().toISOString(),
          session_type: type,
          activity_code: formData.activityCode,
          status: 'scheduled'
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // 3. Crear etapas por defecto usando la función de la base de datos
      const { error: stagesError } = await supabase
        .rpc('create_default_stages', {
          p_meeting_id: meeting.id,
          p_session_type: type
        })

      if (stagesError) throw stagesError

      // Navegar a la pantalla principal
      navigate(`/activity/${meeting.id}`)
    } catch (err) {
      console.error('Error creando actividad:', err)
      setError('Error al crear la actividad. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const getTypeInfo = (type: SessionType) => {
    switch (type) {
      case 'predirectorio': return { title: 'Pre-Directorio', icon: '🤝' }
      case 'directorio': return { title: 'Directorio', icon: '💼' }
      case 'coaching': return { title: 'Jornada de Coaching Empresarial', icon: '🎯' }
    }
  }

  const typeInfo = getTypeInfo(type)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <button
              onClick={onCancel}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">{typeInfo.icon}</span>
                Crear Nueva {typeInfo.title}
              </h1>
              <p className="text-gray-600">
                Completa la información para crear una nueva actividad
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Actividad *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Directorio Empresarial Noviembre 2024"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción detallada de la actividad..."
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="activityCode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Actividad
              </label>
              <input
                type="text"
                id="activityCode"
                value={formData.activityCode}
                onChange={(e) => setFormData(prev => ({ ...prev, activityCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                placeholder="CODIGO-ACTIVIDAD"
              />
              <p className="mt-1 text-sm text-gray-500">
                Código único para identificar esta actividad
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  'Crear Actividad'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
