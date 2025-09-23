import { create } from 'zustand'
import { Empresa, Reunion, Usuario } from '../types'

interface AppState {
  // Estado de autenticación
  usuario: Usuario | null
  isAuthenticated: boolean

  // Estado de datos
  empresas: Empresa[]
  reuniones: Reunion[]

  // Estado de UI
  isLoading: boolean
  error: string | null

  // Acciones
  setUsuario: (usuario: Usuario | null) => void
  setEmpresas: (empresas: Empresa[]) => void
  setReuniones: (reuniones: Reunion[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>(set => ({
  // Estado inicial
  usuario: null,
  isAuthenticated: false,
  empresas: [],
  reuniones: [],
  isLoading: false,
  error: null,

  // Acciones
  setUsuario: usuario =>
    set({
      usuario,
      isAuthenticated: !!usuario,
    }),

  setEmpresas: empresas => set({ empresas }),

  setReuniones: reuniones => set({ reuniones }),

  setLoading: isLoading => set({ isLoading }),

  setError: error => set({ error }),

  logout: () =>
    set({
      usuario: null,
      isAuthenticated: false,
      empresas: [],
      reuniones: [],
    }),
}))
