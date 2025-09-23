import React, { useState, useEffect } from 'react'
import { getSupabaseInfo, testSupabaseConnection } from '../services/supabaseClient'

export const SupabaseStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const info = getSupabaseInfo()
        
        if (!info.isConfigured) {
          setError('❌ Supabase no está configurado correctamente')
          setIsConnected(false)
          return
        }

        const connected = await testSupabaseConnection()
        setIsConnected(connected)
        
        if (!connected) {
          setError('❌ No se pudo conectar a Supabase')
        }
      } catch (err) {
        setError(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnection()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800">Verificando conexión a Supabase...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-4 ${
      isConnected 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className={`font-medium ${
          isConnected ? 'text-green-800' : 'text-red-800'
        }`}>
          {isConnected ? '✅ Supabase conectado' : '❌ Supabase desconectado'}
        </span>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {!isConnected && (
        <div className="mt-2 text-sm text-red-700">
          <p>Por favor, configura las variables de entorno:</p>
          <ul className="list-disc list-inside mt-1">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default SupabaseStatus
