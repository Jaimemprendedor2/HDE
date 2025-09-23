import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'

export const DebugInfo: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [connectionError, setConnectionError] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('meetings').select('count').limit(1)
        if (error) {
          setConnectionStatus('error')
          setConnectionError(error.message)
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
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h2 className="text-lg font-bold text-yellow-800">Debug Info</h2>
      <div className="text-sm text-yellow-700 space-y-1">
        <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'No configurado'}</p>
        <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado'}</p>
        <p><strong>App Name:</strong> {import.meta.env.VITE_APP_NAME || 'No configurado'}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        <p><strong>Build:</strong> {import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
        <p><strong>Updated:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Force Deploy:</strong> {Date.now()}</p>
        <div className={`p-2 rounded mt-2 ${getStatusColor()}`}>
          <strong>Conexión Supabase:</strong> {
            connectionStatus === 'checking' ? 'Verificando...' :
            connectionStatus === 'connected' ? '✅ Conectado' :
            `❌ Error: ${connectionError}`
          }
        </div>
      </div>
    </div>
  )
}
