import React from 'react'
import { SupabaseStatus } from '../components/SupabaseStatus'

export const Directorio: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Directorio Empresarial
      </h1>
      
      {/* Estado de Supabase */}
      <div className="mb-6">
        <SupabaseStatus />
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">
          Aquí se mostrará el directorio de empresas. Esta página está en
          desarrollo.
        </p>
      </div>
    </div>
  )
}
