import React, { useState, useEffect } from 'react'
import type { Stage, TimerColor } from '../types/timer'

interface StageColorConfigProps {
  stage?: Stage
  onStageUpdate?: (updatedStage: Stage) => void
  onSave?: (stage: Stage) => void
}

interface ColorPoint {
  timeInSeconds: number
  backgroundColor: string
}

export const StageColorConfig: React.FC<StageColorConfigProps> = ({
  stage,
  onStageUpdate,
  onSave
}) => {
  const [colors, setColors] = useState<ColorPoint[]>([])
  const [alertSeconds, setAlertSeconds] = useState(15)
  const [alertColor, setAlertColor] = useState('#ef4444')
  const [duration, setDuration] = useState(600) // 10 minutos por defecto
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Inicializar datos desde el stage prop
  useEffect(() => {
    if (stage) {
      setTitle(stage.title)
      setDescription(stage.description || '')
      setDuration(stage.duration)
      setAlertSeconds(stage.alertSeconds || 15)
      setAlertColor(stage.alertColor || '#ef4444')
      setColors(stage.colors || [])
    }
  }, [stage])

  // Generar colores por defecto si no hay ninguno
  useEffect(() => {
    if (colors.length === 0 && duration > 0) {
      const defaultColors: ColorPoint[] = [
        { timeInSeconds: 0, backgroundColor: '#10b981' }, // Verde al inicio
        { timeInSeconds: Math.floor(duration * 0.5), backgroundColor: '#f59e0b' }, // Amarillo a la mitad
        { timeInSeconds: duration, backgroundColor: '#ef4444' } // Rojo al final
      ]
      setColors(defaultColors)
    }
  }, [duration, colors.length])

  const addColorPoint = () => {
    const newColor: ColorPoint = {
      timeInSeconds: Math.floor(duration / 2),
      backgroundColor: '#6366f1'
    }
    const newColors = [...colors, newColor].sort((a, b) => a.timeInSeconds - b.timeInSeconds)
    setColors(newColors)
  }

  const updateColorPoint = (index: number, field: keyof ColorPoint, value: string | number) => {
    const newColors = [...colors]
    newColors[index] = { ...newColors[index], [field]: value }
    setColors(newColors)
  }

  const removeColorPoint = (index: number) => {
    if (colors.length > 1) {
      const newColors = colors.filter((_, i) => i !== index)
      setColors(newColors)
    }
  }

  const updateStageData = () => {
    const updatedStage: Stage = {
      ...stage,
      title,
      description,
      duration,
      alertSeconds,
      alertColor,
      colors: colors.map(color => ({
        timeInSeconds: color.timeInSeconds,
        backgroundColor: color.backgroundColor
      }))
    }
    
    onStageUpdate?.(updatedStage)
  }

  const handleSave = () => {
    const stageToSave: Stage = {
      ...stage,
      title,
      description,
      duration,
      alertSeconds,
      alertColor,
      colors: colors.map(color => ({
        timeInSeconds: color.timeInSeconds,
        backgroundColor: color.backgroundColor
      }))
    }
    
    onSave?.(stageToSave)
  }

  // Calcular el color actual basado en el tiempo transcurrido
  const getColorAtTime = (timeInSeconds: number): string => {
    if (colors.length === 0) return '#10b981'
    
    // Encontrar los colores adyacentes
    const sortedColors = [...colors].sort((a, b) => a.timeInSeconds - b.timeInSeconds)
    
    if (timeInSeconds <= sortedColors[0].timeInSeconds) {
      return sortedColors[0].backgroundColor
    }
    
    if (timeInSeconds >= sortedColors[sortedColors.length - 1].timeInSeconds) {
      return sortedColors[sortedColors.length - 1].backgroundColor
    }
    
    // Encontrar los colores entre los cuales estamos
    for (let i = 0; i < sortedColors.length - 1; i++) {
      const current = sortedColors[i]
      const next = sortedColors[i + 1]
      
      if (timeInSeconds >= current.timeInSeconds && timeInSeconds <= next.timeInSeconds) {
        // Interpolar entre los dos colores
        const ratio = (timeInSeconds - current.timeInSeconds) / (next.timeInSeconds - current.timeInSeconds)
        return interpolateColor(current.backgroundColor, next.backgroundColor, ratio)
      }
    }
    
    return '#10b981'
  }

  // Función para interpolar entre dos colores
  const interpolateColor = (color1: string, color2: string, ratio: number): string => {
    const hex1 = color1.replace('#', '')
    const hex2 = color2.replace('#', '')
    
    const r1 = parseInt(hex1.substr(0, 2), 16)
    const g1 = parseInt(hex1.substr(2, 2), 16)
    const b1 = parseInt(hex1.substr(4, 2), 16)
    
    const r2 = parseInt(hex2.substr(0, 2), 16)
    const g2 = parseInt(hex2.substr(2, 2), 16)
    const b2 = parseInt(hex2.substr(4, 2), 16)
    
    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)
    
    return `rgb(${r}, ${g}, ${b})`
  }

  // Formatear tiempo en formato mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Generar timeline para preview
  const generateTimeline = () => {
    const steps = 20 // Número de puntos en la timeline
    const stepSize = duration / steps
    
    return Array.from({ length: steps + 1 }, (_, i) => {
      const time = i * stepSize
      return {
        time,
        color: getColorAtTime(time)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Información básica de la etapa */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configuración de Etapa
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título de la Etapa
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Presentación"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración (segundos)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción de la etapa..."
          />
        </div>
      </div>

      {/* Configuración de alerta */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Configuración de Alerta
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segundos de Alerta
            </label>
            <input
              type="number"
              value={alertSeconds}
              onChange={(e) => setAlertSeconds(parseInt(e.target.value) || 15)}
              min="1"
              max={duration}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tiempo antes del final para mostrar alerta
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color de Alerta
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={alertColor}
                onChange={(e) => setAlertColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                value={alertColor}
                onChange={(e) => setAlertColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Editor de colores */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Colores por Tiempo
          </h3>
          <button
            onClick={addColorPoint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            + Agregar Color
          </button>
        </div>

        <div className="space-y-4">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Tiempo:</label>
                <input
                  type="number"
                  value={color.timeInSeconds}
                  onChange={(e) => updateColorPoint(index, 'timeInSeconds', parseInt(e.target.value) || 0)}
                  min="0"
                  max={duration}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">
                  ({formatTime(color.timeInSeconds)})
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Color:</label>
                <input
                  type="color"
                  value={color.backgroundColor}
                  onChange={(e) => updateColorPoint(index, 'backgroundColor', e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color.backgroundColor}
                  onChange={(e) => updateColorPoint(index, 'backgroundColor', e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {colors.length > 1 && (
                <button
                  onClick={() => removeColorPoint(index)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview de Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Vista Previa de Timeline
        </h3>
        
        <div className="relative">
          {/* Timeline principal */}
          <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
            {generateTimeline().map((point, index) => (
              <div
                key={index}
                className="absolute h-full transition-all duration-300 ease-in-out"
                style={{
                  left: `${(point.time / duration) * 100}%`,
                  width: `${100 / generateTimeline().length}%`,
                  backgroundColor: point.color,
                  opacity: 0.8
                }}
              />
            ))}
          </div>
          
          {/* Marcadores de tiempo */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>00:00</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Línea de alerta */}
          {alertSeconds > 0 && (
            <div
              className="absolute top-0 h-8 w-0.5 bg-gray-800 transition-all duration-300 ease-in-out"
              style={{
                left: `${((duration - alertSeconds) / duration) * 100}%`
              }}
            />
          )}
        </div>

        {/* Indicadores de colores */}
        <div className="mt-4 flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: color.backgroundColor }}
              />
              <span className="text-sm text-gray-700">
                {formatTime(color.timeInSeconds)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={updateStageData}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Actualizar Vista Previa
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  )
}
