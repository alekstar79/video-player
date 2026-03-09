import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import type { CustomChangeCallback } from '@/types'

describe('FullscreenController', () => {
  let element: HTMLElement
  let onChangeHandler: CustomChangeCallback
  let onErrorHandler: CustomChangeCallback

  beforeEach(() => {
    element = document.createElement('div')
    onChangeHandler = vi.fn<CustomChangeCallback>()
    onErrorHandler = vi.fn<CustomChangeCallback>()

    // Mock document.fullscreenEnabled and related APIs
    Object.defineProperty(document, 'fullscreenEnabled', {
      value: true,
      writable: true
    })

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true
    })

    Object.defineProperty(document, 'exitFullscreen', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true
    })

    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true
    })

    // Add event listeners
    document.addEventListener = vi.fn()
    document.removeEventListener = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should create controller with element and handlers', () => {
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)

      expect(controller).toBeInstanceOf(FullscreenController)
      expect(controller.element).toBeNull()
      expect(controller.isEnabled).toBe(true)
      expect(controller.isFullscreen).toBe(false)
    })

    it('should warn when fullscreen is not supported', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Mock no fullscreen support
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: undefined,
        writable: true
      })

      const controller = new FullscreenController(element)

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Fullscreen is not supported in this browser'
      )
      expect(controller.supportedAPI).toBeUndefined()

      consoleWarnSpy.mockRestore()
    })

    it('should register event listeners when handlers provided', () => {
      new FullscreenController(element, onChangeHandler, onErrorHandler)

      expect(document.addEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function),
        false
      )
      expect(document.addEventListener).toHaveBeenCalledWith(
        'fullscreenerror',
        expect.any(Function),
        false
      )
    })
  })

  describe('API detection', () => {
    it('should detect standard fullscreen API', () => {
      const controller = new FullscreenController(element)

      expect(controller.supportedAPI).toEqual({
        request: 'requestFullscreen',
        exit: 'exitFullscreen',
        element: 'fullscreenElement',
        enabled: 'fullscreenEnabled',
        change: 'fullscreenchange',
        error: 'fullscreenerror'
      })
    })

    it('should fall back to webkit API if standard not available', () => {
      // Remove standard API
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: undefined,
        writable: true
      })

      // Add webkit API
      Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', {
        value: vi.fn(),
        writable: true
      })

      const controller = new FullscreenController(element)

      expect(controller.supportedAPI?.request).toBe('webkitRequestFullscreen')
    })
  })

  describe('Fullscreen operations', () => {
    let controller: FullscreenController

    beforeEach(() => {
      controller = new FullscreenController(element, onChangeHandler)
    })

    it('should request fullscreen', async () => {
      const requestSpy = vi.spyOn(element, 'requestFullscreen' as any)

      const result = await controller.request()

      expect(requestSpy).toHaveBeenCalledWith({ navigationUI: 'auto' })
      expect(result).toBe(false) // Still not in fullscreen because we mocked
    })

    it('should request fullscreen with custom element and options', async () => {
      const customElement = document.createElement('video')
      Object.defineProperty(customElement, 'requestFullscreen', {
        value: vi.fn().mockResolvedValue(undefined),
        writable: true
      })

      const options = { navigationUI: 'hide' as FullscreenNavigationUI }

      await controller.request(customElement, options)

      expect(customElement.requestFullscreen).toHaveBeenCalledWith(options)
    })

    it('should throw error when fullscreen not enabled', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true
      })

      expect(controller.request()).rejects.toThrow('Fullscreen is not enabled')
    })

    it('should exit fullscreen', async () => {
      // Simulate being in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: element,
        writable: true
      })

      const exitSpy = vi.spyOn(document, 'exitFullscreen' as any)

      const result = await controller.exit()

      expect(exitSpy).toHaveBeenCalled()
      expect(result).toBe(true) // Should return true when in fullscreen
    })

    it('should return false when exiting without being in fullscreen', async () => {
      const result = await controller.exit()

      expect(result).toBe(false)
      expect(document.exitFullscreen).not.toHaveBeenCalled()
    })

    it('should toggle fullscreen', async () => {
      // Start not in fullscreen
      const requestSpy = vi.spyOn(element, 'requestFullscreen' as any)

      await controller.toggle()
      expect(requestSpy).toHaveBeenCalled()

      // Simulate being in fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: element,
        writable: true
      })

      const exitSpy = vi.spyOn(document, 'exitFullscreen' as any)

      await controller.toggle()
      expect(exitSpy).toHaveBeenCalled()
    })
  })

  describe('Event handling', () => {
    it('should register and unregister event listeners', () => {
      const callback = vi.fn()
      const controller = new FullscreenController(element)

      controller.on('change', callback)
      expect(document.addEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        callback,
        false
      )

      controller.off('change', callback)
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        callback,
        false
      )
    })

    it('should handle onchange and onerror shortcuts', () => {
      const changeCallback = vi.fn()
      const errorCallback = vi.fn()
      const controller = new FullscreenController(element)

      controller.onchange(changeCallback)
      expect(document.addEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        changeCallback,
        false
      )

      controller.onerror(errorCallback)
      expect(document.addEventListener).toHaveBeenCalledWith(
        'fullscreenerror',
        errorCallback,
        false
      )
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)

      // Get the bound handlers
      const boundHandlerChange = (controller as any).boundHandlerChange
      const boundHandlerError = (controller as any).boundHandlerError

      controller.destroy()

      expect(document.removeEventListener).toHaveBeenCalledWith(
        'fullscreenchange',
        boundHandlerChange,
        false
      )
      expect(document.removeEventListener).toHaveBeenCalledWith(
        'fullscreenerror',
        boundHandlerError,
        false
      )
    })
  })
})
