-- ===========================================
-- Housenovo Directorios Empresariales
-- Migración Ultra Simple - Solo Tablas Básicas
-- Fecha: 2025-09-23
-- ===========================================

-- Limpiar todo primero
DROP TABLE IF EXISTS session_evaluations CASCADE;
DROP TABLE IF EXISTS session_notes CASCADE;
DROP TABLE IF EXISTS session_attendance CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS meeting_stages CASCADE;
DROP TABLE IF EXISTS meeting_sessions CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tipo
CREATE TYPE session_type_enum AS ENUM ('predirectorio', 'directorio', 'coaching');

-- Crear tabla meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'scheduled',
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla meeting_sessions
CREATE TABLE meeting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_type session_type_enum NOT NULL,
    activity_code VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled',
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla meeting_stages
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
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'invited',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar foreign keys
ALTER TABLE meeting_sessions 
ADD CONSTRAINT fk_meeting_sessions_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

ALTER TABLE meeting_stages 
ADD CONSTRAINT fk_meeting_stages_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

ALTER TABLE participants 
ADD CONSTRAINT fk_participants_meeting 
FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples
CREATE POLICY "Allow all operations on meetings" ON meetings FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_sessions" ON meeting_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_stages" ON meeting_stages FOR ALL USING (true);
CREATE POLICY "Allow all operations on participants" ON participants FOR ALL USING (true);

-- ¡LISTO!
