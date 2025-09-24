import React, { useEffect, useState } from 'react'
import { timerCore, TimerCoreState } from '../lib/timerCore'
import { supabase } from '../services/supabase'

export const DebugInfo: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [connectionError, setConnectionError] = useState<string>('')
  const [tableStatus, setTableStatus] = useState<{[key: string]: boolean}>({})
  const [timerState, setTimerState] = useState<TimerCoreState>({
    running: false,
    remainingSeconds: 0,
    currentStageIndex: 0,
    adjustments: 0
  })

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

  // Cargar información del build si está disponible
  const [buildInfo, setBuildInfo] = useState<any>(null)

  useEffect(() => {
    // Intentar cargar build-info.json
    fetch('/build-info.json')
      .then(res => res.json())
      .then(data => setBuildInfo(data))
      .catch(() => setBuildInfo(null))
  }, [])

  // Suscribirse al estado del cronómetro core para monitoreo
  useEffect(() => {
    const unsubscribe = timerCore.subscribe((state) => {
      setTimerState(state)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <details className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center justify-between">
        <span>🔧 Información de Debug y Versión (Click para expandir)</span>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-mono">
          {buildInfo?.autoVersion || import.meta.env.VITE_APP_VERSION || 'v1.0.0'}
        </span>
      </summary>
      <div className="mt-4 text-xs text-gray-600 space-y-1">
        {/* Información de Versión Destacada */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">📱 Información de Versión</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Versión:</strong> <span className="font-mono bg-blue-100 px-1 rounded">{buildInfo?.autoVersion || import.meta.env.VITE_APP_VERSION || 'v1.0.0'}</span></div>
                <div><strong>Deploy ID:</strong> <span className="font-mono">{buildInfo?.deployId || 'N/A'}</span></div>
                <div><strong>Git Hash:</strong> <span className="font-mono">{buildInfo?.buildHashShort || 'N/A'}</span></div>
                <div><strong>Build Date:</strong> {buildInfo?.buildDate ? new Date(buildInfo.buildDate).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 font-mono">
                {buildInfo?.autoVersion || import.meta.env.VITE_APP_VERSION || 'v1.0.0'}
              </div>
              <div className="text-xs text-blue-500 mt-1">
                {buildInfo?.environment || import.meta.env.MODE || 'development'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'No configurado'}</p>
            <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado'}</p>
            <p><strong>App Name:</strong> {import.meta.env.VITE_APP_NAME || 'No configurado'}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          </div>
          <div>
            <p><strong>Versión:</strong> {buildInfo?.autoVersion || import.meta.env.VITE_APP_VERSION || '1.0.0'}</p>
            <p><strong>Deploy ID:</strong> {buildInfo?.deployId || 'N/A'}</p>
            <p><strong>Build Date:</strong> {buildInfo?.buildDate ? new Date(buildInfo.buildDate).toLocaleString() : new Date().toLocaleString()}</p>
            <p><strong>Git Hash:</strong> {buildInfo?.buildHashShort || 'N/A'}</p>
          </div>
        </div>
        
        {buildInfo && (
          <div className="mt-4 p-3 bg-white border rounded">
            <strong className="text-sm">🔨 Información de Build:</strong>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1 text-xs">
              <div><strong>Branch:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{buildInfo.buildBranch}</span></div>
              <div><strong>Commits:</strong> <span className="font-mono">{buildInfo.commitCount}</span></div>
              <div><strong>Autor:</strong> <span className="font-mono">{buildInfo.buildAuthor}</span></div>
              <div><strong>Último Tag:</strong> <span className="font-mono">{buildInfo.lastTag}</span></div>
            </div>
            <div className="mt-2 pt-2 border-t text-xs">
              <div><strong>Commit:</strong> <span className="font-mono bg-gray-100 px-1 rounded text-xs">{buildInfo.buildCommit}</span></div>
            </div>
          </div>
        )}
        
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

        {/* Estado del Cronómetro Core */}
        <div className="p-3 rounded mt-4 bg-purple-50 border border-purple-200">
          <strong className="text-sm text-purple-900">⏱️ Estado del Cronómetro Core (Reflejo en Tiempo Real)</strong>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div className="bg-white p-2 rounded border">
              <div className="text-xs text-gray-600 mb-1">Estado</div>
              <div className={`text-sm font-mono ${timerState.running ? 'text-green-600' : 'text-gray-600'}`}>
                {timerState.running ? '▶️ Ejecutándose' : '⏸️ Pausado'}
              </div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-xs text-gray-600 mb-1">Tiempo Restante</div>
              <div className="text-sm font-mono text-blue-600">
                {Math.floor(timerState.remainingSeconds / 60)}:{(timerState.remainingSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-xs text-gray-600 mb-1">Etapa Actual</div>
              <div className="text-sm font-mono text-orange-600">
                #{timerState.currentStageIndex + 1}
              </div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="text-xs text-gray-600 mb-1">Ajustes</div>
              <div className={`text-sm font-mono ${timerState.adjustments === 0 ? 'text-gray-600' : timerState.adjustments > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {timerState.adjustments > 0 ? '+' : ''}{timerState.adjustments}s
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-700">
            💡 Esta información se actualiza en tiempo real desde el timerCore singleton
          </div>
        </div>
      </div>
    </details>
  )
}