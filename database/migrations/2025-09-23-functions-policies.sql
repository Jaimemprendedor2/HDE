-- ===========================================
-- Housenovo Directorios Empresariales
-- Funciones y Políticas - Segunda Parte
-- Fecha: 2025-09-23
-- ===========================================

-- ===========================================
-- FUNCIONES PARA LA NUEVA UI
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

-- Habilitar RLS en todas las tablas
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_evaluations ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples para desarrollo
CREATE POLICY "Allow all operations on meetings" ON meetings FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_stages" ON meeting_stages FOR ALL USING (true);
CREATE POLICY "Allow all operations on meeting_sessions" ON meeting_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on participants" ON participants FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_attendance" ON session_attendance FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_notes" ON session_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations on session_evaluations" ON session_evaluations FOR ALL USING (true);

-- ===========================================
-- FIN DE FUNCIONES Y POLÍTICAS
-- ===========================================
