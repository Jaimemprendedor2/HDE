// ===========================================
// TIPOS PARA SERVICIOS DE SUPABASE
// ===========================================

// Tipo base para respuestas de servicios
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
}

// ===========================================
// TIPOS PARA PARTICIPANTS
// ===========================================

export interface Participant {
  id: string
  full_name: string
  email: string
  phone?: string
  venture_name?: string
  venture_code?: string
  company?: string
  role?: string
  created_at: string
}

export interface CreateParticipantData {
  full_name: string
  email: string
  phone?: string
  venture_name?: string
  venture_code?: string
  company?: string
  role?: string
}

export interface ParticipantSearchParams {
  search?: string
  company?: string
  venture_name?: string
  role?: string
}

export interface BulkImportRow {
  full_name: string
  email: string
  phone?: string
  venture_name?: string
  venture_code?: string
  company?: string
  role?: string
}

// ===========================================
// TIPOS PARA MEETING PARTICIPANTS
// ===========================================

export interface MeetingParticipant {
  id: string
  meeting_id: string
  participant_id: string
  invited: boolean
  active: boolean
  created_at: string
}

export interface AddParticipantToMeetingData {
  meeting_id: string
  participant_id: string
  invited?: boolean
  active?: boolean
}

// ===========================================
// TIPOS PARA SESSIONS
// ===========================================

export type SessionType = 'predirectorio' | 'directorio' | 'coaching'

export interface Session {
  id: string
  meeting_id: string
  title: string
  description?: string
  start_time: string
  end_time?: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  location?: string
  max_participants?: number
  session_type?: SessionType
  activity_code?: string
  created_at: string
  updated_at: string
}

export interface StartActiveSessionData {
  meeting_id: string
  session_type: SessionType
  activity_code?: string
  title?: string
  description?: string
  location?: string
  max_participants?: number
}

// ===========================================
// TIPOS PARA ATTENDANCE
// ===========================================

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused'

export interface Attendance {
  id: string
  session_id: string
  participant_id: string
  status: AttendanceStatus
  check_in_at?: string
  note?: string
  created_at: string
  updated_at: string
}

export interface SetAttendanceStatusData {
  session_id: string
  participant_id: string
  status: AttendanceStatus
  note?: string
  check_in_at?: string
}

// ===========================================
// TIPOS PARA NOTES
// ===========================================

export interface SessionNote {
  id: string
  session_id: string
  title: string
  summary?: string
  decisions?: string
  followups?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface UpsertNoteData {
  session_id: string
  title: string
  summary?: string
  decisions?: string
  followups?: string
  created_by: string
}

// ===========================================
// TIPOS PARA EVALUATIONS
// ===========================================

export type EvaluatorRole = 'coach' | 'participante' | 'coordinador'

export interface SessionEvaluation {
  id: string
  session_id: string
  participant_id?: string
  evaluator_role: EvaluatorRole
  score_overall: number
  score_listening: number
  score_feedback: number
  comments?: string
  created_at: string
}

export interface CreateEvaluationData {
  session_id: string
  participant_id?: string
  evaluator_role: EvaluatorRole
  score_overall: number
  score_listening: number
  score_feedback: number
  comments?: string
}

export interface EvaluationScores {
  score_overall: number
  score_listening: number
  score_feedback: number
}

// ===========================================
// TIPOS PARA ESTADÍSTICAS
// ===========================================

export interface AttendanceStats {
  total_participants: number
  present_count: number
  late_count: number
  absent_count: number
  excused_count: number
}

export interface SessionStats {
  session_id: string
  total_participants: number
  attendance_stats: AttendanceStats
  notes_count: number
  evaluations_count: number
}
