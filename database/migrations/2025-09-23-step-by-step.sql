-- ===========================================
-- Housenovo Directorios Empresariales
-- Migración Paso a Paso - Solo Tablas Básicas
-- Fecha: 2025-09-23
-- ===========================================

-- ===========================================
-- PASO 1: LIMPIAR TODO
-- ===========================================

-- Eliminar políticas
DROP POLICY IF EXISTS "Allow all operations on session_evaluations" ON session_evaluations;
DROP POLICY IF EXISTS "Allow all operations on session_notes" ON session_notes;
DROP POLICY IF EXISTS "Allow all operations on session_attendance" ON session_attendance;
DROP POLICY IF EXISTS "Allow all operations on participants" ON participants;
DROP POLICY IF EXISTS "Allow all operations on meeting_sessions" ON meeting_sessions;
DROP POLICY IF EXISTS "Allow all operations on meeting_stages" ON meeting_stages;
DROP POLICY IF EXISTS "Allow all operations on meetings" ON meetings;

-- Eliminar tablas
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
-- PASO 2: HABILITAR EXTENSIONES
-- ===========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PASO 3: CREAR TIPOS
-- ===========================================

CREATE TYPE session_type_enum AS ENUM ('predirectorio', 'directorio', 'coaching');

-- ===========================================
-- PASO 4: CREAR TABLA MEETINGS
-- ===========================================

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

-- Índices para meetings
CREATE INDEX idx_meetings_start_date ON meetings(start_date);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at);

-- ===========================================
-- PASO 5: CREAR TABLA MEETING_SESSIONS
-- ===========================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_meeting_sessions_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para meeting_sessions
CREATE INDEX idx_meeting_sessions_meeting_id ON meeting_sessions(meeting_id);
CREATE INDEX idx_meeting_sessions_session_type ON meeting_sessions(session_type);
CREATE INDEX idx_meeting_sessions_activity_code ON meeting_sessions(activity_code);

-- ===========================================
-- PASO 6: CREAR TABLA MEETING_STAGES
-- ===========================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_meeting_stages_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para meeting_stages
CREATE INDEX idx_meeting_stages_meeting_id ON meeting_stages(meeting_id);
CREATE INDEX idx_meeting_stages_stage_order ON meeting_stages(meeting_id, stage_order);
CREATE INDEX idx_meeting_stages_duration ON meeting_stages(duration);

-- ===========================================
-- PASO 7: CREAR TABLA PARTICIPANTS
-- ===========================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_participants_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para participants
CREATE INDEX idx_participants_meeting_id ON participants(meeting_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_status ON participants(status);

-- ===========================================
-- PASO 8: CREAR TABLA SESSION_ATTENDANCE
-- ===========================================

CREATE TABLE session_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    attendance_status VARCHAR(20) DEFAULT 'absent' CHECK (attendance_status IN ('present', 'late', 'absent')),
    arrival_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_session_attendance_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_attendance_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    CONSTRAINT unique_session_participant 
        UNIQUE (session_id, participant_id)
);

-- Índices para session_attendance
CREATE INDEX idx_session_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_participant_id ON session_attendance(participant_id);
CREATE INDEX idx_session_attendance_status ON session_attendance(attendance_status);

-- ===========================================
-- PASO 9: CREAR TABLA SESSION_NOTES
-- ===========================================

CREATE TABLE session_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    decisions TEXT,
    follow_ups TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_session_notes_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE
);

-- Índices para session_notes
CREATE INDEX idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX idx_session_notes_created_at ON session_notes(created_at);

-- ===========================================
-- PASO 10: CREAR TABLA SESSION_EVALUATIONS
-- ===========================================

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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_session_evaluations_session 
        FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_evaluations_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

-- Índices para session_evaluations
CREATE INDEX idx_session_evaluations_session_id ON session_evaluations(session_id);
CREATE INDEX idx_session_evaluations_participant_id ON session_evaluations(participant_id);

-- ===========================================
-- FIN DE LA MIGRACIÓN PASO A PASO - SOLO TABLAS
-- ===========================================
