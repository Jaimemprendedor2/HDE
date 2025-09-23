-- ===========================================
-- Housenovo Directorios Empresariales
-- Add Foreign Keys Migration
-- Fecha: 2025-09-22
-- ===========================================

-- ===========================================
-- 1. AGREGAR FK A MEETING_PARTICIPANTS
-- ===========================================
-- Solo agregar si la tabla meetings existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meetings') THEN
        -- Agregar foreign key a meetings
        ALTER TABLE meeting_participants 
        ADD CONSTRAINT fk_meeting_participants_meeting 
            FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key agregada a meeting_participants -> meetings';
    ELSE
        RAISE NOTICE 'Tabla meetings no existe, saltando FK para meeting_participants';
    END IF;
END $$;

-- ===========================================
-- 2. AGREGAR FK A SESSION_ATTENDANCE
-- ===========================================
-- Solo agregar si la tabla meeting_sessions existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_sessions') THEN
        -- Agregar foreign key a meeting_sessions
        ALTER TABLE session_attendance 
        ADD CONSTRAINT fk_session_attendance_session 
            FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key agregada a session_attendance -> meeting_sessions';
    ELSE
        RAISE NOTICE 'Tabla meeting_sessions no existe, saltando FK para session_attendance';
    END IF;
END $$;

-- ===========================================
-- 3. AGREGAR FK A SESSION_NOTES
-- ===========================================
-- Solo agregar si la tabla meeting_sessions existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_sessions') THEN
        -- Agregar foreign key a meeting_sessions
        ALTER TABLE session_notes 
        ADD CONSTRAINT fk_session_notes_session 
            FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key agregada a session_notes -> meeting_sessions';
    ELSE
        RAISE NOTICE 'Tabla meeting_sessions no existe, saltando FK para session_notes';
    END IF;
END $$;

-- ===========================================
-- 4. AGREGAR FK A SESSION_EVALUATIONS
-- ===========================================
-- Solo agregar si la tabla meeting_sessions existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meeting_sessions') THEN
        -- Agregar foreign key a meeting_sessions
        ALTER TABLE session_evaluations 
        ADD CONSTRAINT fk_session_evaluations_session 
            FOREIGN KEY (session_id) REFERENCES meeting_sessions(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key agregada a session_evaluations -> meeting_sessions';
    ELSE
        RAISE NOTICE 'Tabla meeting_sessions no existe, saltando FK para session_evaluations';
    END IF;
END $$;

-- ===========================================
-- 5. VERIFICAR FOREIGN KEYS CREADAS
-- ===========================================
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN (
    'meeting_participants', 
    'session_attendance', 
    'session_notes', 
    'session_evaluations'
)
ORDER BY tc.table_name, kcu.column_name;

-- ===========================================
-- FIN DE LA MIGRACIÓN DE FOREIGN KEYS
-- ===========================================
