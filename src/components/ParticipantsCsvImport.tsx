import React, { useState, useCallback } from 'react'
import { bulkImportParticipants } from '../services/participants'
import type { BulkImportRow } from '../services/types'

interface ParticipantsCsvImportProps {
  onImportComplete?: (result: { success: number; errors: string[] }) => void
  onClose?: () => void
}

interface ParsedRow {
  full_name: string
  email: string
  phone?: string
  venture_name?: string
  venture_code?: string
  company?: string
  role?: string
  rowNumber: number
  isValid: boolean
  errors: string[]
}

// Función simple para parsear CSV (alternativa a Papa Parse)
const parseCSV = (csvText: string): { headers: string[]; rows: string[][] } => {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/"/g, ''))
  )

  return { headers, rows }
}

// Mapeo de encabezados tolerantes
const normalizeHeader = (header: string): string => {
  const headerMap: Record<string, string> = {
    'full_name': 'full_name',
    'name': 'full_name',
    'nombre': 'full_name',
    'email': 'email',
    'correo': 'email',
    'phone': 'phone',
    'telefono': 'phone',
    'teléfono': 'phone',
    'telefone': 'phone',
    'venture_name': 'venture_name',
    'emprendimiento': 'venture_name',
    'empresa': 'venture_name',
    'company': 'company',
    'venture_code': 'venture_code',
    'codigo': 'venture_code',
    'código': 'venture_code',
    'code': 'venture_code',
    'role': 'role',
    'rol': 'role',
    'cargo': 'role'
  }

  const normalized = header.toLowerCase().trim()
  return headerMap[normalized] || normalized
}

// Validación básica de datos
const validateRow = (row: Record<string, string>, rowNumber: number): ParsedRow => {
  const errors: string[] = []
  
  // Validar campos requeridos
  if (!row.full_name || row.full_name.trim() === '') {
    errors.push('Nombre completo es requerido')
  }
  
  if (!row.email || row.email.trim() === '') {
    errors.push('Email es requerido')
  } else if (!/\S+@\S+\.\S+/.test(row.email)) {
    errors.push('Email no tiene formato válido')
  }

  // Validar opcionales si están presentes
  if (row.phone && row.phone.trim() !== '' && !/^[\d\s\-\+\(\)]+$/.test(row.phone)) {
    errors.push('Teléfono contiene caracteres inválidos')
  }

  return {
    full_name: row.full_name?.trim() || '',
    email: row.email?.trim() || '',
    phone: row.phone?.trim() || undefined,
    venture_name: row.venture_name?.trim() || undefined,
    venture_code: row.venture_code?.trim() || undefined,
    company: row.company?.trim() || undefined,
    role: row.role?.trim() || undefined,
    rowNumber,
    isValid: errors.length === 0,
    errors
  }
}

export const ParticipantsCsvImport: React.FC<ParticipantsCsvImportProps> = ({
  onImportComplete,
  onClose
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV válido')
      return
    }

    setIsLoading(true)
    setError(null)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string
        const { headers, rows } = parseCSV(csvText)

        if (headers.length === 0) {
          setError('El archivo CSV está vacío o no tiene encabezados')
          setIsLoading(false)
          return
        }

        // Normalizar encabezados
        const normalizedHeaders = headers.map(normalizeHeader)
        
        // Parsear filas
        const parsedRows = rows.map((row, index) => {
          const rowData: Record<string, string> = {}
          normalizedHeaders.forEach((header, colIndex) => {
            rowData[header] = row[colIndex] || ''
          })
          return validateRow(rowData, index + 2) // +2 porque empezamos desde fila 2 (después del header)
        })

        setParsedData(parsedRows)
      } catch (err) {
        setError('Error al procesar el archivo CSV: ' + (err instanceof Error ? err.message : 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Error al leer el archivo')
      setIsLoading(false)
    }

    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleImport = async () => {
    const validRows = parsedData.filter(row => row.isValid)
    
    if (validRows.length === 0) {
      setError('No hay filas válidas para importar')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const bulkRows: BulkImportRow[] = validRows.map(row => ({
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        venture_name: row.venture_name,
        venture_code: row.venture_code,
        company: row.company,
        role: row.role
      }))

      const result = await bulkImportParticipants(bulkRows)
      
      if (result.error) {
        setError(result.error)
        return
      }

      setImportResult(result.data || { success: 0, errors: [] })
      onImportComplete?.(result.data || { success: 0, errors: [] })
    } catch (err) {
      setError('Error al importar participantes: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setIsImporting(false)
    }
  }

  const validRows = parsedData.filter(row => row.isValid)
  const invalidRows = parsedData.filter(row => !row.isValid)

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Procesando archivo...</span>
          </div>
        ) : (
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra tu archivo CSV aquí
            </p>
            <p className="text-gray-600 mb-4">
              o haz clic para seleccionar un archivo
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Seleccionar Archivo
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Formatos soportados: CSV. Encabezados tolerantes: full_name|name, email, phone|telefono, venture_name|emprendimiento, venture_code|codigo
            </p>
          </div>
        )}
      </div>

      {/* Errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado de importación */}
      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Importación Completada</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Se importaron {importResult.success} participantes exitosamente.</p>
                {importResult.errors.length > 0 && (
                  <p className="mt-1">Errores: {importResult.errors.length}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview de datos */}
      {parsedData.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Vista Previa de Datos
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {validRows.length} filas válidas, {invalidRows.length} filas con errores
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setParsedData([])
                    setImportResult(null)
                    setError(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || isImporting}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    validRows.length === 0 || isImporting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isImporting ? 'Importando...' : `Importar ${validRows.length} participantes`}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emprendimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Errores
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((row, index) => (
                  <tr key={index} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Válido
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Error
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.venture_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.venture_code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.errors.length > 0 && (
                        <div className="text-red-600">
                          {row.errors.map((error, i) => (
                            <div key={i} className="text-xs">{error}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}
