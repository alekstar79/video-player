import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VideoPlayer } from '@/core/VideoPlayer'
import { EventEmitter } from '@/core/events/EventEmitter'
import { VideoController } from '@/modules/controls/VideoController'
import { VolumeController } from '@/modules/controls/VolumeController'

describe('VideoPlayer', () => {
  let container: HTMLElement
  let config: any
  let mockVideoController: any
  let mockVolumeController: any
  let mockPlaybackController: any
  let mockFullscreenController: any
  let mockTimelineController: any

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)

    // Basic config
    config = {
      container,
      showControls: true,
      initialSources: [],
      autoPlay: false,
      logging: false
    }

    // Create mock controllers
    mockVideoController = {
      play: vi.fn(),
      pause: vi.fn(),
      togglePlay: vi.fn(),
      setVolume: vi.fn(),
      setMuted: vi.fn(),
      setPlaybackRate: vi.fn(),
      setCurrentTime: vi.fn(),
      skip: vi.fn(),
      setSource: vi.fn(),
      loadVideoFile: vi.fn(),
      loadVideoFromUrl: vi.fn(),
      setLoop: vi.fn(),
      getIsPlaying: vi.fn(() => false),
      getVolume: vi.fn(() => 0.7),
      getMuted: vi.fn(() => false),
      getPlaybackRate: vi.fn(() => 1.0),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 0),
      getVideoElement: vi.fn(() => document.createElement('video')),
      destroy: vi.fn()
    }

    mockVolumeController = {
      setVolume: vi.fn(),
      updateIcon: vi.fn(),
      adjustVolume: vi.fn(),
      destroy: vi.fn()
    }

    mockPlaybackController = {
      destroy: vi.fn()
    }

    mockFullscreenController = {
      toggle: vi.fn(),
      destroy: vi.fn()
    }

    mockTimelineController = {
      updateProgress: vi.fn(),
      setDuration: vi.fn(),
      destroy: vi.fn()
    }

    // Mock constructor dependencies
    vi.spyOn(VideoController.prototype as any, 'initializeEventListeners')

    // Mock the controllers instantiation
    vi.spyOn(VideoController.prototype, 'constructor' as any).mockImplementation(() => mockVideoController)
    vi.spyOn(VolumeController.prototype, 'constructor' as any).mockImplementation(() => mockVolumeController)
    // Note: We'll need to mock other controllers similarly
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  })

  describe('Initialization', () => {
    it('should create VideoPlayer instance with default config', () => {
      const player = new VideoPlayer(config, document)

      expect(player).toBeInstanceOf(VideoPlayer)
      expect(player.events).toBeInstanceOf(EventEmitter)
      expect(player.config).toEqual(expect.objectContaining({
        container,
        showControls: true
      }))
    })

    it('should parse boolean config values correctly', () => {
      const player = new VideoPlayer({
        ...config,
        autoPlay: 'true',
        muted: 'false',
        logging: 'true'
      }, document)

      expect(player.config.autoPlay).toBe(true)
      expect(player.config.muted).toBe(false)
      expect(player.logging).toBe(true)
    })

    it('should initialize with sources', () => {
      const sources = [
        'video1.mp4',
        { title: 'Video 2', url: 'video2.mp4' }
      ]

      const player = new VideoPlayer({
        ...config,
        initialSources: sources
      }, document)

      expect(player.sources.length).toBe(2)
      expect(player.sources[0].title).toBe('video1.mp4')
      expect(player.sources[1].title).toBe('Video 2')
    })
  })

  describe('Source management', () => {
    let player: VideoPlayer

    beforeEach(() => {
      player = new VideoPlayer(config, document)
      // Override controllers with mocks for testing
      player.videoController = mockVideoController
      player.volumeController = mockVolumeController
    })

    it('should normalize string sources', () => {
      const sources = ['video1.mp4', 'http://example.com/video2.mp4']
      const normalized = player.normalizeSources(sources)

      expect(normalized).toEqual([
        { title: 'video1.mp4', url: 'video1.mp4' },
        { title: 'video2.mp4', url: 'http://example.com/video2.mp4' }
      ])
    })

    it('should normalize object sources', () => {
      const sources = [
        { title: 'Custom Title', url: 'video1.mp4' },
        { source: 'video2.mp4', description: 'Test' } // Using 'source' instead of 'url'
      ]

      const normalized = player.normalizeSources(sources)

      expect(normalized).toEqual([
        { title: 'Custom Title', url: 'video1.mp4' },
        { title: 'video2.mp4', url: 'video2.mp4', description: 'Test' }
      ])
    })

    it('should add source to sources array', () => {
      player.addSource({ title: 'New Video', url: 'new.mp4' })

      expect(player.sources.length).toBe(1)
      expect(player.sources[0]).toEqual({
        title: 'New Video',
        url: 'new.mp4'
      })
    })

    it('should not add duplicate sources', () => {
      player.addSource({ title: 'Video', url: 'video.mp4' })
      player.addSource({ title: 'Video Duplicate', url: 'video.mp4' })

      expect(player.sources.length).toBe(1)
      expect(player.sources[0].title).toBe('Video')
    })

    it('should get current source', () => {
      player.sources = [
        { title: 'Video 1', url: 'video1.mp4' },
        { title: 'Video 2', url: 'video2.mp4' }
      ]
      player.currentSourceIndex = 1

      expect(player.getCurrentSource()).toEqual({
        title: 'Video 2',
        url: 'video2.mp4'
      })
    })

    it('should switch between sources', async () => {
      player.sources = [
        { title: 'Video 1', url: 'video1.mp4' },
        { title: 'Video 2', url: 'video2.mp4' }
      ]

      await player.switchToSource(1)

      expect(mockVideoController.loadVideoFromUrl).toHaveBeenCalledWith('video2.mp4', undefined)
      expect(player.currentSourceIndex).toBe(1)
    })
  })

  describe('Playback controls', () => {
    let player: VideoPlayer

    beforeEach(() => {
      player = new VideoPlayer(config, document)
      player.videoController = mockVideoController
    })

    it('should play video', async () => {
      await player.play()
      expect(mockVideoController.play).toHaveBeenCalled()
    })

    it('should pause video', () => {
      player.pause()
      expect(mockVideoController.pause).toHaveBeenCalled()
    })

    it('should toggle play/pause', async () => {
      await player.togglePlay()
      expect(mockVideoController.togglePlay).toHaveBeenCalled()
    })

    it('should skip time', () => {
      player.skip(5)
      expect(mockVideoController.skip).toHaveBeenCalledWith(5)

      player.skip(-3)
      expect(mockVideoController.skip).toHaveBeenCalledWith(-3)
    })

    it('should seek to specific time', () => {
      player.seekTo(30)
      expect(mockVideoController.setCurrentTime).toHaveBeenCalledWith(30)
    })
  })

  describe('Volume controls', () => {
    let player: VideoPlayer

    beforeEach(() => {
      player = new VideoPlayer(config, document)
      player.videoController = mockVideoController
      player.volumeController = mockVolumeController
    })

    it('should set volume', () => {
      player.setVolume(0.8)
      expect(mockVideoController.setVolume).toHaveBeenCalledWith(0.8)
    })

    it('should set muted state', () => {
      player.setMuted(true)
      expect(mockVideoController.setMuted).toHaveBeenCalledWith(true)
      expect(mockVolumeController.updateIcon).toHaveBeenCalled()
    })

    it('should get volume', () => {
      mockVideoController.getVolume.mockReturnValue(0.6)
      expect(player.getVolume()).toBe(0.6)
    })

    it('should get muted state', () => {
      mockVideoController.getMuted.mockReturnValue(true)
      expect(player.getIsMuted()).toBe(true)
    })
  })

  describe('Loop modes', () => {
    let player: VideoPlayer

    beforeEach(() => {
      player = new VideoPlayer(config, document)
      player.videoController = mockVideoController
    })

    it('should toggle loop modes', () => {
      expect(player.getLoopMode()).toBe('none')

      player.toggleLoop()
      expect(player.getLoopMode()).toBe('one')
      expect(mockVideoController.setLoop).toHaveBeenCalledWith(true)

      player.toggleLoop()
      expect(player.getLoopMode()).toBe('all')
      expect(mockVideoController.setLoop).toHaveBeenCalledWith(false) // 'all' doesn't use video.loop

      player.toggleLoop()
      expect(player.getLoopMode()).toBe('none')
    })

    it('should set specific loop mode', () => {
      player.setLoopMode('all')
      expect(player.getLoopMode()).toBe('all')

      player.setLoopMode('one')
      expect(player.getLoopMode()).toBe('one')
      expect(mockVideoController.setLoop).toHaveBeenCalledWith(true)
    })

    it('should get loop state (backward compatibility)', () => {
      player.setLoopMode('one')
      expect(player.getLoop()).toBe(true)

      player.setLoopMode('all')
      expect(player.getLoop()).toBe(true)

      player.setLoopMode('none')
      expect(player.getLoop()).toBe(false)
    })
  })

  describe('Event system', () => {
    let player: VideoPlayer

    beforeEach(() => {
      player = new VideoPlayer(config, document)
    })

    it('should register event listeners', () => {
      const callback = vi.fn()

      player.on('play', callback)
      player.events.emit('play', undefined)

      expect(callback).toHaveBeenCalledWith(undefined)
    })

    it('should remove event listeners', () => {
      const callback = vi.fn()

      player.on('pause', callback)
      player.off('pause', callback)
      player.events.emit('pause', undefined)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should emit sourcechanged event when switching sources', async () => {
      const callback = vi.fn()
      player.on('sourcechanged', callback)

      player.sources = [
        { title: 'Video 1', url: 'video1.mp4' },
        { title: 'Video 2', url: 'video2.mp4' }
      ]
      player.videoController = mockVideoController

      await player.switchToSource(1)

      expect(callback).toHaveBeenCalledWith(1)
    })
  })

  describe('Cleanup', () => {
    it('should destroy all controllers', () => {
      const player = new VideoPlayer(config, document)

      // Replace with mocks
      player.videoController = mockVideoController
      player.volumeController = mockVolumeController
      player.playbackController = mockPlaybackController
      player.fullscreenController = mockFullscreenController
      player.timelineController = mockTimelineController

      player.destroy()

      expect(mockVideoController.destroy).toHaveBeenCalled()
      expect(mockVolumeController.destroy).toHaveBeenCalled()
      expect(mockPlaybackController.destroy).toHaveBeenCalled()
      expect(mockFullscreenController.destroy).toHaveBeenCalled()
      expect(mockTimelineController.destroy).toHaveBeenCalled()
    })
  })
})
