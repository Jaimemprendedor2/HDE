import { useEffect, useCallback, useState } from 'react'
import type { ControlAction } from '../types/timer'

interface KeyboardShortcut {
  key: string
  code: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: ControlAction
  description: string
}

interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[]
  enabled: boolean
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: ' ',
    code: 'Space',
    action: 'PLAY',
    description: 'Play/Pause'
  },
  {
    key: 'ArrowRight',
    code: 'ArrowRight',
    action: 'NEXT',
    description: 'Siguiente etapa'
  },
  {
    key: 'ArrowLeft',
    code: 'ArrowLeft',
    action: 'PREV',
    description: 'Etapa anterior'
  },
  {
    key: '=',
    code: 'Equal',
    action: 'ADD30',
    description: 'Agregar 30 segundos'
  },
  {
    key: '-',
    code: 'Minus',
    action: 'SUB30',
    description: 'Restar 30 segundos'
  },
  {
    key: 'r',
    code: 'KeyR',
    action: 'RESET',
    description: 'Reset timer'
  }
]

const STORAGE_KEY = 'keyboard-shortcuts-config'

// Elementos que deben ignorar los shortcuts
const IGNORE_ELEMENTS = [
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON'
]

const IGNORE_ATTRIBUTES = [
  'contenteditable'
]

const IGNORE_ROLES = [
  'textbox',
  'searchbox'
]

const IGNORE_CLASSES = [
  'ql-editor', // Quill editor
  'ProseMirror', // ProseMirror editor
  'CodeMirror', // CodeMirror editor
  'monaco-editor' // Monaco editor
]

interface UseKeyboardShortcutsOptions {
  onAction?: (action: ControlAction) => void
  customShortcuts?: KeyboardShortcut[]
  storageKey?: string
  enabled?: boolean
}

export const useKeyboardShortcuts = (options: UseKeyboardShortcutsOptions = {}) => {
  const {
    onAction,
    customShortcuts,
    storageKey = STORAGE_KEY,
    enabled = true
  } = options

  const [config, setConfig] = useState<KeyboardShortcutsConfig>(() => {
    // Cargar configuración desde localStorage
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          shortcuts: parsed.shortcuts || DEFAULT_SHORTCUTS,
          enabled: parsed.enabled !== undefined ? parsed.enabled : true
        }
      }
    } catch (error) {
      console.warn('Error loading keyboard shortcuts config:', error)
    }

    return {
      shortcuts: customShortcuts || DEFAULT_SHORTCUTS,
      enabled: true
    }
  })

  // Guardar configuración en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(config))
    } catch (error) {
      console.warn('Error saving keyboard shortcuts config:', error)
    }
  }, [config, storageKey])

  // Verificar si el elemento debe ignorar shortcuts
  const shouldIgnoreElement = useCallback((element: Element): boolean => {
    // Verificar tag name
    if (IGNORE_ELEMENTS.includes(element.tagName)) {
      return true
    }

    // Verificar atributos
    for (const attr of IGNORE_ATTRIBUTES) {
      if (element.hasAttribute(attr)) {
        return true
      }
    }

    // Verificar role
    const role = element.getAttribute('role')
    if (role && IGNORE_ROLES.includes(role)) {
      return true
    }

    // Verificar clases
    for (const className of IGNORE_CLASSES) {
      if (element.classList.contains(className)) {
        return true
      }
    }

    // Verificar si está dentro de un elemento editable
    const editableParent = element.closest('[contenteditable="true"]')
    if (editableParent) {
      return true
    }

    return false
  }, [])

  // Verificar si el evento debe ser ignorado
  const shouldIgnoreEvent = useCallback((event: KeyboardEvent): boolean => {
    const target = event.target as Element
    
    if (!target) return false

    // Ignorar si está en un elemento editable
    if (shouldIgnoreElement(target)) {
      return true
    }

    // Ignorar si está en un modal o dropdown abierto
    const modal = target.closest('[role="dialog"], .modal, .dropdown-menu')
    if (modal && modal.getAttribute('aria-hidden') !== 'true') {
      return true
    }

    // Ignorar si está en un elemento con focus visible
    const focusedElement = document.activeElement
    if (focusedElement && shouldIgnoreElement(focusedElement)) {
      return true
    }

    return false
  }, [shouldIgnoreElement])

  // Manejar evento de teclado
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!config.enabled || !enabled) return

    // Ignorar si debe ser ignorado
    if (shouldIgnoreEvent(event)) return

    // Buscar shortcut que coincida
    const matchingShortcut = config.shortcuts.find(shortcut => {
      return (
        (shortcut.key === event.key || shortcut.code === event.code) &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      )
    })

    if (matchingShortcut) {
      event.preventDefault()
      event.stopPropagation()
      
      // Ejecutar acción
      onAction?.(matchingShortcut.action)
    }
  }, [config.enabled, config.shortcuts, enabled, onAction, shouldIgnoreEvent])

  // Registrar event listener
  useEffect(() => {
    if (!config.enabled || !enabled) return

    document.addEventListener('keydown', handleKeyDown, true) // true para captura

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [handleKeyDown, config.enabled, enabled])

  // Funciones para gestionar la configuración
  const updateShortcut = useCallback((action: ControlAction, newShortcut: Partial<KeyboardShortcut>) => {
    setConfig(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.map(shortcut =>
        shortcut.action === action
          ? { ...shortcut, ...newShortcut }
          : shortcut
      )
    }))
  }, [])

  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setConfig(prev => ({
      ...prev,
      shortcuts: [...prev.shortcuts, shortcut]
    }))
  }, [])

  const removeShortcut = useCallback((action: ControlAction) => {
    setConfig(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.filter(shortcut => shortcut.action !== action)
    }))
  }, [])

  const toggleEnabled = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      enabled: !prev.enabled
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setConfig({
      shortcuts: customShortcuts || DEFAULT_SHORTCUTS,
      enabled: true
    })
  }, [customShortcuts])

  const clearConfig = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('Error clearing keyboard shortcuts config:', error)
    }
    setConfig({
      shortcuts: customShortcuts || DEFAULT_SHORTCUTS,
      enabled: true
    })
  }, [customShortcuts, storageKey])

  return {
    config,
    shortcuts: config.shortcuts,
    enabled: config.enabled,
    updateShortcut,
    addShortcut,
    removeShortcut,
    toggleEnabled,
    resetToDefaults,
    clearConfig,
    setConfig
  }
}

// Hook específico para el timer
export const useTimerKeyboardShortcuts = (onControl: (action: ControlAction) => void) => {
  return useKeyboardShortcuts({
    onAction: onControl,
    enabled: true
  })
}

// Hook para configuración de shortcuts (para settings)
export const useKeyboardShortcutsConfig = () => {
  return useKeyboardShortcuts({
    enabled: false // No ejecutar shortcuts, solo gestionar configuración
  })
}

// Utilidades para debugging
export const getKeyboardShortcutsInfo = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const clearKeyboardShortcutsConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
