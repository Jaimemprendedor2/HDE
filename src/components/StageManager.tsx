import React, { useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'

interface Stage {
  id: string
  meeting_id: string
  stage_name: string
  description?: string
  duration: number
  color_hex: string
  alert_color_hex: string
  stage_order: number
  status: string
  start_time?: string
  end_time?: string
}

interface StageManagerProps {
  meetingId: string
  stages: Stage[]
  onStagesUpdate: (stages: Stage[]) => void
}

export const StageManager: React.FC<StageManagerProps> = ({
  meetingId,
  stages,
  onStagesUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Formulario para nueva etapa
  const [newStage, setNewStage] = useState({
    stage_name: '',
    description: '',
    duration: 300, // 5 minutos por defecto
    color_hex: '#3B82F6',
    alert_color_hex: '#EF4444'
  })

  const dragCounter = useRef(0)
  const sortedStages = [...stages].sort((a, b) => a.stage_order - b.stage_order)

  const handleAddStage = async () => {
    if (!newStage.stage_name.trim()) return

    try {
      setLoading(true)
      setError(null)

      const maxOrder = Math.max(...stages.map(s => s.stage_order), 0)
      
      const { data, error: insertError } = await supabase
        .from('meeting_stages')
        .insert({
          meeting_id: meetingId,
          stage_name: newStage.stage_name,
          description: newStage.description,
          duration: newStage.duration,
          color_hex: newStage.color_hex,
          alert_color_hex: newStage.alert_color_hex,
          stage_order: maxOrder + 1,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Actualizar lista local
      onStagesUpdate([...stages, data])
      
      // Resetear formulario
      setNewStage({
        stage_name: '',
        description: '',
        duration: 300,
        color_hex: '#3B82F6',
        alert_color_hex: '#EF4444'
      })
      setShowAddForm(false)

    } catch (err) {
      console.error('Error agregando etapa:', err)
      setError('Error al agregar la etapa')
    } finally {
      setLoading(false)
    }
  }

  const handleEditStage = async (stage: Stage) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('meeting_stages')
        .update({
          stage_name: stage.stage_name,
          description: stage.description,
          duration: stage.duration,
          color_hex: stage.color_hex,
          alert_color_hex: stage.alert_color_hex
        })
        .eq('id', stage.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Actualizar lista local
      const updatedStages = stages.map(s => s.id === stage.id ? data : s)
      onStagesUpdate(updatedStages)
      setEditingStage(null)

    } catch (err) {
      console.error('Error actualizando etapa:', err)
      setError('Error al actualizar la etapa')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta etapa?')) return

    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('meeting_stages')
        .delete()
        .eq('id', stageId)

      if (deleteError) throw deleteError

      // Actualizar lista local
      const updatedStages = stages.filter(s => s.id !== stageId)
      onStagesUpdate(updatedStages)

    } catch (err) {
      console.error('Error eliminando etapa:', err)
      setError('Error al eliminar la etapa')
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    dragCounter.current = 0
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragCounter.current++
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverIndex(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Crear nuevo orden de etapas
      const newStages = [...sortedStages]
      const draggedStage = newStages[draggedIndex]
      
      // Remover elemento arrastrado
      newStages.splice(draggedIndex, 1)
      // Insertar en nueva posición
      newStages.splice(dropIndex, 0, draggedStage)

      // Actualizar stage_order para todas las etapas
      const stageOrders: Record<string, number> = {}
      newStages.forEach((stage, index) => {
        stageOrders[stage.id] = index + 1
      })

      // Llamar función de reordenamiento en la base de datos
      const { error: reorderError } = await supabase
        .rpc('reorder_meeting_stages', {
          p_meeting_id: meetingId,
          p_stage_orders: stageOrders
        })

      if (reorderError) throw reorderError

      // Actualizar estado local
      const updatedStages = newStages.map((stage, index) => ({
        ...stage,
        stage_order: index + 1
      }))
      onStagesUpdate(updatedStages)

    } catch (err) {
      console.error('Error reordenando etapas:', err)
      setError('Error al reordenar las etapas')
    } finally {
      setLoading(false)
      setDraggedIndex(null)
      setDragOverIndex(null)
      dragCounter.current = 0
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Configuración de Etapas
          </h3>
          <p className="text-sm text-gray-600">
            Arrastra las etapas para reordenarlas. Haz clic para editar.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Agregar Etapa
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stage Form */}
      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Agregar Nueva Etapa
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Etapa *
              </label>
              <input
                type="text"
                value={newStage.stage_name}
                onChange={(e) => setNewStage(prev => ({ ...prev, stage_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Presentación de participantes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (segundos)
              </label>
              <input
                type="number"
                value={newStage.duration}
                onChange={(e) => setNewStage(prev => ({ ...prev, duration: parseInt(e.target.value) || 300 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="30"
                step="30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={newStage.description}
                onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción opcional de la etapa..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Principal
              </label>
              <input
                type="color"
                value={newStage.color_hex}
                onChange={(e) => setNewStage(prev => ({ ...prev, color_hex: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de Alerta
              </label>
              <input
                type="color"
                value={newStage.alert_color_hex}
                onChange={(e) => setNewStage(prev => ({ ...prev, alert_color_hex: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-300"
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleAddStage}
              disabled={loading || !newStage.stage_name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Agregando...' : 'Agregar Etapa'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Stages List */}
      <div className="space-y-3">
        {sortedStages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No hay etapas configuradas aún.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Agregar la primera etapa
            </button>
          </div>
        ) : (
          sortedStages.map((stage, index) => (
            <div
              key={stage.id}
              draggable={!editingStage}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-white border rounded-lg p-4 transition-all ${
                dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              } ${draggedIndex === index ? 'opacity-50' : ''} ${
                !editingStage ? 'cursor-move hover:shadow-md' : ''
              }`}
            >
              {editingStage?.id === stage.id ? (
                <EditStageForm
                  stage={editingStage}
                  onSave={handleEditStage}
                  onCancel={() => setEditingStage(null)}
                  onChange={setEditingStage}
                  loading={loading}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Drag Handle */}
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: stage.color_hex }}
                        />
                        <span className="text-sm font-medium text-gray-500">
                          Etapa {stage.stage_order}
                        </span>
                        <h4 className="font-medium text-gray-900">
                          {stage.stage_name}
                        </h4>
                        <span className="text-sm text-gray-600 font-mono">
                          {formatDuration(stage.duration)}
                        </span>
                      </div>
                      {stage.description && (
                        <p className="text-sm text-gray-600 ml-7">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingStage(stage)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Editar etapa"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteStage(stage.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar etapa"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Componente para editar etapa
interface EditStageFormProps {
  stage: Stage
  onSave: (stage: Stage) => void
  onCancel: () => void
  onChange: (stage: Stage) => void
  loading: boolean
}

const EditStageForm: React.FC<EditStageFormProps> = ({
  stage,
  onSave,
  onCancel,
  onChange,
  loading
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la Etapa
          </label>
          <input
            type="text"
            value={stage.stage_name}
            onChange={(e) => onChange({ ...stage, stage_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración (segundos)
          </label>
          <input
            type="number"
            value={stage.duration}
            onChange={(e) => onChange({ ...stage, duration: parseInt(e.target.value) || 300 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="30"
            step="30"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={stage.description || ''}
            onChange={(e) => onChange({ ...stage, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Principal
          </label>
          <input
            type="color"
            value={stage.color_hex}
            onChange={(e) => onChange({ ...stage, color_hex: e.target.value })}
            className="w-full h-10 rounded-lg border border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color de Alerta
          </label>
          <input
            type="color"
            value={stage.alert_color_hex}
            onChange={(e) => onChange({ ...stage, alert_color_hex: e.target.value })}
            className="w-full h-10 rounded-lg border border-gray-300"
          />
        </div>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => onSave(stage)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
