import { supabase } from './supabase'
import type {
  ServiceResponse,
  SessionEvaluation,
  CreateEvaluationData,
  EvaluatorRole,
  EvaluationScores,
} from './types'

// ===========================================
// SERVICIO DE EVALUACIONES DE SESIÓN
// ===========================================

/**
 * Crea una nueva evaluación de sesión
 */
export const createEvaluation = async (
  sessionId: string,
  evaluatorRole: EvaluatorRole,
  scores: EvaluationScores,
  comments?: string,
  participantId?: string
): Promise<ServiceResponse<SessionEvaluation>> => {
  try {
    const evaluationData: CreateEvaluationData = {
      session_id: sessionId,
      participant_id: participantId,
      evaluator_role: evaluatorRole,
      score_overall: scores.score_overall,
      score_listening: scores.score_listening,
      score_feedback: scores.score_feedback,
      comments,
    }

    const { data, error } = await supabase
      .from('session_evaluations')
      .insert([evaluationData])
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Lista todas las evaluaciones de una sesión
 */
export const listBySession = async (
  sessionId: string
): Promise<ServiceResponse<SessionEvaluation[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene una evaluación específica por ID
 */
export const getEvaluation = async (
  evaluationId: string
): Promise<ServiceResponse<SessionEvaluation>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Actualiza una evaluación existente
 */
export const updateEvaluation = async (
  evaluationId: string,
  updates: Partial<{
    score_overall: number
    score_listening: number
    score_feedback: number
    comments: string
  }>
): Promise<ServiceResponse<SessionEvaluation>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .update(updates)
      .eq('id', evaluationId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Elimina una evaluación
 */
export const deleteEvaluation = async (
  evaluationId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('session_evaluations')
      .delete()
      .eq('id', evaluationId)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: true, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Lista evaluaciones por evaluador
 */
export const listByEvaluator = async (
  evaluatorRole: EvaluatorRole
): Promise<ServiceResponse<SessionEvaluation[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .eq('evaluator_role', evaluatorRole)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Lista evaluaciones por participante
 */
export const listByParticipant = async (
  participantId: string
): Promise<ServiceResponse<SessionEvaluation[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene estadísticas de evaluaciones de una sesión
 */
export const getSessionEvaluationStats = async (
  sessionId: string
): Promise<
  ServiceResponse<{
    total_evaluations: number
    average_scores: {
      overall: number
      listening: number
      feedback: number
    }
    by_evaluator: Record<EvaluatorRole, number>
    score_distribution: Record<number, number>
  }>
> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('score_overall, score_listening, score_feedback, evaluator_role')
      .eq('session_id', sessionId)

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total_evaluations: data?.length || 0,
      average_scores: {
        overall: 0,
        listening: 0,
        feedback: 0,
      },
      by_evaluator: {
        coach: 0,
        participante: 0,
        coordinador: 0,
      } as Record<EvaluatorRole, number>,
      score_distribution: {} as Record<number, number>,
    }

    if (data && data.length > 0) {
      // Calcular promedios
      const totalOverall = data.reduce((sum, evaluation) => sum + evaluation.score_overall, 0)
      const totalListening = data.reduce((sum, evaluation) => sum + evaluation.score_listening, 0)
      const totalFeedback = data.reduce((sum, evaluation) => sum + evaluation.score_feedback, 0)

      stats.average_scores.overall = totalOverall / data.length
      stats.average_scores.listening = totalListening / data.length
      stats.average_scores.feedback = totalFeedback / data.length

      // Contar por evaluador
      data.forEach((evaluation) => {
        const role = evaluation.evaluator_role as EvaluatorRole
        if (role in stats.by_evaluator) {
          stats.by_evaluator[role]++
        }
      })

      // Distribución de scores
      data.forEach((evaluation) => {
        stats.score_distribution[evaluation.score_overall] =
          (stats.score_distribution[evaluation.score_overall] || 0) + 1
      })
    }

    return { data: stats, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene el promedio de evaluaciones de un participante
 */
export const getParticipantAverageScores = async (
  participantId: string
): Promise<
  ServiceResponse<{
    total_evaluations: number
    average_scores: {
      overall: number
      listening: number
      feedback: number
    }
    recent_trend: 'improving' | 'declining' | 'stable'
  }>
> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('score_overall, score_listening, score_feedback, created_at')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total_evaluations: data?.length || 0,
      average_scores: {
        overall: 0,
        listening: 0,
        feedback: 0,
      },
      recent_trend: 'stable' as 'improving' | 'declining' | 'stable',
    }

    if (data && data.length > 0) {
      // Calcular promedios
      const totalOverall = data.reduce((sum, evaluation) => sum + evaluation.score_overall, 0)
      const totalListening = data.reduce((sum, evaluation) => sum + evaluation.score_listening, 0)
      const totalFeedback = data.reduce((sum, evaluation) => sum + evaluation.score_feedback, 0)

      stats.average_scores.overall = totalOverall / data.length
      stats.average_scores.listening = totalListening / data.length
      stats.average_scores.feedback = totalFeedback / data.length

      // Determinar tendencia (comparar últimas 3 vs anteriores)
      if (data.length >= 6) {
        const recent = data.slice(0, 3)
        const previous = data.slice(3, 6)

        const recentAvg = recent.reduce((sum, evaluation) => sum + evaluation.score_overall, 0) / 3
        const previousAvg = previous.reduce((sum, evaluation) => sum + evaluation.score_overall, 0) / 3

        if (recentAvg > previousAvg + 0.5) {
          stats.recent_trend = 'improving'
        } else if (recentAvg < previousAvg - 0.5) {
          stats.recent_trend = 'declining'
        }
      }
    }

    return { data: stats, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Busca evaluaciones por comentarios
 */
export const searchEvaluationsByComments = async (
  searchText: string
): Promise<ServiceResponse<SessionEvaluation[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .ilike('comments', `%${searchText}%`)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene evaluaciones con scores bajos
 */
export const getLowScoreEvaluations = async (
  threshold: number = 3
): Promise<ServiceResponse<SessionEvaluation[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .or(`score_overall.lt.${threshold},score_listening.lt.${threshold},score_feedback.lt.${threshold}`)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene evaluaciones con scores altos
 */
export const getHighScoreEvaluations = async (
  threshold: number = 4
): Promise<ServiceResponse<SessionEvaluation[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_evaluations')
      .select('*')
      .or(`score_overall.gte.${threshold},score_listening.gte.${threshold},score_feedback.gte.${threshold}`)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
