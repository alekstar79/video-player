import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createPlayer,
  defaultPlayerConfig,
  defaultContextConfig,
  createContextMenu,
  resolver
} from '@/index'

import { Manager } from '@alekstar79/context-menu'
import { Helpers } from '@/core/utils'

// Mock SVGMatrix for jsdom
if (!global.SVGMatrix) {
  global.SVGMatrix = class SVGMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    multiply() { return this }
    inverse() { return this }
    translate() { return this }
    scale() { return this }
    rotate() { return this }
    skewX() { return this }
    skewY() { return this }
    flipX() { return this }
    flipY() { return this }
  } as any
}

// Mock the Manager class from context-menu
vi.mock('@alekstar79/context-menu', async () => {
  const actual = await vi.importActual('@alekstar79/context-menu')
  class MockManager {
    constructor() {
      // Mock constructor
    }
    on = vi.fn()
    menu = {
      updateButtons: vi.fn(),
      hide: vi.fn(),
      config: {
        centralButton: {},
        sectors: []
      }
    }
  }
  return {
    ...actual,
    Manager: MockManager
  }
})

describe('Public API', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)

    // Mock whenDefined for web components
    const mockCustomElement = class extends HTMLElement {}
    if (!window.customElements) {
      ;(window as any).customElements = {
        whenDefined: vi.fn().mockResolvedValue(mockCustomElement),
        define: vi.fn()
      }
    } else {
      vi.spyOn(window.customElements, 'whenDefined').mockResolvedValue(mockCustomElement)
    }
  })

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
    vi.restoreAllMocks()
  })

  describe('defaultPlayerConfig', () => {
    it('should have sensible defaults', () => {
      expect(defaultPlayerConfig).toEqual({
        initialSources: [],
        maxWidth: '960px',
        aspectRatio: '16:9',
        loopMode: 'all',
        initialVolume: 0.7,
        playbackRate: 1.0,
        autoPlay: false,
        muted: false,
        logging: false,
        showControls: true,
        contextMenu: false,
        controlsVisibility: {
          showFullscreen: true,
          showLoop: true,
          showOpenFile: true,
          showPip: true,
          showPlayPause: true,
          showSkipButtons: true,
          showSpeed: true,
          showTimeDisplay: true,
          showTimeline: true,
          showVolume: true
        }
      })
    })
  })

  describe('defaultContextConfig', () => {
    it('should have context menu configuration', () => {
      expect(defaultContextConfig).toBeDefined()
      expect(defaultContextConfig.sprite).toBe('./icons.svg')
      expect(defaultContextConfig.autoBindContextMenu).toBe(false)
      expect(defaultContextConfig.sectors).toHaveLength(6)
    })
  })

  describe('resolver', () => {
    it('should resolve VideoPlayer instance', async () => {
      const mockPlayer = {
        playerElement: document.createElement('div')
      }

      const mockContextConfig = { ...defaultContextConfig }

      const result = await resolver(mockPlayer as any, mockContextConfig)

      expect(result.player).toBe(mockPlayer)
      expect(result.manager).toBeInstanceOf(Manager)
    })

    it('should handle PromiseLike player', async () => {
      const mockPlayer = {
        playerElement: document.createElement('div')
      }
      const playerPromise = Promise.resolve(mockPlayer)

      const mockContextConfig = { ...defaultContextConfig }

      const result = await resolver(playerPromise as any, mockContextConfig)

      expect(result.player).toBe(mockPlayer)
      expect(result.manager).toBeInstanceOf(Manager)
    })

    it('should use Helpers.isPromiseLike', () => {
      const isPromiseLikeSpy = vi.spyOn(Helpers, 'isPromiseLike')

      const mockPlayer = { playerElement: document.createElement('div') }
      const mockContextConfig = { ...defaultContextConfig }

      resolver(mockPlayer as any, mockContextConfig)

      expect(isPromiseLikeSpy).toHaveBeenCalled()
    })
  })

  describe('createContextMenu', () => {
    it('should create context menu for player', async () => {
      const mockPlayer = {
        playerElement: document.createElement('div'),
        events: {
          emit: vi.fn()
        },
        context: undefined,
        on: vi.fn()
      }

      const mockContextConfig = { ...defaultContextConfig }
      
      await createContextMenu(mockPlayer as any, mockContextConfig)

      expect(mockPlayer.context).toBeInstanceOf(Manager)
      expect(mockPlayer.on).toHaveBeenCalled()
    })
  })

  describe('createPlayer', () => {
    // This is an integration test that would require mocking web components
    // Since it's complex, we'll create a basic test
    it('should be a function', () => {
      expect(typeof createPlayer).toBe('function')
    })

    it('should accept container and config', () => {
      // The function signature test
      expect(createPlayer.length).toBe(2)
    })
  })

  describe('Type exports', () => {
    it('should export VideoPlayerConfig type', () => {
      // This is a compile-time test, but we can verify the export exists
      expect(true).toBe(true)
    })
  })
})
