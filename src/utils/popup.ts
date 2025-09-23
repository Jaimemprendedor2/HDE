/**
 * Utilidades para manejo de ventanas popup
 */

/**
 * Opciones para abrir ventanas popup
 */
export interface PopupOptions {
  width?: number
  height?: number
  left?: number
  top?: number
  scrollbars?: boolean
  resizable?: boolean
  menubar?: boolean
  toolbar?: boolean
  location?: boolean
  status?: boolean
  directories?: boolean
}

/**
 * Abre una ventana popup con la URL especificada
 * @param url - URL a abrir en el popup
 * @param name - Nombre de la ventana (por defecto 'HousenovoDirectoriosTimer')
 * @param options - Opciones adicionales para la ventana
 * @returns Referencia a la ventana abierta o null si falló
 */
export const openPopup = (
  url: string, 
  name: string = 'HousenovoDirectoriosTimer',
  options: PopupOptions = {}
): Window | null => {
  // Configuración por defecto
  const defaultOptions: PopupOptions = {
    width: 1200,
    height: 800,
    left: Math.round((screen.width - 1200) / 2),
    top: Math.round((screen.height - 800) / 2),
    scrollbars: true,
    resizable: true,
    menubar: false,
    toolbar: false,
    location: false,
    status: true,
    directories: false
  }

  // Combinar opciones
  const finalOptions = { ...defaultOptions, ...options }

  // Convertir opciones a string de features
  const features = Object.entries(finalOptions)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return `${key}=${value ? 'yes' : 'no'}`
      }
      return `${key}=${value}`
    })
    .join(',')

  try {
    // Intentar abrir la ventana
    const popup = window.open(url, name, features)
    
    // Verificar si se abrió correctamente
    if (!popup) {
      console.warn('Popup blocked or failed to open')
      return null
    }

    // Verificar si la ventana se cerró inmediatamente
    // (algunos navegadores cierran popups bloqueados inmediatamente)
    setTimeout(() => {
      if (popup.closed) {
        console.warn('Popup closed immediately - likely blocked')
      }
    }, 100)

    return popup
  } catch (error) {
    console.error('Error opening popup:', error)
    return null
  }
}

/**
 * Verifica si un popup fue bloqueado
 * @param popup - Referencia a la ventana popup
 * @returns true si el popup fue bloqueado
 */
export const isPopupBlocked = (popup: Window | null): boolean => {
  if (!popup) {
    return true
  }

  // Verificar si se cerró inmediatamente
  return popup.closed
}

/**
 * Verifica si el navegador soporta popups
 * @returns true si los popups están soportados
 */
export const isPopupSupported = (): boolean => {
  try {
    // Intentar abrir un popup de prueba
    const testPopup = window.open('', '_blank', 'width=1,height=1')
    
    if (!testPopup) {
      return false
    }

    // Cerrar inmediatamente el popup de prueba
    testPopup.close()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Construye URL para el popup del timer
 * @param baseUrl - URL base (por defecto '/meeting')
 * @param params - Parámetros adicionales
 * @returns URL completa para el popup
 */
export const buildTimerPopupUrl = (
  baseUrl: string = '/meeting',
  params: Record<string, string | number> = {}
): string => {
  const url = new URL(baseUrl, window.location.origin)
  
  // Agregar parámetros
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

/**
 * Hook personalizado para manejar popups
 */
export const usePopupManager = () => {
  const [popupWindow, setPopupWindow] = React.useState<Window | null>(null)
  const [isBlocked, setIsBlocked] = React.useState(false)

  const openTimerPopup = (url: string, options?: PopupOptions) => {
    const popup = openPopup(url, 'HousenovoDirectoriosTimer', options)
    
    if (!popup) {
      setIsBlocked(true)
      setPopupWindow(null)
      return null
    }

    // Verificar si se bloqueó después de un breve delay
    setTimeout(() => {
      if (popup.closed) {
        setIsBlocked(true)
        setPopupWindow(null)
      } else {
        setIsBlocked(false)
        setPopupWindow(popup)
      }
    }, 100)

    setPopupWindow(popup)
    return popup
  }

  const closePopup = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close()
    }
    setPopupWindow(null)
    setIsBlocked(false)
  }

  const retryOpenPopup = (url: string, options?: PopupOptions) => {
    setIsBlocked(false)
    return openTimerPopup(url, options)
  }

  return {
    popupWindow,
    isBlocked,
    openTimerPopup,
    closePopup,
    retryOpenPopup
  }
}

// Importar React para el hook (se hace aquí para evitar problemas de dependencias circulares)
import React from 'react'
