// Tipos base para la aplicación
export interface Empresa {
  id: string
  nombre: string
  descripcion: string
  sector: string
  telefono: string
  email: string
  direccion: string
  website?: string
  logo?: string
}

export interface Reunion {
  id: string
  titulo: string
  descripcion: string
  fecha: Date
  hora: string
  participantes: string[]
  estado: 'programada' | 'en-progreso' | 'completada' | 'cancelada'
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'usuario'
  empresaId?: string
}

// Re-exportar tipos de servicios
export type * from '../services/types'

// Re-exportar tipos del timer
export type * from './timer'
