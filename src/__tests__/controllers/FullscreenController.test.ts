import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import type { CustomChangeCallback } from '@/types'

// This helper function sets up a consistent mock environment for the Fullscreen API.
const mockFullscreenAPI = (supported = true) => {
  const api = {
    requestFullscreen: vi.fn().mockResolvedValue(undefined),
    exitFullscreen: vi.fn().mockResolvedValue(undefined),
    fullscreenElement: null,
    fullscreenEnabled: supported,
    fullscreenchange: null,
    fullscreenerror: null,
  }

  Object.defineProperties(document, {
    fullscreenEnabled: { value: api.fullscreenEnabled, writable: true, configurable: true },
    fullscreenElement: { value: api.fullscreenElement, writable: true, configurable: true },
    exitFullscreen: { value: api.exitFullscreen, writable: true, configurable: true },
  })

  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    value: api.requestFullscreen,
    writable: true,
    configurable: true,
  })
}

describe('FullscreenController', () => {
  let element: HTMLElement
  let onChangeHandler: CustomChangeCallback
  let onErrorHandler: CustomChangeCallback

  beforeEach(() => {
    element = document.createElement('div')
    onChangeHandler = vi.fn<CustomChangeCallback>()
    onErrorHandler = vi.fn<CustomChangeCallback>()

    // Spy on document event listeners to track calls
    vi.spyOn(document, 'addEventListener')
    vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up mock from document.documentElement
    delete (document.documentElement as any).requestFullscreen
  })

  describe('Initialization', () => {
    it('should create controller with element and handlers', () => {
      mockFullscreenAPI()
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)
      expect(controller).toBeInstanceOf(FullscreenController)
      expect(controller.isEnabled).toBe(true)
      expect(controller.isFullscreen).toBe(false)
    })

    it('should warn when fullscreen is not supported', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const controller = new FullscreenController(element)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Fullscreen is not supported in this browser')
      expect(controller.supportedAPI).toBeUndefined()
      consoleWarnSpy.mockRestore()
    })

    it('should register event listeners when handlers provided', () => {
      mockFullscreenAPI()
      new FullscreenController(element, onChangeHandler, onErrorHandler)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function), false)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenerror', expect.any(Function), false)
    })
  })

  describe('API detection', () => {
    it('should detect standard fullscreen API', () => {
      mockFullscreenAPI()
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
      Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', { value: vi.fn(), configurable: true })
      Object.defineProperty(document, 'webkitFullscreenEnabled', { value: true, configurable: true })

      const controller = new FullscreenController(element)
      expect(controller.supportedAPI?.request).toContain('webkit')
      
      delete (document.documentElement as any).webkitRequestFullscreen
      delete (document as any).webkitFullscreenEnabled
    })
  })

  describe('Fullscreen operations', () => {
    let controller: FullscreenController

    beforeEach(() => {
      mockFullscreenAPI()
      controller = new FullscreenController(element, onChangeHandler)
    })

    it('should request fullscreen', async () => {
      await controller.request()
      expect(document.documentElement.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'auto' })
    })

    it('should request fullscreen with custom element and options', async () => {
      const customElement = document.createElement('video')
      const options = { navigationUI: 'hide' as FullscreenNavigationUI }
      // Since the mock is on document.documentElement, we need to spy on the element's method
      const requestSpy = vi.spyOn(customElement, 'requestFullscreen' as any).mockResolvedValue(undefined)
      await controller.request(customElement, options)
      expect(requestSpy).toHaveBeenCalledWith(options)
    })

    it('should throw error when fullscreen not enabled', async () => {
      mockFullscreenAPI(false)
      const controller = new FullscreenController(element)
      try {
        await controller.request()
        expect.fail('Expected request() to throw an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Fullscreen is not enabled')
      }
    })

    it('should exit fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenElement', { value: element, writable: true, configurable: true })
      const result = await controller.exit()
      expect(document.exitFullscreen).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false when exiting without being in fullscreen', async () => {
      const result = await controller.exit()
      expect(document.exitFullscreen).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should toggle fullscreen', async () => {
      await controller.toggle()
      expect(document.documentElement.requestFullscreen).toHaveBeenCalled()

      Object.defineProperty(document, 'fullscreenElement', { value: element, writable: true, configurable: true })
      await controller.toggle()
      expect(document.exitFullscreen).toHaveBeenCalled()
    })
  })

  describe('Event handling', () => {
    let controller: FullscreenController;

    beforeEach(() => {
      mockFullscreenAPI()
      controller = new FullscreenController(element)
    })

    it('should register and unregister event listeners', () => {
      const callback = vi.fn()
      controller.on('change', callback)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', callback, false)
      controller.off('change', callback)
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', callback, false)
    })

    it('should handle onchange and onerror shortcuts', () => {
      const changeCallback = vi.fn()
      const errorCallback = vi.fn()
      controller.onchange(changeCallback)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', changeCallback, false)
      controller.onerror(errorCallback)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenerror', errorCallback, false)
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      mockFullscreenAPI()
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)
      const boundHandlerChange = (controller as any).boundHandlerChange
      const boundHandlerError = (controller as any).boundHandlerError
      controller.destroy()
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', boundHandlerChange, false)
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenerror', boundHandlerError, false)
    })
  })
})
