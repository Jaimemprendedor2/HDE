import { supabase } from './supabase'
import type {
  ServiceResponse,
  Session,
  SessionType,
} from './types'

// ===========================================
// SERVICIO DE SESIONES
// ===========================================

/**
 * Inicia una sesión activa para una reunión
 */
export const startActiveSession = async (
  meetingId: string,
  sessionType: SessionType,
  activityCode?: string,
  additionalData?: {
    title?: string
    description?: string
    location?: string
    max_participants?: number
  }
): Promise<ServiceResponse<Session>> => {
  try {
    // Primero, finalizar cualquier sesión activa existente
    await endActiveSession(meetingId)

    const sessionData = {
      meeting_id: meetingId,
      title: additionalData?.title || `Sesión ${sessionType}`,
      description: additionalData?.description,
      start_time: new Date().toISOString(),
      status: 'active' as const,
      location: additionalData?.location,
      max_participants: additionalData?.max_participants,
      session_type: sessionType,
      activity_code: activityCode,
    }

    const { data, error } = await supabase
      .from('meeting_sessions')
      .insert([sessionData])
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
 * Obtiene la sesión activa de una reunión
 */
export const getActiveSession = async (
  meetingId: string
): Promise<ServiceResponse<Session | null>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle()

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
 * Finaliza la sesión activa de una reunión
 */
export const endActiveSession = async (
  meetingId: string
): Promise<ServiceResponse<Session | null>> => {
  try {
    // Buscar sesión activa
    const activeSessionResult = await getActiveSession(meetingId)
    if (activeSessionResult.error || !activeSessionResult.data) {
      return { data: null, error: activeSessionResult.error || 'No hay sesión activa' }
    }

    // Finalizar la sesión
    const { data, error } = await supabase
      .from('meeting_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
      })
      .eq('id', activeSessionResult.data.id)
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
 * Lista todas las sesiones de una reunión
 */
export const listSessionsByMeeting = async (
  meetingId: string
): Promise<ServiceResponse<Session[]>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('start_time', { ascending: false })

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
 * Obtiene una sesión por ID
 */
export const getSession = async (
  sessionId: string
): Promise<ServiceResponse<Session>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('id', sessionId)
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
 * Actualiza una sesión
 */
export const updateSession = async (
  sessionId: string,
  updates: Partial<{
    title: string
    description: string
    location: string
    max_participants: number
    session_type: SessionType
    activity_code: string
    status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  }>
): Promise<ServiceResponse<Session>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .update(updates)
      .eq('id', sessionId)
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
 * Cancela una sesión
 */
export const cancelSession = async (
  sessionId: string
): Promise<ServiceResponse<Session>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .update({
        status: 'cancelled',
        end_time: new Date().toISOString(),
      })
      .eq('id', sessionId)
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
 * Lista sesiones por tipo
 */
export const listSessionsByType = async (
  sessionType: SessionType
): Promise<ServiceResponse<Session[]>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('session_type', sessionType)
      .order('start_time', { ascending: false })

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
 * Lista sesiones por estado
 */
export const listSessionsByStatus = async (
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
): Promise<ServiceResponse<Session[]>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('*')
      .eq('status', status)
      .order('start_time', { ascending: false })

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
 * Obtiene estadísticas de sesiones de una reunión
 */
export const getSessionStats = async (
  meetingId: string
): Promise<
  ServiceResponse<{
    total: number
    active: number
    completed: number
    cancelled: number
    by_type: Record<SessionType, number>
  }>
> => {
  try {
    const { data, error } = await supabase
      .from('meeting_sessions')
      .select('status, session_type')
      .eq('meeting_id', meetingId)

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter((s) => s.status === 'active').length || 0,
      completed: data?.filter((s) => s.status === 'completed').length || 0,
      cancelled: data?.filter((s) => s.status === 'cancelled').length || 0,
      by_type: {
        predirectorio: 0,
        directorio: 0,
        coaching: 0,
      } as Record<SessionType, number>,
    }

    data?.forEach((session) => {
      if (session.session_type) {
        const type = session.session_type as SessionType
        if (type in stats.by_type) {
          stats.by_type[type]++
        }
      }
    })

    return { data: stats, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
