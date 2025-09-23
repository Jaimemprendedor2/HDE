-- ===========================================
-- Housenovo Directorios Empresariales
-- Schema Core Migration
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
-- 2. TABLA: meeting_participants
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
    
    -- Foreign keys (asumiendo que meetings ya existe)
    CONSTRAINT fk_meeting_participants_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    CONSTRAINT fk_meeting_participants_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Índices para meeting_participants
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_participant_id ON meeting_participants(participant_id);
CREATE INDEX idx_meeting_participants_active ON meeting_participants(active);

-- ===========================================
-- 3. ALTER TABLE: meeting_sessions
-- ===========================================
-- Crear ENUM para session_type
CREATE TYPE session_type_enum AS ENUM ('predirectorio', 'directorio', 'coaching');

-- Agregar columnas a meeting_sessions
ALTER TABLE meeting_sessions 
ADD COLUMN session_type session_type_enum DEFAULT 'directorio',
ADD COLUMN activity_code TEXT;

-- Índices para las nuevas columnas
CREATE INDEX idx_meeting_sessions_session_type ON meeting_sessions(session_type);
CREATE INDEX idx_meeting_sessions_activity_code ON meeting_sessions(activity_code);

-- ===========================================
-- 4. TABLA: session_attendance
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
    
    -- Foreign keys
    CONSTRAINT fk_session_attendance_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendance_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Índices para session_attendance
CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_participant_id ON session_attendance(participant_id);
CREATE INDEX idx_session_attendance_status ON session_attendance(status);
CREATE INDEX idx_session_attendance_check_in_at ON session_attendance(check_in_at);

-- ===========================================
-- 5. TABLA: session_notes
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
    
    -- Foreign keys
    CONSTRAINT fk_session_notes_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_notes_created_by 
        FOREIGN KEY (created_by) REFERENCES participants(id) ON DELETE RESTRICT
);

-- Índices para session_notes
CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX idx_session_notes_created_by ON session_notes(created_by);
CREATE INDEX idx_session_notes_created_at ON session_notes(created_at);

-- ===========================================
-- 6. TABLA: session_evaluations
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
    
    -- Foreign keys
    CONSTRAINT fk_session_evaluations_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
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
-- 8. POLÍTICAS RLS PARA PARTICIPANTS
-- ===========================================
-- Los participantes pueden ver y editar su propia información
CREATE POLICY "Participants can view own data" ON participants
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Participants can update own data" ON participants
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Los administradores pueden ver y editar todos los participantes
CREATE POLICY "Admins can manage all participants" ON participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- ===========================================
-- 9. POLÍTICAS RLS PARA MEETING_PARTICIPANTS
-- ===========================================
-- Los participantes pueden ver sus propias participaciones en meetings
CREATE POLICY "Participants can view own meeting participations" ON meeting_participants
    FOR SELECT USING (
        participant_id IN (
            SELECT id FROM participants 
            WHERE auth.uid()::text = id::text
        )
    );

-- Los administradores pueden gestionar todas las participaciones
CREATE POLICY "Admins can manage all meeting participations" ON meeting_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- ===========================================
-- 10. POLÍTICAS RLS PARA SESSION_ATTENDANCE
-- ===========================================
-- Los participantes pueden ver su propia asistencia
CREATE POLICY "Participants can view own attendance" ON session_attendance
    FOR SELECT USING (
        participant_id IN (
            SELECT id FROM participants 
            WHERE auth.uid()::text = id::text
        )
    );

-- Los participantes pueden actualizar su propia asistencia
CREATE POLICY "Participants can update own attendance" ON session_attendance
    FOR UPDATE USING (
        participant_id IN (
            SELECT id FROM participants 
            WHERE auth.uid()::text = id::text
        )
    );

-- Los administradores pueden gestionar toda la asistencia
CREATE POLICY "Admins can manage all attendance" ON session_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- ===========================================
-- 11. POLÍTICAS RLS PARA SESSION_NOTES
-- ===========================================
-- Los participantes pueden ver las notas de las sesiones en las que participan
CREATE POLICY "Participants can view session notes" ON session_notes
    FOR SELECT USING (
        session_id IN (
            SELECT ms.id FROM meeting_sessions ms
            JOIN meeting_participants mp ON ms.meeting_id = mp.meeting_id
            WHERE mp.participant_id IN (
                SELECT id FROM participants 
                WHERE auth.uid()::text = id::text
            )
        )
    );

-- Los coordinadores y administradores pueden crear y editar notas
CREATE POLICY "Coordinators can manage session notes" ON session_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- ===========================================
-- 12. POLÍTICAS RLS PARA SESSION_EVALUATIONS
-- ===========================================
-- Los participantes pueden ver las evaluaciones de las sesiones en las que participan
CREATE POLICY "Participants can view session evaluations" ON session_evaluations
    FOR SELECT USING (
        session_id IN (
            SELECT ms.id FROM meeting_sessions ms
            JOIN meeting_participants mp ON ms.meeting_id = mp.meeting_id
            WHERE mp.participant_id IN (
                SELECT id FROM participants 
                WHERE auth.uid()::text = id::text
            )
        )
    );

-- Los participantes pueden crear evaluaciones para sesiones en las que participan
CREATE POLICY "Participants can create evaluations" ON session_evaluations
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT ms.id FROM meeting_sessions ms
            JOIN meeting_participants mp ON ms.meeting_id = mp.meeting_id
            WHERE mp.participant_id IN (
                SELECT id FROM participants 
                WHERE auth.uid()::text = id::text
            )
        )
    );

-- Los administradores pueden gestionar todas las evaluaciones
CREATE POLICY "Admins can manage all evaluations" ON session_evaluations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- ===========================================
-- 13. FUNCIONES DE UTILIDAD
-- ===========================================

-- Función para obtener participantes de una sesión
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
    JOIN meeting_sessions ms ON mp.meeting_id = ms.meeting_id
    WHERE ms.id = session_uuid
    AND mp.active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de asistencia de una sesión
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
    JOIN meeting_sessions ms ON mp.meeting_id = ms.meeting_id
    LEFT JOIN session_attendance sa ON ms.id = sa.session_id AND mp.participant_id = sa.participant_id
    WHERE ms.id = session_uuid
    AND mp.active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 14. TRIGGERS PARA UPDATED_AT
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
-- 15. COMENTARIOS EN TABLAS Y COLUMNAS
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
-- 16. DATOS DE PRUEBA (OPCIONAL)
-- ===========================================

-- Insertar algunos participantes de ejemplo
INSERT INTO participants (full_name, email, phone, venture_name, venture_code, company, role) VALUES
('Juan Pérez', 'juan.perez@email.com', '+1234567890', 'TechStart', 'TS001', 'TechStart Inc.', 'CEO'),
('María García', 'maria.garcia@email.com', '+1234567891', 'EcoSolutions', 'ES001', 'EcoSolutions Ltd.', 'Founder'),
('Carlos López', 'carlos.lopez@email.com', '+1234567892', 'DataFlow', 'DF001', 'DataFlow Corp.', 'CTO');

-- ===========================================
-- FIN DE LA MIGRACIÓN
-- ===========================================
