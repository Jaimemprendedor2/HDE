import { supabase } from './supabase'
import type {
  ServiceResponse,
  MeetingParticipant,
  AddParticipantToMeetingData,
} from './types'

// ===========================================
// SERVICIO DE MEETING PARTICIPANTS
// ===========================================

/**
 * Lista todos los participantes de una reunión específica
 */
export const listByMeeting = async (
  meetingId: string
): Promise<ServiceResponse<MeetingParticipant[]>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId)
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
 * Agrega un participante a una reunión
 */
export const addParticipantToMeeting = async (
  meetingId: string,
  participantId: string,
  options?: { invited?: boolean; active?: boolean }
): Promise<ServiceResponse<MeetingParticipant>> => {
  try {
    const participantData: AddParticipantToMeetingData = {
      meeting_id: meetingId,
      participant_id: participantId,
      invited: options?.invited || false,
      active: options?.active !== false, // Por defecto true
    }

    const { data, error } = await supabase
      .from('meeting_participants')
      .insert([participantData])
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
 * Remueve un participante de una reunión
 */
export const removeParticipantFromMeeting = async (
  id: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('meeting_participants')
      .delete()
      .eq('id', id)

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
 * Actualiza el estado de un participante en una reunión
 */
export const updateParticipantStatus = async (
  id: string,
  updates: { invited?: boolean; active?: boolean }
): Promise<ServiceResponse<MeetingParticipant>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .update(updates)
      .eq('id', id)
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
 * Obtiene un participante específico de una reunión
 */
export const getMeetingParticipant = async (
  meetingId: string,
  participantId: string
): Promise<ServiceResponse<MeetingParticipant>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('participant_id', participantId)
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
 * Lista participantes activos de una reunión
 */
export const listActiveParticipantsByMeeting = async (
  meetingId: string
): Promise<ServiceResponse<MeetingParticipant[]>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('active', true)
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
 * Lista participantes invitados de una reunión
 */
export const listInvitedParticipantsByMeeting = async (
  meetingId: string
): Promise<ServiceResponse<MeetingParticipant[]>> => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('invited', true)
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
 * Agrega múltiples participantes a una reunión
 */
export const addMultipleParticipantsToMeeting = async (
  meetingId: string,
  participantIds: string[],
  options?: { invited?: boolean; active?: boolean }
): Promise<ServiceResponse<{ success: number; errors: string[] }>> => {
  try {
    const errors: string[] = []
    let successCount = 0

    for (const participantId of participantIds) {
      try {
        const result = await addParticipantToMeeting(
          meetingId,
          participantId,
          options
        )

        if (result.error) {
          errors.push(`Participante ${participantId}: ${result.error}`)
        } else {
          successCount++
        }
      } catch (error) {
        errors.push(
          `Participante ${participantId}: ${
            error instanceof Error ? error.message : 'Error desconocido'
          }`
        )
      }
    }

    return {
      data: { success: successCount, errors },
      error: errors.length > 0 ? `${errors.length} errores encontrados` : null,
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene estadísticas de participantes de una reunión
 */
export const getMeetingParticipantsStats = async (
  meetingId: string
): Promise<
  ServiceResponse<{
    total: number
    active: number
    invited: number
    inactive: number
  }>
> => {
  try {
    const { data, error } = await supabase
      .from('meeting_participants')
      .select('active, invited')
      .eq('meeting_id', meetingId)

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter((p) => p.active).length || 0,
      invited: data?.filter((p) => p.invited).length || 0,
      inactive: data?.filter((p) => !p.active).length || 0,
    }

    return { data: stats, error: null }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}
