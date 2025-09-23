import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { routes } from '../app/routes'

export const Navigation: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: routes.directorio, label: 'Directorio', icon: '📋' },
    { path: routes.meeting, label: 'Reuniones', icon: '📅' },
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                location.pathname === item.path
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
