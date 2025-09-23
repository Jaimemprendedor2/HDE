-- ===========================================
-- Housenovo Directorios Empresariales
-- Migración Final que SÍ Funciona
-- Fecha: 2025-09-23
-- ===========================================

-- ===========================================
-- LIMPIAR TODO PRIMERO
-- ===========================================

-- Eliminar políticas
DROP POLICY IF EXISTS "Allow all operations on session_evaluations" ON session_evaluations;
DROP POLICY IF EXISTS "Allow all operations on session_notes" ON session_notes;
DROP POLICY IF EXISTS "Allow all operations on session_attendance" ON session_attendance;
DROP POLICY IF EXISTS "Allow all operations on participants" ON participants;
DROP POLICY IF EXISTS "Allow all operations on meeting_sessions" ON meeting_sessions;
DROP POLICY IF EXISTS "Allow all operations on meeting_stages" ON meeting_stages;
DROP POLICY IF EXISTS "Allow all operations on meetings" ON meetings;

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS session_evaluations CASCADE;
DROP TABLE IF EXISTS session_notes CASCADE;
DROP TABLE IF EXISTS session_attendance CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS meeting_stages CASCADE;
DROP TABLE IF EXISTS meeting_sessions CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS create_default_stages(UUID, VARCHAR(50)) CASCADE;
DROP FUNCTION IF EXISTS get_meeting_stages_ordered(UUID) CASCADE;
DROP FUNCTION IF EXISTS reorder_meeting_stages(UUID, JSONB) CASCADE;

-- Eliminar tipos
DROP TYPE IF EXISTS session_type_enum CASCADE;

-- ===========================================
-- CREAR EXTENSIONES
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- CREAR TIPOS
-- ===========================================

CREATE TYPE session_type_enum AS ENUM ('predirectorio', 'directorio', 'coaching');

-- ===========================================
-- CREAR TABLAS SIN FOREIGN KEYS PRIMERO
-- ===========================================

-- Tabla meetings (sin dependencias)
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla meeting_sessions (depende de meetings)
CREATE TABLE meeting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type session_type_enum NOT NULL,
    activity_code VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla meeting_stages (depende de meetings)
CREATE TABLE meeting_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 300,
    color_hex VARCHAR(7) DEFAULT '#3B82F6',
    alert_color_hex VARCHAR(7) DEFAULT '#EF4444',
    stage_order INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla participants (depende de meetings)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'attended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla session_attendance (depende de meeting_sessions y participants)
CREATE TABLE session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'absent' CHECK (attendance_status IN ('present', 'late', 'absent')),
    arrival_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_session_participant 
        UNIQUE (session_id, participant_id)
);

-- Tabla session_notes (depende de meeting_sessions)
CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    decisions TEXT,
    follow_ups TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla session_evaluations (depende de meeting_sessions y participants)
CREATE TABLE session_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    facilitator_rating INTEGER CHECK (facilitator_rating >= 1 AND facilitator_rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- AGREGAR FOREIGN KEYS DESPUÉS
-- ===========================================

-- Foreign keys para meeting_sessions
ALTER TABLE meeting_sessions 
ADD CONSTRAINT fk_meeting_sessions_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

-- Foreign keys para meeting_stages
ALTER TABLE meeting_stages 
ADD CONSTRAINT fk_meeting_stages_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

-- Foreign keys para participants
ALTER TABLE participants 
ADD CONSTRAINT fk_participants_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

-- Foreign keys para session_attendance
ALTER TABLE session_attendance 
ADD CONSTRAINT fk_session_attendance_session 
FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE;

ALTER TABLE session_attendance 
ADD CONSTRAINT fk_session_attendance_participant 
FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

-- Foreign keys para session_notes
ALTER TABLE session_notes 
ADD CONSTRAINT fk_session_notes_session 
FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE;

-- Foreign keys para session_evaluations
ALTER TABLE session_evaluations 
ADD CONSTRAINT fk_session_evaluations_session 
FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE;

ALTER TABLE session_evaluations 
ADD CONSTRAINT fk_session_evaluations_participant 
FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;

-- ===========================================
-- CREAR ÍNDICES
-- ===========================================

-- Índices para meetings
CREATE INDEX idx_meetings_start_date ON meetings(start_date);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at);

-- Índices para meeting_sessions
CREATE INDEX idx_meeting_sessions_meeting_id ON meeting_sessions(meeting_id);
CREATE INDEX idx_meeting_sessions_session_type ON meeting_sessions(session_type);
CREATE INDEX idx_meeting_sessions_activity_code ON meeting_sessions(activity_code);

-- Índices para meeting_stages
CREATE INDEX idx_meeting_stages_meeting_id ON meeting_stages(meeting_id);
CREATE INDEX idx_meeting_stages_stage_order ON meeting_stages(meeting_id, stage_order);
CREATE INDEX idx_meeting_stages_duration ON meeting_stages(duration);

-- Índices para participants
CREATE INDEX idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_status ON participants(status);

-- Índices para session_attendance
CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_participant_id ON session_attendance(participant_id);
CREATE INDEX idx_session_attendance_status ON session_attendance(attendance_status);

-- Índices para session_notes
CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX idx_session_notes_created_at ON session_notes(created_at);

-- Índices para session_evaluations
CREATE INDEX idx_session_evaluations_session_id ON session_evaluations(session_id);
CREATE INDEX idx_session_evaluations_participant_id ON session_evaluations(participant_id);

-- ===========================================
-- CREAR FUNCIONES
-- ===========================================

-- Función para reordenar etapas
CREATE OR REPLACE FUNCTION reorder_meeting_stages(
    p_meeting_id UUID,
    p_stage_orders JSONB
)
RETURNS TABLE (
    id UUID,
    stage_name VARCHAR(100),
    stage_order INTEGER,
    updated BOOLEAN
) AS $$
DECLARE
    stage_record RECORD;
BEGIN
    FOR stage_record IN
        SELECT
            key::UUID as stage_id,
            value::INTEGER as new_stage_order
        FROM jsonb_each_text(p_stage_orders)
    LOOP
        UPDATE meeting_stages
        SET
            stage_order = stage_record.new_stage_order,
            updated_at = NOW()
        WHERE meeting_stages.id = stage_record.stage_id
        AND meeting_stages.meeting_id = p_meeting_id;

        RETURN QUERY
        SELECT
            ms.id,
            ms.stage_name,
            ms.stage_order,
            true as updated
        FROM meeting_stages ms
        WHERE ms.id = stage_record.stage_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener etapas ordenadas
CREATE OR REPLACE FUNCTION get_meeting_stages_ordered(p_meeting_id UUID)        
RETURNS TABLE (
    id UUID,
    meeting_id UUID,
    stage_name VARCHAR(100),
    description TEXT,
    duration INTEGER,
    color_hex VARCHAR(7),
    alert_color_hex VARCHAR(7),
    stage_order INTEGER,
    status VARCHAR(20),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ms.id,
        ms.meeting_id,
        ms.stage_name,
        ms.description,
        ms.duration,
        ms.color_hex,
        ms.alert_color_hex,
        ms.stage_order,
        ms.status,
        ms.start_time,
        ms.end_time,
        ms.created_at,
        ms.updated_at
    FROM meeting_stages ms
    WHERE ms.meeting_id = p_meeting_id
    ORDER BY ms.stage_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear etapas por defecto
CREATE OR REPLACE FUNCTION create_default_stages(
    p_meeting_id UUID,
    p_session_type session_type_enum
)
RETURNS TABLE (
    id UUID,
    stage_name VARCHAR(100),
    stage_order INTEGER
) AS $$
BEGIN
    IF p_session_type = 'predirectorio' THEN
        INSERT INTO meeting_stages (meeting_id, stage_name, description, duration, stage_order, color_hex)
        VALUES
            (p_meeting_id, 'Bienvenida', 'Presentación de la jornada y participantes', 600, 1, '#10B981'),
            (p_meeting_id, 'Networking', 'Tiempo de interacción entre participantes', 900, 2, '#3B82F6'),
            (p_meeting_id, 'Presentaciones Breves', 'Cada participante presenta su empresa', 1200, 3, '#8B5CF6'),
            (p_meeting_id, 'Cierre', 'Conclusiones y próximos pasos', 300, 4, '#F59E0B');

    ELSIF p_session_type = 'directorio' THEN
        INSERT INTO meeting_stages (meeting_id, stage_name, description, duration, stage_order, color_hex)
        VALUES 
            (p_meeting_id, 'Presentación', 'Presentación inicial de participantes', 600, 1, '#10B981'),
            (p_meeting_id, 'Pitch Elevator', 'Pitch rápido de cada emprendedor', 120, 2, '#EF4444'),
            (p_meeting_id, 'Ronda de Preguntas', 'Preguntas y respuestas', 900, 3, '#3B82F6'),
            (p_meeting_id, 'Feedback', 'Retroalimentación y comentarios', 600, 4, '#8B5CF6'),
            (p_meeting_id, 'Networking', 'Tiempo de conexión entre participantes', 900, 5, '#F59E0B');

    ELSIF p_session_type = 'coaching' THEN
        INSERT INTO meeting_stages (meeting_id, stage_name, description, duration, stage_order, color_hex)
        VALUES
            (p_meeting_id, 'Check-in', 'Estado actual y objetivos de la sesión', 300, 1, '#10B981'),
            (p_meeting_id, 'Análisis de Situación', 'Evaluación del estado actual', 900, 2, '#3B82F6'),
            (p_meeting_id, 'Desarrollo de Estrategias', 'Trabajo en soluciones y estrategias', 1200, 3, '#8B5CF6'),
            (p_meeting_id, 'Plan de Acción', 'Definición de pasos concretos', 600, 4, '#F59E0B'),
            (p_meeting_id, 'Compromisos', 'Definición de compromisos y seguimiento', 300, 5, '#EF4444');
    END IF;

    RETURN QUERY
    SELECT
        ms.id,
        ms.stage_name,
        ms.stage_order
    FROM meeting_stages ms
    WHERE ms.meeting_id = p_meeting_id
    ORDER BY ms.stage_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- HABILITAR RLS Y CREAR POLÍTICAS
-- ===========================================

-- Habilitar RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_evaluations ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples
CREATE POLICY "Allow all operations on meetings" ON meetings FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_stages" ON meeting_stages FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_sessions" ON meeting_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on participants" ON participants FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_attendance" ON session_attendance FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_notes" ON session_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_evaluations" ON session_evaluations FOR ALL USING (true);

-- ===========================================
-- ¡MIGRACIÓN COMPLETADA!
-- ===========================================
