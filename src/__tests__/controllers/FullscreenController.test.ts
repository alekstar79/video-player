import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import type { CustomChangeCallback } from '@/types'

const mockFullscreenAPI = (supported = true) => {
  const requestFullscreenMock = vi.fn().mockResolvedValue(undefined)

  // Mock the API on the document for detection
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    value: supported ? requestFullscreenMock : undefined,
    writable: true,
    configurable: true,
  })

  // Mock the API on the element prototype for actual calls
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    value: supported ? requestFullscreenMock : undefined,
    writable: true,
    configurable: true,
  })

  Object.defineProperties(document, {
    fullscreenEnabled: { value: supported, writable: true, configurable: true },
    fullscreenElement: { value: null, writable: true, configurable: true },
    exitFullscreen: {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
      configurable: true,
    },
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
    mockFullscreenAPI()

    vi.spyOn(document, 'addEventListener')
    vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (document.documentElement as any).requestFullscreen
    delete (HTMLElement.prototype as any).requestFullscreen
  })

  describe('Initialization', () => {
    it('should create controller with element and handlers', () => {
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)
      expect(controller).toBeInstanceOf(FullscreenController)
      expect(controller.isEnabled).toBe(true)
      expect(controller.isFullscreen).toBe(false)
    })

    it('should warn when fullscreen is not supported', () => {
      mockFullscreenAPI(false)
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const controller = new FullscreenController(element)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Fullscreen is not supported in this browser')
      expect(controller.supportedAPI).toBeUndefined()
      consoleWarnSpy.mockRestore()
    })

    it('should register event listeners when handlers provided', () => {
      new FullscreenController(element, onChangeHandler, onErrorHandler)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function), false)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenerror', expect.any(Function), false)
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
        error: 'fullscreenerror',
      })
    })
  })

  describe('Fullscreen operations', () => {
    let controller: FullscreenController

    beforeEach(() => {
      controller = new FullscreenController(element, onChangeHandler)
    })

    it('should request fullscreen', async () => {
      await controller.request(element)
      expect(element.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'auto' })
    })

    it('should request fullscreen with custom element and options', async () => {
      const customElement = document.createElement('video')
      const options = { navigationUI: 'hide' as FullscreenNavigationUI }
      await controller.request(customElement, options)
      expect(customElement.requestFullscreen).toHaveBeenCalledWith(options)
    })

    it('should throw error when fullscreen not enabled', async () => {
      mockFullscreenAPI(false)
      const controller = new FullscreenController(element)
      await expect(controller.request()).rejects.toThrow('Fullscreen is not enabled')
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
      await controller.toggle(element)
      expect(element.requestFullscreen).toHaveBeenCalled()

      Object.defineProperty(document, 'fullscreenElement', { value: element, writable: true, configurable: true })
      await controller.toggle(element)
      expect(document.exitFullscreen).toHaveBeenCalled()
    })
  })

  describe('Event handling', () => {
    let controller: FullscreenController

    beforeEach(() => {
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
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)
      const boundHandlerChange = (controller as any).boundHandlerChange
      const boundHandlerError = (controller as any).boundHandlerError
      controller.destroy()
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', boundHandlerChange, false)
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenerror', boundHandlerError, false)
    })
  })
})
