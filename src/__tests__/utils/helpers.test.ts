import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Helpers } from '@/core/utils/helpers'

describe('Helpers', () => {
  describe('formatTime', () => {
    it('should format seconds to MM:SS', () => {
      expect(Helpers.formatTime(0)).toBe('0:00')
      expect(Helpers.formatTime(5)).toBe('0:05')
      expect(Helpers.formatTime(65)).toBe('1:05')
      expect(Helpers.formatTime(125)).toBe('2:05')
      expect(Helpers.formatTime(3599)).toBe('59:59') // Max without hours
    })

    it('should format seconds to HH:MM:SS for long durations', () => {
      expect(Helpers.formatTime(3600)).toBe('1:00:00')
      expect(Helpers.formatTime(3665)).toBe('1:01:05')
      expect(Helpers.formatTime(45296)).toBe('12:34:56')
    })

    it('should handle invalid input', () => {
      expect(Helpers.formatTime(NaN)).toBe('0:00')
      expect(Helpers.formatTime(Infinity)).toBe('0:00')
      expect(Helpers.formatTime(-10)).toBe('0:00')
    })

    it('should handle edge cases', () => {
      expect(Helpers.formatTime(59.9)).toBe('0:59') // Floor seconds
      expect(Helpers.formatTime(60.9)).toBe('1:00')
    })
  })

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(Helpers.clamp(5, 0, 10)).toBe(5)
      expect(Helpers.clamp(-5, 0, 10)).toBe(0)
      expect(Helpers.clamp(15, 0, 10)).toBe(10)
    })

    it('should handle equal min/max', () => {
      expect(Helpers.clamp(5, 10, 10)).toBe(10)
    })
  })

  describe('parseBoolean', () => {
    it('should parse boolean values correctly', () => {
      expect(Helpers.parseBoolean(true)).toBe(true)
      expect(Helpers.parseBoolean(false)).toBe(false)
      expect(Helpers.parseBoolean('true')).toBe(true)
      expect(Helpers.parseBoolean('false')).toBe(false)
      expect(Helpers.parseBoolean('')).toBe(false)
      expect(Helpers.parseBoolean('any text')).toBe(true)
      expect(Helpers.parseBoolean(1)).toBe(true)
      expect(Helpers.parseBoolean(0)).toBe(false)
      expect(Helpers.parseBoolean(null)).toBe(false)
      expect(Helpers.parseBoolean(undefined)).toBe(false)
    })
  })

  describe('toCamelCase', () => {
    it('should convert strings to camelCase', () => {
      expect(Helpers.toCamelCase('hello world')).toBe('helloWorld')
      expect(Helpers.toCamelCase('multiple words here')).toBe('multipleWordsHere')
      expect(Helpers.toCamelCase('single')).toBe('single')
      expect(Helpers.toCamelCase('')).toBe('')
    })
  })

  describe('isPromiseLike', () => {
    it('should detect promise-like objects', () => {
      const promise = new Promise(() => {})
      const thenable = { then: () => {} }
      const nonThenable = { catch: () => {} }

      expect(Helpers.isPromiseLike(promise)).toBe(true)
      expect(Helpers.isPromiseLike(thenable)).toBe(true)
      expect(Helpers.isPromiseLike(nonThenable)).toBe(false)
      expect(Helpers.isPromiseLike(null)).toBe(false)
      expect(Helpers.isPromiseLike(undefined)).toBe(false)
      expect(Helpers.isPromiseLike('string')).toBe(false)
    })
  })

  describe('isCrossOrigin', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000'
        },
        writable: true
      })
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should detect same-origin URLs', () => {
      expect(Helpers.isCrossOrigin('http://localhost:3000/path')).toBe(false)
      expect(Helpers.isCrossOrigin('/relative/path')).toBe(false)
    })

    it('should detect cross-origin URLs', () => {
      expect(Helpers.isCrossOrigin('http://example.com/path')).toBe(true)
      expect(Helpers.isCrossOrigin('https://api.example.com')).toBe(true)
    })

    it('should handle blob and data URLs', () => {
      expect(Helpers.isCrossOrigin('blob:http://localhost/test')).toBe(false)
      expect(Helpers.isCrossOrigin('data:image/jpeg;base64,xxx')).toBe(false)
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      vi.useFakeTimers()

      const mockFn = vi.fn().mockResolvedValue('result')
      const debouncedFn = Helpers.debounce(mockFn, 100)

      // Call multiple times rapidly
      void debouncedFn('first')
      void debouncedFn('second')
      const promise = debouncedFn('third')

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      await vi.advanceTimersByTimeAsync(100)

      // Should only be called once with the last arguments
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('third')
      expect(promise).resolves.toBe('result')

      vi.useRealTimers()
    })

    it('should resolve with the function result', async () => {
      vi.useFakeTimers()

      const mockFn = vi.fn().mockResolvedValue('test result')
      const debouncedFn = Helpers.debounce(mockFn, 50)

      const promise = debouncedFn('arg')

      await vi.advanceTimersByTimeAsync(50)

      const result = await promise

      expect(result).toBe('test result')

      vi.useRealTimers()
    })
  })

  describe('captureFrame', () => {
    it('should capture frame from video element', async () => {
      // Mock canvas context and toBlob
      const mockDrawImage = vi.fn()
      const mockToBlob = vi.fn()

      const mockContext = {
        drawImage: mockDrawImage
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toBlob: mockToBlob
      }

      // Mock document.createElement
      const originalCreateElement = document.createElement
      document.createElement = vi.fn().mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas
        }
        return originalCreateElement.call(document, tagName)
      })

      // Mock video element
      const mockVideo = {
        videoWidth: 1920,
        videoHeight: 1080
      } as HTMLVideoElement

      // Setup toBlob callback
      let blobCallback: ((blob: Blob | null) => void) | null = null
      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        blobCallback = callback
      })

      // Start capture
      const capturePromise = Helpers.captureFrame(mockVideo, 0.9)

      // Verify canvas setup
      expect(mockCanvas.width).toBe(1920)
      expect(mockCanvas.height).toBe(1080)
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
      expect(mockDrawImage).toHaveBeenCalledWith(mockVideo, 0, 0, 1920, 1080)

      // Simulate blob creation
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' })
      blobCallback!(mockBlob)

      // Wait for result
      const result = await capturePromise

      expect(result).toBe(mockBlob)

      // Restore
      document.createElement = originalCreateElement
    })

    it('should return null if canvas context is not available', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => null),
        toBlob: vi.fn()
      }

      const originalCreateElement = document.createElement
      document.createElement = vi.fn().mockReturnValue(mockCanvas)

      const mockVideo = {
        videoWidth: 1920,
        videoHeight: 1080
      } as HTMLVideoElement

      const result = await Helpers.captureFrame(mockVideo)

      expect(result).toBeNull()
      expect(mockCanvas.toBlob).not.toHaveBeenCalled()

      document.createElement = originalCreateElement
    })
  })
})
