import { Empresa, Reunion } from '../types'

// Tipos para RequestInit
interface RequestInit {
  headers?: Record<string, string>
  method?: string
  body?: string
}

// Configuración base de la API
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api'

class ApiService {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Métodos para empresas
  async getEmpresas(): Promise<Empresa[]> {
    return this.request<Empresa[]>('/empresas')
  }

  async getEmpresa(id: string): Promise<Empresa> {
    return this.request<Empresa>(`/empresas/${id}`)
  }

  async createEmpresa(empresa: Omit<Empresa, 'id'>): Promise<Empresa> {
    return this.request<Empresa>('/empresas', {
      method: 'POST',
      body: JSON.stringify(empresa),
    })
  }

  async updateEmpresa(id: string, empresa: Partial<Empresa>): Promise<Empresa> {
    return this.request<Empresa>(`/empresas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(empresa),
    })
  }

  async deleteEmpresa(id: string): Promise<void> {
    return this.request<void>(`/empresas/${id}`, {
      method: 'DELETE',
    })
  }

  // Métodos para reuniones
  async getReuniones(): Promise<Reunion[]> {
    return this.request<Reunion[]>('/reuniones')
  }

  async getReunion(id: string): Promise<Reunion> {
    return this.request<Reunion>(`/reuniones/${id}`)
  }

  async createReunion(reunion: Omit<Reunion, 'id'>): Promise<Reunion> {
    return this.request<Reunion>('/reuniones', {
      method: 'POST',
      body: JSON.stringify(reunion),
    })
  }

  async updateReunion(id: string, reunion: Partial<Reunion>): Promise<Reunion> {
    return this.request<Reunion>(`/reuniones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reunion),
    })
  }

  async deleteReunion(id: string): Promise<void> {
    return this.request<void>(`/reuniones/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiService = new ApiService(API_BASE_URL)
