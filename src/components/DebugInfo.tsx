import React from 'react'

export const DebugInfo: React.FC = () => {
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h2 className="text-lg font-bold text-yellow-800">Debug Info</h2>
      <div className="text-sm text-yellow-700">
        <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'No configurado'}</p>
        <p><strong>Supabase Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'No configurado'}</p>
        <p><strong>App Name:</strong> {import.meta.env.VITE_APP_NAME || 'No configurado'}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      </div>
    </div>
  )
}
