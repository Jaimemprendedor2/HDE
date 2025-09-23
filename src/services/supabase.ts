import { createClient } from '@supabase/supabase-js'

// Validar variables de entorno en desarrollo
const validateSupabaseEnv = () => {
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      '❌ VITE_SUPABASE_URL no está definida. Por favor, agrega esta variable a tu archivo .env'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      '❌ VITE_SUPABASE_ANON_KEY no está definida. Por favor, agrega esta variable a tu archivo .env'
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Obtener variables de entorno con validación
const { supabaseUrl, supabaseAnonKey } = validateSupabaseEnv()

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Exportar configuración para uso en otros archivos
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
}

// Función para verificar conexión
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('_health_check').select('*').limit(1)
    if (error && error.code !== 'PGRST116') {
      // PGRST116 es "relation does not exist" que es normal si no hay tabla de health check
      console.warn('⚠️ Supabase conectado pero sin tabla de health check:', error.message)
    }
    return true
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error)
    return false
  }
}

// Función para obtener información del proyecto
export const getSupabaseInfo = () => {
  return {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    isConfigured: !!(supabaseUrl && supabaseAnonKey),
  }
}
