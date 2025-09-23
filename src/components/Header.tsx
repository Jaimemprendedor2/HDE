import React from 'react'

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Housenovo Directorios Empresariales
          </h1>
        </div>
      </div>
    </header>
  )
}

export default Header
