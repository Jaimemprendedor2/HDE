import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SyncChannel } from './syncChannel'
import type { TimerMessage } from '../types/timer'

// Mock BroadcastChannel
const mockBroadcastChannel = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  postMessage: vi.fn(),
  close: vi.fn()
}

const MockBroadcastChannel = vi.fn(() => mockBroadcastChannel)

Object.defineProperty(global, 'BroadcastChannel', {
  value: MockBroadcastChannel,
  writable: true
})

// Mock window.postMessage
const mockPostMessage = vi.fn()
Object.defineProperty(global.window, 'postMessage', {
  value: mockPostMessage,
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock performance.now
const mockPerformanceNow = vi.fn(() => Date.now())
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
})

describe('SyncChannel', () => {
  let syncChannel: SyncChannel
  let messageCallback: (message: TimerMessage) => void
  let connectionCallback: (connected: boolean) => void

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    mockLocalStorage.removeItem.mockImplementation(() => {})
    
    // Create new instance
    syncChannel = new SyncChannel()
    
    // Capture callbacks
    syncChannel.subscribe((message) => {
      messageCallback = message
    })
    
    syncChannel.onConnectionChange((connected) => {
      connectionCallback = connected
    })
  })

  afterEach(() => {
    syncChannel.close()
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with BroadcastChannel when available', () => {
      expect(MockBroadcastChannel).toHaveBeenCalledWith('housenovo-directorios')
      expect(mockBroadcastChannel.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
      expect(mockBroadcastChannel.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should fallback to postMessage when BroadcastChannel is not available', () => {
      // Create new instance without BroadcastChannel
      delete (global as any).BroadcastChannel
      
      const fallbackChannel = new SyncChannel()
      expect(fallbackChannel).toBeDefined()
      
      // Restore for other tests
      ;(global as any).BroadcastChannel = MockBroadcastChannel
    })
  })

  describe('message publishing', () => {
    it('should publish valid messages via BroadcastChannel', () => {
      const message: TimerMessage = {
        type: 'INIT',
        payload: { test: 'data' },
        v: 'v1'
      }
      
      syncChannel.publish(message)
      
      expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(message)
    })

    it('should publish via postMessage when childWindow is set', () => {
      const mockWindow = {
        postMessage: vi.fn(),
        addEventListener: vi.fn()
      }
      
      syncChannel.setChildWindow(mockWindow as any)
      
      const message: TimerMessage = {
        type: 'CONTROL',
        payload: { action: 'PLAY' },
        v: 'v1'
      }
      
      syncChannel.publish(message)
      
      expect(mockWindow.postMessage).toHaveBeenCalledWith(message, '*')
    })

    it('should fallback to localStorage when other methods fail', () => {
      // Mock BroadcastChannel to throw
      mockBroadcastChannel.postMessage.mockImplementation(() => {
        throw new Error('BroadcastChannel failed')
      })
      
      const message: TimerMessage = {
        type: 'SYNC_RESPONSE',
        payload: { data: 'test' },
        v: 'v1'
      }
      
      syncChannel.publish(message)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^sync_housenovo-directorios_/),
        JSON.stringify(message)
      )
    })
  })

  describe('message filtering', () => {
    it('should filter by protocol version', () => {
      const validMessage: TimerMessage = {
        type: 'INIT',
        payload: {},
        v: 'v1'
      }
      
      const invalidMessage = {
        type: 'INIT',
        payload: {},
        v: 'v2' // Wrong version
      }
      
      // Simulate message reception
      const messageHandler = mockBroadcastChannel.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
      
      expect(messageHandler).toBeDefined()
      
      // Test valid message
      let receivedMessage: TimerMessage | null = null
      syncChannel.subscribe((msg) => {
        receivedMessage = msg
      })
      
      messageHandler({ data: validMessage })
      expect(receivedMessage).toEqual(validMessage)
      
      // Test invalid message
      receivedMessage = null
      messageHandler({ data: invalidMessage })
      expect(receivedMessage).toBeNull()
    })

    it('should filter by directoryId when set', () => {
      syncChannel.setDirectoryId('dir-123')
      
      const messageForThisDir: TimerMessage = {
        type: 'SYNC_REQUEST',
        payload: { directoryId: 'dir-123' },
        v: 'v1'
      }
      
      const messageForOtherDir: TimerMessage = {
        type: 'SYNC_REQUEST',
        payload: { directoryId: 'dir-456' },
        v: 'v1'
      }
      
      const messageWithoutDir: TimerMessage = {
        type: 'SYNC_REQUEST',
        payload: {},
        v: 'v1'
      }
      
      // Simulate message reception
      const messageHandler = mockBroadcastChannel.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
      
      let receivedMessages: TimerMessage[] = []
      syncChannel.subscribe((msg) => {
        receivedMessages.push(msg)
      })
      
      messageHandler({ data: messageForThisDir })
      messageHandler({ data: messageForOtherDir })
      messageHandler({ data: messageWithoutDir })
      
      expect(receivedMessages).toHaveLength(2)
      expect(receivedMessages).toContain(messageForThisDir)
      expect(receivedMessages).toContain(messageWithoutDir)
      expect(receivedMessages).not.toContain(messageForOtherDir)
    })
  })

  describe('message types handling', () => {
    let messageHandler: (event: { data: any }) => void

    beforeEach(() => {
      messageHandler = mockBroadcastChannel.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
    })

    it('should handle INIT messages', () => {
      const initMessage: TimerMessage = {
        type: 'INIT',
        payload: { timerState: 'data' },
        v: 'v1'
      }
      
      let receivedMessage: TimerMessage | null = null
      syncChannel.subscribe((msg) => {
        receivedMessage = msg
      })
      
      messageHandler({ data: initMessage })
      
      expect(receivedMessage).toEqual(initMessage)
    })

    it('should handle SYNC_REQUEST messages', () => {
      const syncRequest: TimerMessage = {
        type: 'SYNC_REQUEST',
        payload: { requestId: 'req-123' },
        v: 'v1'
      }
      
      let receivedMessage: TimerMessage | null = null
      syncChannel.subscribe((msg) => {
        receivedMessage = msg
      })
      
      messageHandler({ data: syncRequest })
      
      expect(receivedMessage).toEqual(syncRequest)
    })

    it('should handle SYNC_RESPONSE messages', () => {
      const syncResponse: TimerMessage = {
        type: 'SYNC_RESPONSE',
        payload: { timerState: 'current' },
        v: 'v1'
      }
      
      let receivedMessage: TimerMessage | null = null
      syncChannel.subscribe((msg) => {
        receivedMessage = msg
      })
      
      messageHandler({ data: syncResponse })
      
      expect(receivedMessage).toEqual(syncResponse)
    })

    it('should handle CONTROL messages', () => {
      const controlMessage: TimerMessage = {
        type: 'CONTROL',
        payload: { action: 'PLAY' },
        v: 'v1'
      }
      
      let receivedMessage: TimerMessage | null = null
      syncChannel.subscribe((msg) => {
        receivedMessage = msg
      })
      
      messageHandler({ data: controlMessage })
      
      expect(receivedMessage).toEqual(controlMessage)
    })

    it('should handle PING/PONG heartbeat', () => {
      const pingMessage: TimerMessage = {
        type: 'PING',
        payload: { timestamp: 1234567890 },
        v: 'v1'
      }
      
      // Mock publish to capture PONG response
      const originalPublish = syncChannel.publish.bind(syncChannel)
      let pongSent = false
      
      syncChannel.publish = (message) => {
        if (message.type === 'PONG') {
          pongSent = true
        }
        return originalPublish(message)
      }
      
      messageHandler({ data: pingMessage })
      
      expect(pongSent).toBe(true)
    })

    it('should respond to PONG messages', () => {
      const pongMessage: TimerMessage = {
        type: 'PONG',
        payload: { timestamp: 1234567890 },
        v: 'v1'
      }
      
      // This should update the last heartbeat time
      messageHandler({ data: pongMessage })
      
      // Verify connection state is updated
      expect(connectionCallback).toBeDefined()
    })
  })

  describe('heartbeat mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should send PING messages periodically', () => {
      const originalPublish = syncChannel.publish.bind(syncChannel)
      let pingCount = 0
      
      syncChannel.publish = (message) => {
        if (message.type === 'PING') {
          pingCount++
        }
        return originalPublish(message)
      }
      
      // Fast-forward time to trigger heartbeat
      vi.advanceTimersByTime(5000)
      
      expect(pingCount).toBeGreaterThan(0)
    })

    it('should detect heartbeat timeout', () => {
      let connectionLost = false
      
      syncChannel.onConnectionChange((connected) => {
        if (!connected) {
          connectionLost = true
        }
      })
      
      // Fast-forward time without receiving PONG
      vi.advanceTimersByTime(15000) // More than timeout
      
      expect(connectionLost).toBe(true)
    })
  })

  describe('reconnection mechanism', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should attempt reconnection on disconnect', () => {
      let reconnectAttempted = false
      
      // Mock reconnection attempt
      const originalInitializeChannel = (syncChannel as any).initializeChannel
      ;(syncChannel as any).initializeChannel = () => {
        reconnectAttempted = true
        return originalInitializeChannel.call(syncChannel)
      }
      
      // Trigger disconnect
      const closeHandler = mockBroadcastChannel.addEventListener.mock.calls
        .find(call => call[0] === 'close')?.[1]
      
      closeHandler()
      
      // Fast-forward to trigger reconnection
      vi.advanceTimersByTime(1000)
      
      expect(reconnectAttempted).toBe(true)
    })
  })

  describe('localStorage fallback', () => {
    it('should clean up old localStorage messages', () => {
      // Mock localStorage with old entries
      const oldKey = 'sync_housenovo-directorios_1234567890' // Old timestamp
      const newKey = 'sync_housenovo-directorios_9999999999' // Recent timestamp
      
      Object.defineProperty(mockLocalStorage, 'length', { value: 2 })
      mockLocalStorage.key.mockImplementation((index: number) => {
        return index === 0 ? oldKey : newKey
      })
      
      // Trigger cleanup by publishing a message
      const message: TimerMessage = {
        type: 'CONTROL',
        payload: { action: 'PLAY' },
        v: 'v1'
      }
      
      // Mock BroadcastChannel to fail
      mockBroadcastChannel.postMessage.mockImplementation(() => {
        throw new Error('BroadcastChannel failed')
      })
      
      syncChannel.publish(message)
      
      // Should attempt to clean up old entries
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
    })
  })

  describe('request sync functionality', () => {
    it('should send sync request', () => {
      const originalPublish = syncChannel.publish.bind(syncChannel)
      let syncRequestSent = false
      
      syncChannel.publish = (message) => {
        if (message.type === 'SYNC_REQUEST') {
          syncRequestSent = true
        }
        return originalPublish(message)
      }
      
      syncChannel.requestSync('dir-123')
      
      expect(syncRequestSent).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle invalid messages gracefully', () => {
      const invalidMessages = [
        null,
        undefined,
        {},
        { type: 'INVALID' },
        { type: 'CONTROL', payload: {} }, // Missing v
        { type: 'CONTROL', v: 'v2' }, // Wrong version
      ]
      
      let errorCount = 0
      const originalConsoleWarn = console.warn
      console.warn = () => { errorCount++ }
      
      const messageHandler = mockBroadcastChannel.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1]
      
      invalidMessages.forEach(msg => {
        messageHandler({ data: msg })
      })
      
      expect(errorCount).toBe(invalidMessages.length)
      
      console.warn = originalConsoleWarn
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage full')
      })
      
      const message: TimerMessage = {
        type: 'CONTROL',
        payload: { action: 'PLAY' },
        v: 'v1'
      }
      
      // Should not throw
      expect(() => {
        mockBroadcastChannel.postMessage.mockImplementation(() => {
          throw new Error('BroadcastChannel failed')
        })
        syncChannel.publish(message)
      }).not.toThrow()
    })
  })
})
