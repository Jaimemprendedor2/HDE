import React, { useState, useEffect } from 'react'
import { 
  createEvaluation, 
  listBySession as listEvaluationsBySession,
  getSessionEvaluationStats 
} from '../services/evaluations'
import type { 
  SessionEvaluation, 
  EvaluationScores, 
  EvaluatorRole 
} from '../services/types'

interface SessionEvaluationFormProps {
  sessionId?: string
  isSessionActive: boolean
  currentUserId?: string
}

interface EvaluationFormData {
  score_overall: number
  score_listening: number
  score_feedback: number
  comments: string
}

interface EvaluationStats {
  total_responses: number
  average_overall: number
  average_listening: number
  average_feedback: number
  average_total: number
}

export const SessionEvaluationForm: React.FC<SessionEvaluationFormProps> = ({
  sessionId,
  isSessionActive,
  currentUserId = 'default-user'
}) => {
  const [formData, setFormData] = useState<EvaluationFormData>({
    score_overall: 3,
    score_listening: 3,
    score_feedback: 3,
    comments: ''
  })
  
  const [evaluations, setEvaluations] = useState<SessionEvaluation[]>([])
  const [stats, setStats] = useState<EvaluationStats>({
    total_responses: 0,
    average_overall: 0,
    average_listening: 0,
    average_feedback: 0,
    average_total: 0
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  // Cargar evaluaciones existentes
  useEffect(() => {
    if (sessionId && isSessionActive) {
      loadEvaluations()
    }
  }, [sessionId, isSessionActive])

  const loadEvaluations = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      setError(null)

      // Cargar evaluaciones
      const evaluationsResult = await listEvaluationsBySession(sessionId)
      if (evaluationsResult.error) {
        setError(evaluationsResult.error)
        return
      }

      setEvaluations(evaluationsResult.data || [])

      // Cargar estadísticas
      const statsResult = await getSessionEvaluationStats(sessionId)
      if (statsResult.data) {
        setStats(statsResult.data)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error cargando evaluaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (field: keyof EvaluationScores, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCommentsChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      comments: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sessionId) {
      setError('No hay sesión activa')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const scores: EvaluationScores = {
        score_overall: formData.score_overall,
        score_listening: formData.score_listening,
        score_feedback: formData.score_feedback
      }

      const result = await createEvaluation(
        sessionId,
        'coach' as EvaluatorRole,
        scores,
        formData.comments,
        undefined // participantId - evaluando la sesión en general
      )

      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess('Evaluación guardada exitosamente')
      
      // Limpiar formulario
      setFormData({
        score_overall: 3,
        score_listening: 3,
        score_feedback: 3,
        comments: ''
      })

      // Recargar datos
      await loadEvaluations()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error guardando evaluación')
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
    if (evaluations.length === 0) return

    const headers = [
      'Fecha',
      'Rol Evaluador',
      'Puntuación General',
      'Escucha Activa',
      'Retroalimentación',
      'Comentarios'
    ]

    const csvContent = [
      headers.join(','),
      ...evaluations.map(evaluation => [
        new Date(evaluation.created_at).toLocaleDateString('es-ES'),
        evaluation.evaluator_role,
        evaluation.score_overall,
        evaluation.score_listening,
        evaluation.score_feedback,
        `"${(evaluation.comments || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `evaluaciones_sesion_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    const labels = ['Muy Malo', 'Malo', 'Regular', 'Bueno', 'Excelente']
    return labels[score - 1] || 'N/A'
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
          Inicia una sesión para comenzar las evaluaciones.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowResults(false)}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            !showResults
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Nueva Evaluación
        </button>
        <button
          onClick={() => setShowResults(true)}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            showResults
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ver Resultados
        </button>
      </div>

      {!showResults ? (
        /* Formulario de Evaluación */
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Evaluación de Sesión
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Evalúa la calidad de la sesión en diferentes aspectos (1-5 escala)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Puntuación General */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puntuación General
                </label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <label key={score} className="flex items-center">
                      <input
                        type="radio"
                        name="score_overall"
                        value={score}
                        checked={formData.score_overall === score}
                        onChange={() => handleScoreChange('score_overall', score)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {score} - {getScoreLabel(score)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Escucha Activa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escucha Activa
                </label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <label key={score} className="flex items-center">
                      <input
                        type="radio"
                        name="score_listening"
                        value={score}
                        checked={formData.score_listening === score}
                        onChange={() => handleScoreChange('score_listening', score)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {score} - {getScoreLabel(score)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Retroalimentación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calidad de Retroalimentación
                </label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <label key={score} className="flex items-center">
                      <input
                        type="radio"
                        name="score_feedback"
                        value={score}
                        checked={formData.score_feedback === score}
                        onChange={() => handleScoreChange('score_feedback', score)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {score} - {getScoreLabel(score)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                  Comentarios Adicionales
                </label>
                <textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => handleCommentsChange(e.target.value)}
                  placeholder="Comparte observaciones, sugerencias o comentarios sobre la sesión..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    saving
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Guardando...' : 'Guardar Evaluación'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Vista de Resultados */
        <div className="space-y-6">
          {/* Estadísticas Generales */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Resultados de Evaluación
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Promedios y estadísticas de las evaluaciones
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={evaluations.length === 0}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    evaluations.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Exportar CSV
                </button>
              </div>
            </div>

            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando resultados...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{stats.total_responses}</div>
                    <div className="text-sm text-gray-500">Total Respuestas</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(stats.average_overall)}`}>
                      {stats.average_overall.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Puntuación General</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(stats.average_listening)}`}>
                      {stats.average_listening.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Escucha Activa</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(stats.average_feedback)}`}>
                      {stats.average_feedback.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">Retroalimentación</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Evaluaciones */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Evaluaciones Individuales
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Historial de todas las evaluaciones realizadas
              </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
              {evaluations.length > 0 ? (
                <div className="space-y-4">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {new Date(evaluation.created_at).toLocaleString('es-ES')}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {evaluation.evaluator_role}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-500">General</div>
                          <div className={`font-medium ${getScoreColor(evaluation.score_overall)}`}>
                            {evaluation.score_overall}/5
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Escucha</div>
                          <div className={`font-medium ${getScoreColor(evaluation.score_listening)}`}>
                            {evaluation.score_listening}/5
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Retroalimentación</div>
                          <div className={`font-medium ${getScoreColor(evaluation.score_feedback)}`}>
                            {evaluation.score_feedback}/5
                          </div>
                        </div>
                      </div>

                      {evaluation.comments && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-sm text-gray-700">
                            {evaluation.comments}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-600">
                    No hay evaluaciones registradas para esta sesión.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Completa una evaluación para ver los resultados aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mensajes de Estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Éxito</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
