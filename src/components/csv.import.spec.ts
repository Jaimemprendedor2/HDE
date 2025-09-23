import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ParticipantsCsvImport } from './ParticipantsCsvImport'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock del servicio de participantes
vi.mock('../services/participants', () => ({
  bulkImportParticipants: vi.fn()
}))

// Mock de React hooks para testing
const mockUseCallback = vi.fn((fn) => fn)
const mockUseState = vi.fn((initial) => [initial, vi.fn()])

// Helper para crear archivos CSV en tests
const createCSVFile = (content: string, filename = 'test.csv') => {
  const file = new File([content], filename, { type: 'text/csv' })
  return file
}

// Helper para simular drag and drop
const createDragEvent = (files: File[]) => {
  return {
    preventDefault: vi.fn(),
    dataTransfer: {
      files
    }
  }
}

describe('CSV Import Component', () => {
  const defaultProps = {
    onImportComplete: vi.fn(),
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CSV parsing with mixed headers', () => {
    it('should parse CSV with standard headers', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should parse CSV with mixed Spanish headers', async () => {
      const csvContent = `nombre,correo,telefono,emprendimiento,codigo
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should parse CSV with mixed English/Spanish headers', async () => {
      const csvContent = `name,email,telefono,empresa,code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should handle headers with extra whitespace and quotes', async () => {
      const csvContent = `" full_name ",email, " phone ",venture_name, venture_code 
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should handle case-insensitive headers', async () => {
      const csvContent = `FULL_NAME,EMAIL,PHONE,VENTURE_NAME,VENTURE_CODE
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })
  })

  describe('edge cases and validation', () => {
    it('should handle empty CSV file', async () => {
      const csvContent = `full_name,email`
      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('No hay filas válidas para importar')).toBeInTheDocument()
      })
    })

    it('should handle CSV with only headers', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code`
      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('No hay filas válidas para importar')).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
,juan@example.com,123456789,Empresa A,EMP001
María García,,987654321,Empresa B,EMP002
Juan Pérez,juan@invalid-email,123456789,Empresa C,EMP003`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        // Should show validation errors
        expect(screen.getByText('Nombre completo es requerido')).toBeInTheDocument()
        expect(screen.getByText('Email es requerido')).toBeInTheDocument()
        expect(screen.getByText('Email no tiene formato válido')).toBeInTheDocument()
      })
    })

    it('should handle malformed CSV with missing columns', async () => {
      const csvContent = `full_name,email
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001
María García,maria@example.com`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should handle CSV with extra columns', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code,extra_column,another_column
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001,extra1,extra2
María García,maria@example.com,987654321,Empresa B,EMP002,extra3,extra4`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
      })
    })

    it('should handle CSV with quoted values containing commas', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
"Pérez, Juan",juan@example.com,123456789,"Empresa A, S.A.",EMP001
"García, María",maria@example.com,987654321,"Empresa B, Ltda.",EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Pérez, Juan')).toBeInTheDocument()
        expect(screen.getByText('García, María')).toBeInTheDocument()
        expect(screen.getByText('Empresa A, S.A.')).toBeInTheDocument()
        expect(screen.getByText('Empresa B, Ltda.')).toBeInTheDocument()
      })
    })

    it('should handle CSV with escaped quotes', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
"O""Connor, John",john@example.com,123456789,"Empresa ""Especial""",EMP001
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('O"Connor, John')).toBeInTheDocument()
        expect(screen.getByText('Empresa "Especial"')).toBeInTheDocument()
      })
    })

    it('should handle phone number validation', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,+1234567890,Empresa A,EMP001
María García,maria@example.com,(123) 456-7890,Empresa B,EMP002
Pedro López,pedro@example.com,123-456-7890,Empresa C,EMP003
Ana Ruiz,ana@example.com,123abc456,Empresa D,EMP004`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        // First three should be valid
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María García')).toBeInTheDocument()
        expect(screen.getByText('Pedro López')).toBeInTheDocument()
        
        // Last one should show validation error
        expect(screen.getByText('Teléfono contiene caracteres inválidos')).toBeInTheDocument()
      })
    })

    it('should handle large CSV files', async () => {
      const rows = []
      rows.push('full_name,email,phone,venture_name,venture_code')
      
      for (let i = 1; i <= 100; i++) {
        rows.push(`Usuario ${i},usuario${i}@example.com,123456789${i},Empresa ${i},EMP${i.toString().padStart(3, '0')}`)
      }
      
      const csvContent = rows.join('\n')
      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Usuario 1')).toBeInTheDocument()
        expect(screen.getByText('Usuario 100')).toBeInTheDocument()
        expect(screen.getByText('100 filas válidas, 0 filas con errores')).toBeInTheDocument()
      })
    })
  })

  describe('file handling', () => {
    it('should reject non-CSV files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Por favor selecciona un archivo CSV válido')).toBeInTheDocument()
      })
    })

    it('should handle drag and drop', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const dropzone = screen.getByText(/arrastra tu archivo csv aquí/i)
      const dragEvent = createDragEvent([file])
      
      fireEvent.drop(dropzone, dragEvent)
      
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })
    })

    it('should handle multiple files by selecting the first one', async () => {
      const csvContent1 = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001`

      const csvContent2 = `full_name,email,phone,venture_name,venture_code
María García,maria@example.com,987654321,Empresa B,EMP002`

      const file1 = createCSVFile(csvContent1, 'file1.csv')
      const file2 = createCSVFile(csvContent2, 'file2.csv')
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file1, file2] } })
      
      await waitFor(() => {
        // Should only process the first file
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.queryByText('María García')).not.toBeInTheDocument()
      })
    })
  })

  describe('import functionality', () => {
    it('should show import button when there are valid rows', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Importar 1 participantes')).toBeInTheDocument()
      })
    })

    it('should disable import button when there are no valid rows', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
,juan@example.com,123456789,Empresa A,EMP001`

      const file = createCSVFile(csvContent)
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        const importButton = screen.getByText('Importar 0 participantes')
        expect(importButton).toBeDisabled()
      })
    })

    it('should show loading state during import', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001`

      const file = createCSVFile(csvContent)
      
      // Mock async import
      const { bulkImportParticipants } = await import('../services/participants')
      vi.mocked(bulkImportParticipants).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { success: 1, errors: [] }, error: null }), 100))
      )
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        const importButton = screen.getByText('Importar 1 participantes')
        fireEvent.click(importButton)
      })
      
      expect(screen.getByText('Importando...')).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      // Mock FileReader to throw error
      const originalFileReader = global.FileReader
      global.FileReader = vi.fn(() => ({
        readAsText: vi.fn(),
        addEventListener: vi.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback({ error: 'File read error' }), 10)
          }
        }),
        removeEventListener: vi.fn()
      })) as any
      
      const file = createCSVFile('content')
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Error al leer el archivo')).toBeInTheDocument()
      })
      
      global.FileReader = originalFileReader
    })

    it('should handle import service errors', async () => {
      const csvContent = `full_name,email,phone,venture_name,venture_code
Juan Pérez,juan@example.com,123456789,Empresa A,EMP001`

      const file = createCSVFile(csvContent)
      
      // Mock import service to return error
      const { bulkImportParticipants } = await import('../services/participants')
      vi.mocked(bulkImportParticipants).mockResolvedValue({
        data: null,
        error: 'Database connection failed'
      })
      
      render(<ParticipantsCsvImport {...defaultProps} />)
      
      const fileInput = screen.getByLabelText(/seleccionar archivo/i)
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        const importButton = screen.getByText('Importar 1 participantes')
        fireEvent.click(importButton)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Database connection failed')).toBeInTheDocument()
      })
    })
  })
})
