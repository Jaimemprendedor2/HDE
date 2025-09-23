-- ===========================================
-- Housenovo Directorios Empresariales
-- Schema Core Migration (FIXED - Sin dependencias)
-- Fecha: 2025-09-22
-- ===========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. TABLA: participants
-- ===========================================
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    venture_name VARCHAR(255),
    venture_code VARCHAR(50) UNIQUE,
    company VARCHAR(255),
    role VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para participants
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_venture_code ON participants(venture_code);
CREATE INDEX idx_participants_company ON participants(company);
CREATE INDEX idx_participants_created_at ON participants(created_at);

-- ===========================================
-- 2. TABLA: meeting_participants (SIN FK por ahora)
-- ===========================================
CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    invited BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint único para evitar duplicados
    CONSTRAINT unique_meeting_participant UNIQUE(meeting_id, participant_id),
    
    -- Foreign key solo para participant (meeting se agregará después)
    CONSTRAINT fk_meeting_participants_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Índices para meeting_participants
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_participant_id ON meeting_participants(participant_id);
CREATE INDEX idx_meeting_participants_active ON meeting_participants(active);

-- ===========================================
-- 3. ALTER TABLE: meeting_sessions (Si existe)
-- ===========================================
-- Crear ENUM para session_type
CREATE TYPE session_type_enum AS ENUM ('predirectorio', 'directorio', 'coaching');

-- Agregar columnas a meeting_sessions si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_sessions') THEN
        ALTER TABLE meeting_sessions 
        ADD COLUMN IF NOT EXISTS session_type session_type_enum DEFAULT 'directorio',
        ADD COLUMN IF NOT EXISTS activity_code TEXT;
        
        -- Índices para las nuevas columnas
        CREATE INDEX IF NOT EXISTS idx_meeting_sessions_session_type ON meeting_sessions(session_type);
        CREATE INDEX IF NOT EXISTS idx_meeting_sessions_activity_code ON meeting_sessions(activity_code);
    END IF;
END $$;

-- ===========================================
-- 4. TABLA: session_attendance (SIN FK por ahora)
-- ===========================================
CREATE TABLE session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')),
    check_in_at TIMESTAMP WITH TIME ZONE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key solo para participant (session se agregará después)
    CONSTRAINT fk_session_attendance_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Índices para session_attendance
CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_participant_id ON session_attendance(participant_id);
CREATE INDEX idx_session_attendance_status ON session_attendance(status);
CREATE INDEX idx_session_attendance_check_in_at ON session_attendance(check_in_at);

-- ===========================================
-- 5. TABLA: session_notes (SIN FK por ahora)
-- ===========================================
CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    decisions TEXT,
    followups TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key solo para created_by (session se agregará después)
    CONSTRAINT fk_session_notes_created_by 
        FOREIGN KEY (created_by) REFERENCES participants(id) ON DELETE RESTRICT
);

-- Índices para session_notes
CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX idx_session_notes_created_by ON session_notes(created_by);
CREATE INDEX idx_session_notes_created_at ON session_notes(created_at);

-- ===========================================
-- 6. TABLA: session_evaluations (SIN FK por ahora)
-- ===========================================
CREATE TABLE session_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID NULL,
    evaluator_role VARCHAR(20) NOT NULL CHECK (evaluator_role IN ('coach', 'participante', 'coordinador')),
    score_overall INTEGER NOT NULL CHECK (score_overall >= 1 AND score_overall <= 5),
    score_listening INTEGER NOT NULL CHECK (score_listening >= 1 AND score_listening <= 5),
    score_feedback INTEGER NOT NULL CHECK (score_feedback >= 1 AND score_feedback <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key solo para participant (session se agregará después)
    CONSTRAINT fk_session_evaluations_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
);

-- Índices para session_evaluations
CREATE INDEX idx_session_evaluations_session_id ON session_evaluations(session_id);
CREATE INDEX idx_session_evaluations_participant_id ON session_evaluations(participant_id);
CREATE INDEX idx_session_evaluations_evaluator_role ON session_evaluations(evaluator_role);
CREATE INDEX idx_session_evaluations_score_overall ON session_evaluations(score_overall);

-- ===========================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_evaluations ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 8. POLÍTICAS RLS BÁSICAS (Simplificadas)
-- ===========================================

-- Políticas para participants
CREATE POLICY "Users can view participants" ON participants
    FOR SELECT USING (true);

CREATE POLICY "Users can insert participants" ON participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update participants" ON participants
    FOR UPDATE USING (true);

-- Políticas para meeting_participants
CREATE POLICY "Users can view meeting participants" ON meeting_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can manage meeting participants" ON meeting_participants
    FOR ALL USING (true);

-- Políticas para session_attendance
CREATE POLICY "Users can view session attendance" ON session_attendance
    FOR SELECT USING (true);

CREATE POLICY "Users can manage session attendance" ON session_attendance
    FOR ALL USING (true);

-- Políticas para session_notes
CREATE POLICY "Users can view session notes" ON session_notes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage session notes" ON session_notes
    FOR ALL USING (true);

-- Políticas para session_evaluations
CREATE POLICY "Users can view session evaluations" ON session_evaluations
    FOR SELECT USING (true);

CREATE POLICY "Users can manage session evaluations" ON session_evaluations
    FOR ALL USING (true);

-- ===========================================
-- 9. FUNCIONES DE UTILIDAD (Simplificadas)
-- ===========================================

-- Función para obtener participantes de una sesión (sin FK por ahora)
CREATE OR REPLACE FUNCTION get_session_participants(session_uuid UUID)
RETURNS TABLE (
    participant_id UUID,
    full_name VARCHAR(255),
    email VARCHAR(255),
    venture_name VARCHAR(255),
    company VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        p.email,
        p.venture_name,
        p.company
    FROM participants p
    JOIN meeting_participants mp ON p.id = mp.participant_id
    WHERE mp.meeting_id = session_uuid
    AND mp.active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de asistencia (sin FK por ahora)
CREATE OR REPLACE FUNCTION get_session_attendance_stats(session_uuid UUID)
RETURNS TABLE (
    total_participants BIGINT,
    present_count BIGINT,
    late_count BIGINT,
    absent_count BIGINT,
    excused_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT mp.participant_id) as total_participants,
        COUNT(CASE WHEN sa.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN sa.status = 'late' THEN 1 END) as late_count,
        COUNT(CASE WHEN sa.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN sa.status = 'excused' THEN 1 END) as excused_count
    FROM meeting_participants mp
    LEFT JOIN session_attendance sa ON mp.participant_id = sa.participant_id AND sa.session_id = session_uuid
    WHERE mp.meeting_id = session_uuid
    AND mp.active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 10. TRIGGERS PARA UPDATED_AT
-- ===========================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_session_attendance_updated_at
    BEFORE UPDATE ON session_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
    BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 11. COMENTARIOS EN TABLAS Y COLUMNAS
-- ===========================================

COMMENT ON TABLE participants IS 'Tabla de participantes en el programa de directorios empresariales';
COMMENT ON TABLE meeting_participants IS 'Relación muchos a muchos entre meetings y participants';
COMMENT ON TABLE session_attendance IS 'Registro de asistencia a las sesiones';
COMMENT ON TABLE session_notes IS 'Notas y actas de las sesiones';
COMMENT ON TABLE session_evaluations IS 'Evaluaciones de las sesiones por participantes y coaches';

-- Comentarios en columnas importantes
COMMENT ON COLUMN participants.venture_code IS 'Código único del emprendimiento';
COMMENT ON COLUMN meeting_participants.invited IS 'Indica si el participante fue invitado a la reunión';
COMMENT ON COLUMN meeting_participants.active IS 'Indica si la participación está activa';
COMMENT ON COLUMN session_attendance.status IS 'Estado de asistencia: present, late, absent, excused';
COMMENT ON COLUMN session_evaluations.evaluator_role IS 'Rol del evaluador: coach, participante, coordinador';

-- ===========================================
-- 12. DATOS DE PRUEBA
-- ===========================================

-- Insertar algunos participantes de ejemplo
INSERT INTO participants (full_name, email, phone, venture_name, venture_code, company, role) VALUES
('Juan Pérez', 'juan.perez@email.com', '+1234567890', 'TechStart', 'TS001', 'TechStart Inc.', 'CEO'),
('María García', 'maria.garcia@email.com', '+1234567891', 'EcoSolutions', 'ES001', 'EcoSolutions Ltd.', 'Founder'),
('Carlos López', 'carlos.lopez@email.com', '+1234567892', 'DataFlow', 'DF001', 'DataFlow Corp.', 'CTO');

-- ===========================================
-- FIN DE LA MIGRACIÓN
-- ===========================================
