import { supabase } from './supabase'
import type {
  ServiceResponse,
  Participant,
  CreateParticipantData,
  ParticipantSearchParams,
  BulkImportRow,
} from './types'

// ===========================================
// SERVICIO DE PARTICIPANTES
// ===========================================

/**
 * Lista todos los participantes con filtros opcionales
 */
export const listParticipants = async (
  searchParams?: ParticipantSearchParams
): Promise<ServiceResponse<Participant[]>> => {
  try {
    let query = supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros si se proporcionan
    if (searchParams?.search) {
      query = query.or(
        `full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,venture_name.ilike.%${searchParams.search}%`
      )
    }

    if (searchParams?.company) {
      query = query.eq('company', searchParams.company)
    }

    if (searchParams?.venture_name) {
      query = query.eq('venture_name', searchParams.venture_name)
    }

    if (searchParams?.role) {
      query = query.eq('role', searchParams.role)
    }

    const { data, error } = await query

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
 * Crea un nuevo participante
 */
export const createParticipant = async (
  participantData: CreateParticipantData
): Promise<ServiceResponse<Participant>> => {
  try {
    const { data, error } = await supabase
      .from('participants')
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
 * Importa múltiples participantes en lote
 */
export const bulkImportParticipants = async (
  rows: BulkImportRow[]
): Promise<ServiceResponse<{ success: number; errors: string[] }>> => {
  try {
    const errors: string[] = []
    let successCount = 0

    // Procesar cada fila individualmente para capturar errores específicos
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const { error } = await supabase
          .from('participants')
          .insert([row])

        if (error) {
          errors.push(`Fila ${i + 1}: ${error.message}`)
        } else {
          successCount++
        }
      } catch (rowError) {
        errors.push(
          `Fila ${i + 1}: ${
            rowError instanceof Error ? rowError.message : 'Error desconocido'
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
 * Obtiene un participante por ID
 */
export const getParticipant = async (
  id: string
): Promise<ServiceResponse<Participant>> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
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
 * Actualiza un participante
 */
export const updateParticipant = async (
  id: string,
  updates: Partial<CreateParticipantData>
): Promise<ServiceResponse<Participant>> => {
  try {
    const { data, error } = await supabase
      .from('participants')
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
 * Elimina un participante
 */
export const deleteParticipant = async (
  id: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('participants')
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
 * Busca participantes por texto
 */
export const searchParticipants = async (
  searchText: string
): Promise<ServiceResponse<Participant[]>> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .or(
        `full_name.ilike.%${searchText}%,email.ilike.%${searchText}%,venture_name.ilike.%${searchText}%,company.ilike.%${searchText}%`
      )
      .order('full_name')

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
 * Obtiene estadísticas de participantes
 */
export const getParticipantsStats = async (): Promise<
  ServiceResponse<{
    total: number
    by_company: Record<string, number>
    by_role: Record<string, number>
  }>
> => {
  try {
    const { data: participants, error } = await supabase
      .from('participants')
      .select('company, role')

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total: participants?.length || 0,
      by_company: {} as Record<string, number>,
      by_role: {} as Record<string, number>,
    }

    participants?.forEach((participant) => {
      if (participant.company) {
        stats.by_company[participant.company] =
          (stats.by_company[participant.company] || 0) + 1
      }
      if (participant.role) {
        stats.by_role[participant.role] =
          (stats.by_role[participant.role] || 0) + 1
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
