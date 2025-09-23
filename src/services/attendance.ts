import { supabase } from './supabase'
import type {
  ServiceResponse,
  Attendance,
  SetAttendanceStatusData,
  AttendanceStatus,
  AttendanceStats,
} from './types'

// ===========================================
// SERVICIO DE ASISTENCIA
// ===========================================

/**
 * Establece el estado de asistencia de un participante en una sesión
 */
export const setAttendanceStatus = async (
  sessionId: string,
  participantId: string,
  status: AttendanceStatus,
  note?: string
): Promise<ServiceResponse<Attendance>> => {
  try {
    const attendanceData: SetAttendanceStatusData = {
      session_id: sessionId,
      participant_id: participantId,
      status,
      note,
      check_in_at: status === 'present' || status === 'late' ? new Date().toISOString() : undefined,
    }

    // Intentar actualizar primero, si no existe, crear
    const { data: existingData } = await supabase
      .from('session_attendance')
      .select('id')
      .eq('session_id', sessionId)
      .eq('participant_id', participantId)
      .single()

    let result

    if (existingData) {
      // Actualizar registro existente
      const { data, error } = await supabase
        .from('session_attendance')
        .update(attendanceData)
        .eq('id', existingData.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Crear nuevo registro
      const { data, error } = await supabase
        .from('session_attendance')
        .insert([attendanceData])
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      return { data: null, error: result.error.message }
    }

    return { data: result.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene el estado de asistencia de un participante en una sesión
 */
export const getAttendanceStatus = async (
  sessionId: string,
  participantId: string
): Promise<ServiceResponse<Attendance | null>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .eq('participant_id', participantId)
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
 * Lista toda la asistencia de una sesión
 */
export const listSessionAttendance = async (
  sessionId: string
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
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
 * Obtiene estadísticas de asistencia de una sesión
 */
export const getSessionAttendanceStats = async (
  sessionId: string
): Promise<ServiceResponse<AttendanceStats>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .select('status')
      .eq('session_id', sessionId)

    if (error) {
      return { data: null, error: error.message }
    }

    const stats: AttendanceStats = {
      total_participants: data?.length || 0,
      present_count: data?.filter((a) => a.status === 'present').length || 0,
      late_count: data?.filter((a) => a.status === 'late').length || 0,
      absent_count: data?.filter((a) => a.status === 'absent').length || 0,
      excused_count: data?.filter((a) => a.status === 'excused').length || 0,
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
 * Actualiza la nota de asistencia
 */
export const updateAttendanceNote = async (
  sessionId: string,
  participantId: string,
  note: string
): Promise<ServiceResponse<Attendance>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .update({ note })
      .eq('session_id', sessionId)
      .eq('participant_id', participantId)
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
 * Marca check-in de un participante
 */
export const checkInParticipant = async (
  sessionId: string,
  participantId: string,
  note?: string
): Promise<ServiceResponse<Attendance>> => {
  try {
    const result = await setAttendanceStatus(sessionId, participantId, 'present', note)
    return result
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Marca check-out de un participante
 */
export const checkOutParticipant = async (
  sessionId: string,
  participantId: string,
  note?: string
): Promise<ServiceResponse<Attendance>> => {
  try {
    const result = await setAttendanceStatus(sessionId, participantId, 'absent', note)
    return result
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Lista participantes ausentes de una sesión
 */
export const listAbsentParticipants = async (
  sessionId: string
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'absent')
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
 * Lista participantes presentes de una sesión
 */
export const listPresentParticipants = async (
  sessionId: string
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .select('*')
      .eq('session_id', sessionId)
      .in('status', ['present', 'late'])
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
 * Obtiene historial de asistencia de un participante
 */
export const getParticipantAttendanceHistory = async (
  participantId: string
): Promise<ServiceResponse<Attendance[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
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
 * Elimina un registro de asistencia
 */
export const deleteAttendanceRecord = async (
  sessionId: string,
  participantId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('session_attendance')
      .delete()
      .eq('session_id', sessionId)
      .eq('participant_id', participantId)

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
