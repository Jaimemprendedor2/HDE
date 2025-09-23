// ===========================================
// EXPORTACIONES DE SERVICIOS
// ===========================================

// Cliente de Supabase
export { supabase, supabaseConfig, testSupabaseConnection, getSupabaseInfo } from './supabase'

// Tipos
export type * from './types'

// Servicios de participantes
export {
  listParticipants,
  createParticipant,
  bulkImportParticipants,
  getParticipant,
  updateParticipant,
  deleteParticipant,
  searchParticipants,
  getParticipantsStats,
} from './participants'

// Servicios de meeting participants
export {
  listByMeeting,
  addParticipantToMeeting,
  removeParticipantFromMeeting,
  updateParticipantStatus,
  getMeetingParticipant,
  listActiveParticipantsByMeeting,
  listInvitedParticipantsByMeeting,
  addMultipleParticipantsToMeeting,
  getMeetingParticipantsStats,
} from './meetingParticipants'

// Servicios de sesiones
export {
  startActiveSession,
  getActiveSession,
  endActiveSession,
  listSessionsByMeeting,
  getSession,
  updateSession,
  cancelSession,
  listSessionsByType,
  listSessionsByStatus,
  getSessionStats,
} from './sessions'

// Servicios de asistencia
export {
  setAttendanceStatus,
  getAttendanceStatus,
  listSessionAttendance,
  getSessionAttendanceStats,
  updateAttendanceNote,
  checkInParticipant,
  checkOutParticipant,
  listAbsentParticipants,
  listPresentParticipants,
  getParticipantAttendanceHistory,
  deleteAttendanceRecord,
} from './attendance'

// Servicios de notas
export {
  upsertNote,
  listBySession as listNotesBySession,
  getNote,
  updateNote,
  deleteNote,
  listNotesByCreator,
  searchNotes,
  getSessionNotesStats,
  duplicateNote,
  getLatestNote,
} from './notes'

// Servicios de evaluaciones
export {
  createEvaluation,
  listBySession as listEvaluationsBySession,
  getEvaluation,
  updateEvaluation,
  deleteEvaluation,
  listByEvaluator,
  listByParticipant,
  getSessionEvaluationStats,
  getParticipantAverageScores,
  searchEvaluationsByComments,
  getLowScoreEvaluations,
  getHighScoreEvaluations,
} from './evaluations'
