-- ===========================================
-- Housenovo Directorios Empresariales
-- Update meeting_stages schema for new UI
-- Fecha: 2025-09-23
-- ===========================================

-- Agregar columnas faltantes a meeting_stages
ALTER TABLE meeting_stages 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER NOT NULL DEFAULT 300, -- duración en segundos
ADD COLUMN IF NOT EXISTS color_hex VARCHAR(7) DEFAULT '#3B82F6', -- color para la UI
ADD COLUMN IF NOT EXISTS alert_color_hex VARCHAR(7) DEFAULT '#EF4444'; -- color de alerta

-- Agregar índice para duración
CREATE INDEX IF NOT EXISTS idx_meeting_stages_duration ON meeting_stages(duration);

-- Comentarios en las nuevas columnas
COMMENT ON COLUMN meeting_stages.description IS 'Descripción detallada de la etapa';
COMMENT ON COLUMN meeting_stages.duration IS 'Duración de la etapa en segundos';
COMMENT ON COLUMN meeting_stages.color_hex IS 'Color hexadecimal para mostrar en la UI';
COMMENT ON COLUMN meeting_stages.alert_color_hex IS 'Color de alerta cuando el tiempo se agota';

-- ===========================================
-- Función para reordenar etapas (drag & drop)
-- ===========================================
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

-- ===========================================
-- Función para obtener etapas de una reunión
-- ===========================================
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

-- ===========================================
-- Función para crear etapas por defecto
-- ===========================================
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
