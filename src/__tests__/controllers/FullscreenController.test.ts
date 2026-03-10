import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import type { CustomChangeCallback } from '@/types'

describe('FullscreenController', () => {
  let element: HTMLElement
  let onChangeHandler: CustomChangeCallback
  let onErrorHandler: CustomChangeCallback

  // A helper to setup standard API mocks for a given test
  const setupStandardMocks = (supported = true) => {
    const requestFullscreenMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: supported ? requestFullscreenMock : undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      value: supported ? requestFullscreenMock : undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperties(document, {
      fullscreenEnabled: { value: supported, writable: true, configurable: true },
      fullscreenElement: { value: null, writable: true, configurable: true },
      exitFullscreen: { value: vi.fn().mockResolvedValue(undefined), writable: true, configurable: true },
    })
  }

  beforeEach(() => {
    element = document.createElement('div')
    onChangeHandler = vi.fn<CustomChangeCallback>()
    onErrorHandler = vi.fn<CustomChangeCallback>()
    vi.spyOn(document, 'addEventListener')
    vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up any potential mocks
    delete (document.documentElement as any).requestFullscreen
    delete (HTMLElement.prototype as any).requestFullscreen
    delete (document.documentElement as any).webkitRequestFullscreen
    delete (document as any).webkitFullscreenEnabled
  })

  describe('Initialization', () => {
    it('should create controller with element and handlers', () => {
      setupStandardMocks(true)
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)
      expect(controller).toBeInstanceOf(FullscreenController)
      expect(controller.isEnabled).toBe(true)
    })

    it('should warn when fullscreen is not supported', () => {
      // Ensure no APIs are mocked for this test
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const controller = new FullscreenController(element)
      expect(consoleWarnSpy).toHaveBeenCalledWith('Fullscreen is not supported in this browser')
      expect(controller.supportedAPI).toBeUndefined()
      consoleWarnSpy.mockRestore()
    })

    it('should register event listeners when handlers provided', () => {
      setupStandardMocks(true)
      new FullscreenController(element, onChangeHandler, onErrorHandler)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function), false)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenerror', expect.any(Function), false)
    })
  })

  describe('API detection', () => {
    it('should detect standard fullscreen API', () => {
      setupStandardMocks(true)
      const controller = new FullscreenController(element)
      expect(controller.supportedAPI?.request).toBe('requestFullscreen')
    })

    it('should fall back to webkit API if standard not available', () => {
      // Mock only the webkit version
      Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', { value: vi.fn(), configurable: true })
      Object.defineProperty(document, 'webkitFullscreenEnabled', { value: true, configurable: true })
      
      const controller = new FullscreenController(element)
      expect(controller.supportedAPI?.request).toContain('webkit')
    })
  })

  describe('Fullscreen operations', () => {
    beforeEach(() => {
      setupStandardMocks(true)
    })

    it('should request fullscreen', async () => {
      const controller = new FullscreenController(element)
      await controller.request(element)
      expect(element.requestFullscreen).toHaveBeenCalledWith({ navigationUI: 'auto' })
    })

    it('should request fullscreen with custom element and options', async () => {
      const controller = new FullscreenController(element)
      const customElement = document.createElement('video')
      const options = { navigationUI: 'hide' as FullscreenNavigationUI }
      await controller.request(customElement, options)
      expect(customElement.requestFullscreen).toHaveBeenCalledWith(options)
    })

    it('should throw error when fullscreen not enabled', async () => {
      setupStandardMocks(false)
      const controller = new FullscreenController(element)
      await expect(controller.request()).rejects.toThrow('Fullscreen is not enabled')
    })

    it('should exit fullscreen', async () => {
      const controller = new FullscreenController(element)
      Object.defineProperty(document, 'fullscreenElement', { value: element, writable: true })
      await controller.exit()
      expect(document.exitFullscreen).toHaveBeenCalled()
    })

    it('should return false when exiting without being in fullscreen', async () => {
      const controller = new FullscreenController(element)
      const result = await controller.exit()
      expect(document.exitFullscreen).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('should toggle fullscreen', async () => {
      const controller = new FullscreenController(element)
      await controller.toggle(element)
      expect(element.requestFullscreen).toHaveBeenCalled()

      Object.defineProperty(document, 'fullscreenElement', { value: element, writable: true })
      await controller.toggle(element)
      expect(document.exitFullscreen).toHaveBeenCalled()
    })
  })

  describe('Event handling', () => {
    beforeEach(() => {
      setupStandardMocks(true)
    })

    it('should register and unregister event listeners', () => {
      const controller = new FullscreenController(element)
      const callback = vi.fn()
      controller.on('change', callback)
      expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', callback, false)
      controller.off('change', callback)
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', callback, false)
    })

    it('should handle onchange and onerror shortcuts', () => {
      const controller = new FullscreenController(element)
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
      setupStandardMocks(true)
      const controller = new FullscreenController(element, onChangeHandler, onErrorHandler)
      const boundHandlerChange = (controller as any).boundHandlerChange
      const boundHandlerError = (controller as any).boundHandlerError
      controller.destroy()
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', boundHandlerChange, false)
      expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenerror', boundHandlerError, false)
    })
  })
})
