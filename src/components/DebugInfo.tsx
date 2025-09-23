import React, { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export const DebugInfo: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [connectionError, setConnectionError] = useState<string>('')
  const [tableStatus, setTableStatus] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Probar conexión básica
        const { data, error } = await supabase.from('meetings').select('count').limit(1)
        if (error) {
          setConnectionStatus('error')
          setConnectionError(error.message)
          
          // Verificar qué tablas existen
          const tables = ['meetings', 'meeting_sessions', 'meeting_stages', 'participants']
          const tableResults: {[key: string]: boolean} = {}
          
          for (const table of tables) {
            try {
              const { error: tableError } = await supabase.from(table).select('*').limit(1)
              tableResults[table] = !tableError || tableError.code === 'PGRST116'
            } catch {
              tableResults[table] = false
            }
          }
          
          setTableStatus(tableResults)
        } else {
          setConnectionStatus('connected')
        }
      } catch (err) {
        setConnectionStatus('error')
        setConnectionError(err instanceof Error ? err.message : 'Error desconocido')
      }
    }

    testConnection()
  }, [])

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'checking': return 'bg-blue-100 text-blue-800'
      case 'connected': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <details className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
        🔧 Información de Debug (Click para expandir)
      </summary>
      <div className="mt-4 text-xs text-gray-600 space-y-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'No configurado'}</p>
            <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado'}</p>
            <p><strong>App Name:</strong> {import.meta.env.VITE_APP_NAME || 'No configurado'}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          </div>
          <div>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            <p><strong>Build:</strong> {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
            <p><strong>Updated:</strong> {new Date().toLocaleString()}</p>
            <p><strong>Force Deploy:</strong> {Date.now()}</p>
          </div>
        </div>
        
        <div className={`p-2 rounded mt-2 text-sm ${getStatusColor()}`}>
          <strong>Conexión Supabase:</strong> {
            connectionStatus === 'checking' ? 'Verificando...' :
            connectionStatus === 'connected' ? '✅ Conectado' :
            `❌ Error: ${connectionError}`
          }
        </div>
        
        {Object.keys(tableStatus).length > 0 && (
          <div className="p-2 rounded mt-2 bg-white border">
            <strong className="text-sm">Estado de Tablas:</strong>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
              {Object.entries(tableStatus).map(([table, exists]) => (
                <div key={table} className={`text-xs ${exists ? 'text-green-600' : 'text-red-600'}`}>
                  {exists ? '✅' : '❌'} {table}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  )
}