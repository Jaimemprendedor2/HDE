-- ===========================================
-- Housenovo Directorios Empresariales
-- Base Tables Migration (Prerequisitos)
-- Fecha: 2025-09-22
-- ===========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. TABLA: meetings (Tabla base)
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
-- 2. TABLA: meeting_stages (Etapas de reuniones)
-- ===========================================
CREATE TABLE meeting_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    stage_name VARCHAR(100) NOT NULL,
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
CREATE INDEX idx_meeting_stages_meeting_id ON meeting_stages(meeting_id);
CREATE INDEX idx_meeting_stages_stage_order ON meeting_stages(meeting_id, stage_order);
CREATE INDEX idx_meeting_stages_status ON meeting_stages(status);

-- ===========================================
-- 3. TABLA: meeting_sessions (Sesiones de reuniones)
-- ===========================================
CREATE TABLE meeting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    location VARCHAR(255),
    max_participants INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_meeting_sessions_meeting 
        FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Índices para meeting_sessions
CREATE INDEX idx_meeting_sessions_meeting_id ON meeting_sessions(meeting_id);
CREATE INDEX idx_meeting_sessions_start_time ON meeting_sessions(start_time);
CREATE INDEX idx_meeting_sessions_status ON meeting_sessions(status);

-- ===========================================
-- 4. TABLA: stage_progress (Progreso de etapas)
-- ===========================================
CREATE TABLE stage_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_id UUID NOT NULL,
    participant_id UUID,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_stage_progress_stage 
        FOREIGN KEY (stage_id) REFERENCES meeting_stages(id) ON DELETE CASCADE
);

-- Índices para stage_progress
CREATE INDEX idx_stage_progress_stage_id ON stage_progress(stage_id);
CREATE INDEX idx_stage_progress_participant_id ON stage_progress(participant_id);
CREATE INDEX idx_stage_progress_completed_at ON stage_progress(completed_at);

-- ===========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_progress ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 6. POLÍTICAS RLS BÁSICAS
-- ===========================================

-- Políticas para meetings
CREATE POLICY "Users can view meetings" ON meetings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage meetings" ON meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- Políticas para meeting_stages
CREATE POLICY "Users can view meeting stages" ON meeting_stages
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage meeting stages" ON meeting_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- Políticas para meeting_sessions
CREATE POLICY "Users can view meeting sessions" ON meeting_sessions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage meeting sessions" ON meeting_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- Políticas para stage_progress
CREATE POLICY "Users can view stage progress" ON stage_progress
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage stage progress" ON stage_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- ===========================================
-- 7. TRIGGERS PARA UPDATED_AT
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
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_stages_updated_at
    BEFORE UPDATE ON meeting_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_sessions_updated_at
    BEFORE UPDATE ON meeting_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stage_progress_updated_at
    BEFORE UPDATE ON stage_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 8. DATOS DE PRUEBA
-- ===========================================

-- Insertar una reunión de prueba
INSERT INTO meetings (id, title, description, start_date, end_date, status, location, max_participants)
VALUES (
    uuid_generate_v4(),
    'Directorio Empresarial Q4 2025',
    'Reunión trimestral del directorio empresarial',
    '2025-09-25',
    '2025-09-25',
    'scheduled',
    'Centro de Convenciones',
    30
);

-- Insertar una sesión de prueba
INSERT INTO meeting_sessions (id, meeting_id, title, description, start_time, end_time, status, location, max_participants)
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM meetings LIMIT 1),
    'Sesión de Networking',
    'Sesión de networking entre participantes',
    '2025-09-25 09:00:00+00',
    '2025-09-25 10:30:00+00',
    'scheduled',
    'Sala A',
    30
);

-- ===========================================
-- FIN DE LA MIGRACIÓN BASE
-- ===========================================
