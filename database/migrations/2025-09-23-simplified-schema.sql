-- ===========================================
-- Housenovo Directorios Empresariales
-- Migración Simplificada para Nueva UI
-- Fecha: 2025-09-23
-- ===========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. TABLA: meetings (Tabla base)
-- ===========================================
CREATE TABLE IF NOT EXISTS meetings (
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

-- Índices para meetings
CREATE INDEX IF NOT EXISTS idx_meetings_start_date ON meetings(start_date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);

-- ===========================================
-- 2. TABLA: meeting_stages (Etapas de reuniones)
-- ===========================================
CREATE TABLE IF NOT EXISTS meeting_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 300, -- duración en segundos
    color_hex VARCHAR(7) DEFAULT '#3B82F6', -- color para la UI
    alert_color_hex VARCHAR(7) DEFAULT '#EF4444', -- color de alerta
    stage_order INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_meeting_stages_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para meeting_stages
CREATE INDEX IF NOT EXISTS idx_meeting_stages_meeting_id ON meeting_stages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_stages_stage_order ON meeting_stages(meeting_id, stage_order);
CREATE INDEX IF NOT EXISTS idx_meeting_stages_duration ON meeting_stages(duration);

-- ===========================================
-- 3. TABLA: meeting_sessions (Sesiones de reuniones)
-- ===========================================
CREATE TABLE IF NOT EXISTS meeting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('predirectorio', 'directorio', 'coaching')),
    activity_code VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_meeting_sessions_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para meeting_sessions
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_meeting_id ON meeting_sessions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_session_type ON meeting_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_meeting_sessions_activity_code ON meeting_sessions(activity_code);

-- ===========================================
-- 4. TABLA: participants (Participantes)
-- ===========================================
CREATE TABLE IF NOT EXISTS participants (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_participants_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para participants
CREATE INDEX IF NOT EXISTS idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- ===========================================
-- 5. TABLA: session_attendance (Asistencia a sesiones)
-- ===========================================
CREATE TABLE IF NOT EXISTS session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'absent' CHECK (attendance_status IN ('present', 'late', 'absent')),
    arrival_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_session_attendance_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendance_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    
    -- Unique constraint para evitar duplicados
    CONSTRAINT unique_session_participant 
        UNIQUE (session_id, participant_id)
);

-- Índices para session_attendance
CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_participant_id ON session_attendance(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_status ON session_attendance(attendance_status);

-- ===========================================
-- 6. TABLA: session_notes (Notas de sesiones)
-- ===========================================
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    decisions TEXT,
    follow_ups TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_session_notes_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE
);

-- Índices para session_notes
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_created_at ON session_notes(created_at);

-- ===========================================
-- 7. TABLA: session_evaluations (Evaluaciones de sesiones)
-- ===========================================
CREATE TABLE IF NOT EXISTS session_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    facilitator_rating INTEGER CHECK (facilitator_rating >= 1 AND facilitator_rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_session_evaluations_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_evaluations_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Índices para session_evaluations
CREATE INDEX IF NOT EXISTS idx_session_evaluations_session_id ON session_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_evaluations_participant_id ON session_evaluations(participant_id);

-- ===========================================
-- 8. CREAR ENUM PARA TIPOS DE SESIÓN
-- ===========================================
DO $$ BEGIN
    CREATE TYPE session_type_enum AS ENUM ('predirectorio', 'directorio', 'coaching');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- 9. FUNCIONES PARA LA NUEVA UI
-- ===========================================

-- Función para reordenar etapas (drag & drop)
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
    new_order INTEGER;
BEGIN
    -- Iterar sobre cada etapa en el JSON de órdenes
    FOR stage_record IN
        SELECT
            key::UUID as stage_id,
            value::INTEGER as new_stage_order
        FROM jsonb_each_text(p_stage_orders)
    LOOP
        -- Actualizar el orden de la etapa
        UPDATE meeting_stages
        SET
            stage_order = stage_record.new_stage_order,
            updated_at = NOW()
        WHERE meeting_stages.id = stage_record.stage_id
        AND meeting_stages.meeting_id = p_meeting_id;

        -- Retornar información de la actualización
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

-- Función para obtener etapas de una reunión
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
    -- Crear etapas según el tipo de sesión
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

    -- Retornar las etapas creadas
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
-- 10. HABILITAR RLS (Row Level Security)
-- ===========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_evaluations ENABLE ROW LEVEL SECURITY;

-- Políticas simples: permitir todo por ahora (para desarrollo)
CREATE POLICY "Allow all operations on meetings" ON meetings FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_stages" ON meeting_stages FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_sessions" ON meeting_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on participants" ON participants FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_attendance" ON session_attendance FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_notes" ON session_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_evaluations" ON session_evaluations FOR ALL USING (true);

-- ===========================================
-- FIN DE LA MIGRACIÓN SIMPLIFICADA
-- ===========================================
