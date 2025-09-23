import React, { useState, useEffect, useCallback } from 'react'
import { 
  upsertNote, 
  listBySession as listNotesBySession 
} from '../services/notes'
import type { SessionNote } from '../services/types'

interface SessionNotesEditorProps {
  sessionId?: string
  isSessionActive: boolean
  currentUserId?: string
}

interface NoteFormData {
  title: string
  summary: string
  decisions: string
  followups: string
}

export const SessionNotesEditor: React.FC<SessionNotesEditorProps> = ({
  sessionId,
  isSessionActive,
  currentUserId = 'default-user' // TODO: Obtener del contexto de autenticación
}) => {
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    summary: '',
    decisions: '',
    followups: ''
  })
  
  const [recentNotes, setRecentNotes] = useState<SessionNote[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Debounce timer para autosave
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Cargar notas recientes
  useEffect(() => {
    if (sessionId && isSessionActive) {
      loadRecentNotes()
    }
  }, [sessionId, isSessionActive])

  const loadRecentNotes = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const result = await listNotesBySession(sessionId)
      if (result.error) {
        setError(result.error)
        return
      }

      // Obtener las últimas 3 notas
      const notes = result.data || []
      setRecentNotes(notes.slice(0, 3))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error cargando notas')
    } finally {
      setLoading(false)
    }
  }

  // Autosave con debounce
  const autoSave = useCallback(async () => {
    if (!sessionId || !isSessionActive || !formData.title.trim()) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const result = await upsertNote(sessionId, {
        ...formData,
        created_by: currentUserId
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      // Recargar notas recientes
      await loadRecentNotes()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error guardando nota')
    } finally {
      setSaving(false)
    }
  }, [sessionId, isSessionActive, formData, currentUserId])

  // Manejar cambios en el formulario con debounce
  const handleFormChange = (field: keyof NoteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setHasUnsavedChanges(true)

    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Establecer nuevo timer para autosave
    const newTimer = setTimeout(() => {
      autoSave()
    }, 500)

    setDebounceTimer(newTimer)
  }

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIndicator = () => {
    if (saving) {
      return (
        <div className="flex items-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Guardando...</span>
        </div>
      )
    }

    if (lastSaved && !hasUnsavedChanges) {
      return (
        <div className="flex items-center text-green-600">
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Guardado {formatDate(lastSaved.toISOString())}</span>
        </div>
      )
    }

    if (hasUnsavedChanges) {
      return (
        <div className="flex items-center text-yellow-600">
          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Cambios sin guardar</span>
        </div>
      )
    }

    return null
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
        <p className="text-gray-600">
          Inicia una sesión para comenzar a tomar notas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Editor de Notas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Notas de Sesión
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Toma notas durante la sesión. Se guardan automáticamente.
              </p>
            </div>
            {getStatusIndicator()}
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <form className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Ej: Decisión sobre estrategia de marketing"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Resumen */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                Resumen
              </label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleFormChange('summary', e.target.value)}
                placeholder="Resumen de lo discutido en la sesión..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Decisiones */}
            <div>
              <label htmlFor="decisions" className="block text-sm font-medium text-gray-700 mb-1">
                Decisiones Tomadas
              </label>
              <textarea
                id="decisions"
                value={formData.decisions}
                onChange={(e) => handleFormChange('decisions', e.target.value)}
                placeholder="Lista las decisiones importantes tomadas..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Seguimientos */}
            <div>
              <label htmlFor="followups" className="block text-sm font-medium text-gray-700 mb-1">
                Acciones de Seguimiento
              </label>
              <textarea
                id="followups"
                value={formData.followups}
                onChange={(e) => handleFormChange('followups', e.target.value)}
                placeholder="Acciones pendientes y responsables..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
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
          )}
        </div>
      </div>

      {/* Notas Recientes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Notas Recientes
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Últimas 3 notas de esta sesión
          </p>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando notas...</span>
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {note.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.updated_at)}
                    </span>
                  </div>
                  
                  {note.summary && (
                    <p className="text-sm text-gray-600 mb-2">
                      {note.summary}
                    </p>
                  )}

                  {note.decisions && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Decisiones:</h5>
                      <p className="text-sm text-gray-600">
                        {note.decisions}
                      </p>
                    </div>
                  )}

                  {note.followups && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Seguimientos:</h5>
                      <p className="text-sm text-gray-600">
                        {note.followups}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-gray-600">
                No hay notas guardadas para esta sesión.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Comienza escribiendo arriba para crear tu primera nota.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
