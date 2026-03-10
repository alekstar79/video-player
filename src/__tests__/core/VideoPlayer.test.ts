import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VideoPlayer } from '@/core/VideoPlayer'
import { EventEmitter } from '@/core/events/EventEmitter'
import { VideoController } from '@/modules/controls/VideoController'
import { VolumeController } from '@/modules/controls/VolumeController'
import { PlaybackController } from '@/modules/controls/PlaybackController'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import { TimelineController } from '@/modules/controls/TimelineController'

// Mock dependencies, but not EventEmitter
vi.mock('@/modules/controls/VideoController')
vi.mock('@/modules/controls/VolumeController')
vi.mock('@/modules/controls/PlaybackController')
vi.mock('@/modules/controls/FullscreenController')
vi.mock('@/modules/controls/TimelineController')
vi.mock('@/core/utils/icon-helper')

describe('VideoPlayer', () => {
  let container: HTMLElement
  let config: any
  let player: VideoPlayer

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = `
      <div class="player">
        <video class="player__video"></video>
        <div class="player__panel"></div>
        <div class="player__top-panel"></div>
        <div class="player__main-icon"></div>
        <div class="player__no-files-message"></div>
        <div class="player__source-title"></div>
        <play-pause-button></play-pause-button>
        <loop-button></loop-button>
        <fullscreen-button></fullscreen-button>
        <pip-button></pip-button>
        <time-display></time-display>
        <playlist-button></playlist-button>
        <playlist-panel></playlist-panel>
        <preview-button></preview-button>
        <preview-panel></preview-panel>
        <volume-control></volume-control>
        <speed-options></speed-options>
        <timeline-control></timeline-control>
        <div class="j-source-prev"></div>
        <div class="j-source-next"></div>
      </div>
    `
    document.body.appendChild(container)
    config = { container }

    // Mock initializePlayer to prevent it from running automatically
    vi.spyOn(VideoPlayer.prototype, 'initializePlayer').mockImplementation(function (this: VideoPlayer) {
      this.playerElement = this.root.querySelector('.player') as HTMLElement
      this.videoController = new (vi.mocked(VideoController))({} as any, {
        onTimeUpdate: vi.fn(),
        onVolumeChange: vi.fn(),
        onPlay: vi.fn(),
        onPause: vi.fn(),
        onEnded: vi.fn(),
        onLoadedMetadata: vi.fn(),
        onError: vi.fn(),
        onFileLoaded: vi.fn(),
      })
      this.volumeController = new (vi.mocked(VolumeController))({} as any, {
        onVolumeChange: vi.fn(),
        onMuteToggle: vi.fn(),
      })
      this.playbackController = new (vi.mocked(PlaybackController))({} as any, () => {})
      this.fullscreenController = new (vi.mocked(FullscreenController))({} as any)
      this.timelineController = new (vi.mocked(TimelineController))({} as any, () => {})
      return Promise.resolve()
    })
    
    player = new VideoPlayer(config, document)
  })

  afterEach(() => {
    document.body.removeChild(container)
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should create VideoPlayer instance with default config', () => {
      expect(player).toBeInstanceOf(VideoPlayer)
      expect(player.events).toBeInstanceOf(EventEmitter)
    })

    it('should parse boolean config values correctly', () => {
      const playerWithParsedConfig = new VideoPlayer({ ...config, autoPlay: 'true', muted: 'false' })
      expect(playerWithParsedConfig.config.autoPlay).toBe(true)
      expect(playerWithParsedConfig.config.muted).toBe(false)
    })

    it('should initialize with sources', () => {
      const sources = ['video1.mp4', { title: 'Video 2', url: 'video2.mp4' }]
      const playerWithSources = new VideoPlayer({ ...config, initialSources: sources })
      expect(playerWithSources.sources.length).toBe(2)
    })
  })

  describe('Source management', () => {
    it('should normalize string sources', () => {
      const sources = ['video1.mp4', 'http://example.com/video2.mp4']
      const normalized = player.normalizeSources(sources)
      expect(normalized).toEqual([
        { title: 'video1.mp4', url: 'video1.mp4' },
        { title: 'video2.mp4', url: 'http://example.com/video2.mp4' }
      ])
    })

    it('should normalize object sources', () => {
      const sources = [{ title: 'Custom Title', url: 'video1.mp4' }]
      const normalized = player.normalizeSources(sources)
      expect(normalized).toEqual([{ title: 'Custom Title', url: 'video1.mp4' }])
    })

    it('should add source to sources array', () => {
      player.addSource({ url: 'new.mp4' })
      expect(player.sources).toHaveLength(1)
    })

    it('should not add duplicate sources', () => {
      player.addSource({ url: 'video.mp4' })
      player.addSource({ url: 'video.mp4' })
      expect(player.sources).toHaveLength(1)
    })

    it('should get current source', () => {
      player.sources = [{ title: 'Video 1', url: 'video1.mp4' }]
      player.currentSourceIndex = 0
      expect(player.getCurrentSource()).toEqual({ title: 'Video 1', url: 'video1.mp4' })
    })

    it('should switch between sources', async () => {
      player.sources = [{ title: 'v1', url: 'v1.mp4' }, { title: 'v2', url: 'v2.mp4' }]
      await player.switchToSource(1)
      expect(player.videoController.loadVideoFromUrl).toHaveBeenCalledWith('v2.mp4', undefined)
    })
  })

  describe('Playback controls', () => {
    it('should play video', async () => {
      await player.play()
      expect(player.videoController.play).toHaveBeenCalled()
    })

    it('should pause video', () => {
      player.pause()
      expect(player.videoController.pause).toHaveBeenCalled()
    })

    it('should toggle play/pause', async () => {
      await player.togglePlay()
      expect(player.videoController.togglePlay).toHaveBeenCalled()
    })

    it('should skip time', () => {
      player.skip(5)
      expect(player.videoController.skip).toHaveBeenCalledWith(5)
    })

    it('should seek to specific time', () => {
      player.seekTo(30)
      expect(player.videoController.setCurrentTime).toHaveBeenCalledWith(30)
    })
  })

  describe('Volume controls', () => {
    it('should set volume', () => {
      player.setVolume(0.8)
      expect(player.videoController.setVolume).toHaveBeenCalledWith(0.8)
    })

    it('should set muted state', () => {
      player.setMuted(true)
      expect(player.videoController.setMuted).toHaveBeenCalledWith(true)
    })

    it('should get volume', () => {
      player.getVolume()
      expect(player.videoController.getVolume).toHaveBeenCalled()
    })

    it('should get muted state', () => {
      player.getIsMuted()
      expect(player.videoController.getMuted).toHaveBeenCalled()
    })
  })

  describe('Loop modes', () => {
    it('should toggle loop modes', () => {
      player.setLoopMode('none')
      player.toggleLoop()
      expect(player.getLoopMode()).toBe('one')
      player.toggleLoop()
      expect(player.getLoopMode()).toBe('all')
    })

    it('should set specific loop mode', () => {
      player.setLoopMode('one')
      expect(player.videoController.setLoop).toHaveBeenCalledWith(true)
    })

    it('should get loop state (backward compatibility)', () => {
      player.setLoopMode('one')
      expect(player.getLoop()).toBe(true)
    })
  })

  describe('Event system', () => {
    it('should register event listeners', () => {
      const cb = vi.fn()
      player.on('play', cb)
      player.events.emit('play', undefined)
      expect(cb).toHaveBeenCalled()
    })

    it('should remove event listeners', () => {
      const cb = vi.fn()
      player.on('pause', cb)
      player.off('pause', cb)
      player.events.emit('pause', undefined)
      expect(cb).not.toHaveBeenCalled()
    })

    it('should emit sourcechanged event when switching sources', async () => {
      const cb = vi.fn()
      player.on('sourcechanged', cb)
      player.sources = [{ title: 'v1', url: 'v1.mp4' }]
      await player.switchToSource(0)
      expect(cb).toHaveBeenCalledWith(0)
    })
  })

  describe('Cleanup', () => {
    it('should destroy all controllers', () => {
      vi.spyOn(player.events, 'destroy')
      player.destroy()
      expect(player.videoController.destroy).toHaveBeenCalled()
      expect(player.volumeController.destroy).toHaveBeenCalled()
      expect(player.playbackController.destroy).toHaveBeenCalled()
      expect(player.fullscreenController.destroy).toHaveBeenCalled()
      expect(player.timelineController.destroy).toHaveBeenCalled()
      expect(player.events.destroy).toHaveBeenCalled()
    })
  })
})
