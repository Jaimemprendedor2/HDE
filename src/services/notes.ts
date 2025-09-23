import { supabase } from './supabase'
import type {
  ServiceResponse,
  SessionNote,
  UpsertNoteData,
} from './types'

// ===========================================
// SERVICIO DE NOTAS DE SESIÓN
// ===========================================

/**
 * Crea o actualiza una nota de sesión
 */
export const upsertNote = async (
  sessionId: string,
  noteData: {
    title: string
    summary?: string
    decisions?: string
    followups?: string
    created_by: string
  }
): Promise<ServiceResponse<SessionNote>> => {
  try {
    const upsertData: UpsertNoteData = {
      session_id: sessionId,
      title: noteData.title,
      summary: noteData.summary,
      decisions: noteData.decisions,
      followups: noteData.followups,
      created_by: noteData.created_by,
    }

    // Intentar actualizar primero, si no existe, crear
    const { data: existingData } = await supabase
      .from('session_notes')
      .select('id')
      .eq('session_id', sessionId)
      .eq('created_by', noteData.created_by)
      .single()

    let result

    if (existingData) {
      // Actualizar nota existente
      const { data, error } = await supabase
        .from('session_notes')
        .update(upsertData)
        .eq('id', existingData.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Crear nueva nota
      const { data, error } = await supabase
        .from('session_notes')
        .insert([upsertData])
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
 * Lista todas las notas de una sesión
 */
export const listBySession = async (
  sessionId: string
): Promise<ServiceResponse<SessionNote[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
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
 * Obtiene una nota específica por ID
 */
export const getNote = async (
  noteId: string
): Promise<ServiceResponse<SessionNote>> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('id', noteId)
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
 * Actualiza una nota existente
 */
export const updateNote = async (
  noteId: string,
  updates: Partial<{
    title: string
    summary: string
    decisions: string
    followups: string
  }>
): Promise<ServiceResponse<SessionNote>> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .update(updates)
      .eq('id', noteId)
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
 * Elimina una nota
 */
export const deleteNote = async (
  noteId: string
): Promise<ServiceResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('session_notes')
      .delete()
      .eq('id', noteId)

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
 * Lista notas por creador
 */
export const listNotesByCreator = async (
  createdBy: string
): Promise<ServiceResponse<SessionNote[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('created_by', createdBy)
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
 * Busca notas por texto
 */
export const searchNotes = async (
  searchText: string
): Promise<ServiceResponse<SessionNote[]>> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .or(
        `title.ilike.%${searchText}%,summary.ilike.%${searchText}%,decisions.ilike.%${searchText}%,followups.ilike.%${searchText}%`
      )
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
 * Obtiene estadísticas de notas de una sesión
 */
export const getSessionNotesStats = async (
  sessionId: string
): Promise<
  ServiceResponse<{
    total_notes: number
    by_creator: Record<string, number>
    recent_notes: number
  }>
> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('created_by, created_at')
      .eq('session_id', sessionId)

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total_notes: data?.length || 0,
      by_creator: {} as Record<string, number>,
      recent_notes: 0,
    }

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    data?.forEach((note) => {
      // Contar por creador
      stats.by_creator[note.created_by] =
        (stats.by_creator[note.created_by] || 0) + 1

      // Contar notas recientes
      if (new Date(note.created_at) > oneWeekAgo) {
        stats.recent_notes++
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

/**
 * Duplica una nota a otra sesión
 */
export const duplicateNote = async (
  noteId: string,
  targetSessionId: string,
  createdBy: string
): Promise<ServiceResponse<SessionNote>> => {
  try {
    // Obtener la nota original
    const originalNoteResult = await getNote(noteId)
    if (originalNoteResult.error || !originalNoteResult.data) {
      return { data: null, error: originalNoteResult.error || 'Nota no encontrada' }
    }

    const originalNote = originalNoteResult.data

    // Crear nueva nota
    const { data, error } = await supabase
      .from('session_notes')
      .insert([
        {
          session_id: targetSessionId,
          title: `${originalNote.title} (Copia)`,
          summary: originalNote.summary,
          decisions: originalNote.decisions,
          followups: originalNote.followups,
          created_by: createdBy,
        },
      ])
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
 * Obtiene la última nota de una sesión
 */
export const getLatestNote = async (
  sessionId: string
): Promise<ServiceResponse<SessionNote | null>> => {
  try {
    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
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
