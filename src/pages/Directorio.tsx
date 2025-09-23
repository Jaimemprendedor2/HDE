import React from 'react'

export const Directorio: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Directorio Empresarial
      </h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Gestión de Directorios
        </h2>
        
        <p className="text-gray-600 mb-6">
          Para crear y gestionar directorios empresariales, utiliza el flujo principal de la aplicación.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Tip:</strong> Ve al inicio de la aplicación para seleccionar el tipo de actividad y crear un nuevo directorio.
          </p>
        </div>
      </div>
    </div>
  )
}
