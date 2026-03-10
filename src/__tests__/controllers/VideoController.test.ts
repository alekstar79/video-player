import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VideoController } from '@/modules/controls/VideoController'
import { Filesystem } from '@/core/utils'

describe('VideoController', () => {
  let videoElement: HTMLVideoElement
  let eventHandlers: any
  let controller: VideoController

  beforeEach(() => {
    vi.useFakeTimers()
    videoElement = document.createElement('video')

    // Mock methods that JSDOM doesn't implement
    vi.spyOn(videoElement, 'play').mockResolvedValue()
    vi.spyOn(videoElement, 'pause').mockImplementation(() => {})
    vi.spyOn(videoElement, 'load').mockImplementation(() => {})

    Object.defineProperty(videoElement, 'poster', {
      value: '',
      writable: true,
      configurable: true,
    })

    eventHandlers = {
      onTimeUpdate: vi.fn(),
      onVolumeChange: vi.fn(),
      onPlay: vi.fn(),
      onPause: vi.fn(),
      onEnded: vi.fn(),
      onLoadedMetadata: vi.fn(),
      onError: vi.fn(),
      onFileLoaded: vi.fn(),
    }

    controller = new VideoController(videoElement, eventHandlers, false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Basic controls', () => {
    it('should play video when play() is called', async () => {
      controller.setSource('test.mp4') // Set source to allow play
      const playPromise = controller.play()
      await vi.runAllTimersAsync()
      await playPromise
      expect(videoElement.play).toHaveBeenCalled()
    })

    it('should pause video when pause() is called', () => {
      controller.pause()
      expect(videoElement.pause).toHaveBeenCalled()
    })

    it('should toggle play/pause state', async () => {
      controller.setSource('test.mp4')
      expect(controller.getIsPlaying()).toBe(false)
      
      // Toggle to play
      await controller.togglePlay()
      await vi.runAllTimersAsync()
      videoElement.dispatchEvent(new Event('play')) // Simulate event
      expect(videoElement.play).toHaveBeenCalled()
      expect(controller.getIsPlaying()).toBe(true)
      
      // Toggle to pause
      await controller.togglePlay()
      await vi.runAllTimersAsync()
      videoElement.dispatchEvent(new Event('pause')) // Simulate event
      expect(videoElement.pause).toHaveBeenCalled()
      expect(controller.getIsPlaying()).toBe(false)
    })

    it('should set current time correctly', () => {
      Object.defineProperty(videoElement, 'duration', { value: 100, writable: true, configurable: true })
      controller.setCurrentTime(50)
      expect(videoElement.currentTime).toBe(50)
    })

    it('should clamp current time within video duration', () => {
      Object.defineProperty(videoElement, 'duration', { value: 100, writable: true, configurable: true })
      controller.setCurrentTime(150)
      expect(videoElement.currentTime).toBe(100)
      controller.setCurrentTime(-10)
      expect(videoElement.currentTime).toBe(0)
    })

    it('should skip time correctly', () => {
      videoElement.currentTime = 10
      Object.defineProperty(videoElement, 'duration', { value: 100, writable: true, configurable: true })
      controller.skip(5)
      expect(videoElement.currentTime).toBe(15)
      controller.skip(-3)
      expect(videoElement.currentTime).toBe(12)
    })
  })

  describe('Volume controls', () => {
    it('should set volume correctly', () => {
      controller.setVolume(0.7)
      expect(videoElement.volume).toBe(0.7)
    })

    it('should clamp volume between 0 and 1', () => {
      controller.setVolume(1.5)
      expect(videoElement.volume).toBe(1)
      controller.setVolume(-0.5)
      expect(videoElement.volume).toBe(0)
    })

    it('should toggle mute', () => {
      expect(videoElement.muted).toBe(false)
      controller.toggleMute()
      expect(videoElement.muted).toBe(true)
      controller.toggleMute()
      expect(videoElement.muted).toBe(false)
    })

    it('should set muted state', () => {
      controller.setMuted(true)
      expect(videoElement.muted).toBe(true)
      controller.setMuted(false)
      expect(videoElement.muted).toBe(false)
    })
  })

  describe('Playback rate', () => {
    it('should set playback rate correctly', () => {
      controller.setPlaybackRate(1.5)
      expect(videoElement.playbackRate).toBe(1.5)
    })

    it('should clamp playback rate between 0.25 and 4', () => {
      controller.setPlaybackRate(5)
      expect(videoElement.playbackRate).toBe(4)
      controller.setPlaybackRate(0.1)
      expect(videoElement.playbackRate).toBe(0.25)
    })
  })

  describe('Source management', () => {
    it('should set video source', () => {
      const src = 'http://example.com/video.mp4'
      controller.setSource(src)
      expect(videoElement.src).toContain(src)
      expect(videoElement.crossOrigin).toBe('anonymous')
    })

    it('should handle same-origin sources correctly', () => {
      const src = '/local/video.mp4'
      controller.setSource(src)
      expect(videoElement.crossOrigin).toBeNull()
    })

    it('should set poster image', async () => {
      const thumb = 'http://example.com/thumb.jpg'
      let onload: () => void = () => {}
      
      // Mock Image constructor to intercept onload
      vi.spyOn(window, 'Image').mockImplementation(() => {
        const img = new window.Image()
        Object.defineProperty(img, 'onload', {
          set(value) {
            onload = value
          },
        })
        return img
      })

      controller.setPoster(thumb)
      onload() // Manually trigger onload
      await vi.runAllTimersAsync()
      
      expect(videoElement.poster).toBe(thumb)
    })
  })

  describe('File loading', () => {
    beforeEach(() => {
      vi.spyOn(Filesystem, 'createObjectURL').mockReturnValue('blob:test-url')
      vi.spyOn(Filesystem, 'isPickerSupported').mockReturnValue(true)
      vi.spyOn(Filesystem, 'selectFileWithPicker').mockResolvedValue(new File(['test'], 'video.mp4', { type: 'video/mp4' }))
    })

    it('should load video from file', async () => {
      await controller.loadVideoFile()
      await vi.runAllTimersAsync()
      expect(Filesystem.selectFileWithPicker).toHaveBeenCalledWith('video/*')
      expect(eventHandlers.onFileLoaded).toHaveBeenCalled()
    })

    it('should load video from URL', async () => {
      const url = 'http://example.com/video.mp4'
      await controller.loadVideoFromUrl(url)
      await vi.runAllTimersAsync()
      expect(videoElement.src).toContain(url)
    })
  })

  describe('Event handling', () => {
    it('should handle timeupdate events', () => {
      videoElement.currentTime = 30
      Object.defineProperty(videoElement, 'duration', { value: 100, writable: true, configurable: true })
      videoElement.dispatchEvent(new Event('timeupdate'))
      expect(eventHandlers.onTimeUpdate).toHaveBeenCalledWith(30, 100)
    })

    it('should handle volumechange events', () => {
      videoElement.volume = 0.5
      videoElement.muted = true
      videoElement.dispatchEvent(new Event('volumechange'))
      expect(eventHandlers.onVolumeChange).toHaveBeenCalledWith(0.5, true)
    })

    it('should handle play events', () => {
      videoElement.dispatchEvent(new Event('play'))
      expect(eventHandlers.onPlay).toHaveBeenCalled()
      expect(controller.getIsPlaying()).toBe(true)
    })

    it('should handle pause events', () => {
      videoElement.dispatchEvent(new Event('pause'))
      expect(eventHandlers.onPause).toHaveBeenCalled()
      expect(controller.getIsPlaying()).toBe(false)
    })

    it('should handle ended events', () => {
      videoElement.dispatchEvent(new Event('ended'))
      expect(eventHandlers.onEnded).toHaveBeenCalled()
    })

    it('should handle loadedmetadata events', () => {
      videoElement.dispatchEvent(new Event('loadedmetadata'))
      expect(eventHandlers.onLoadedMetadata).toHaveBeenCalled()
    })

    it('should handle error events', () => {
      Object.defineProperty(videoElement, 'error', { value: { code: 1, message: 'Test error' }, configurable: true })
      videoElement.dispatchEvent(new Event('error'))
      expect(eventHandlers.onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('Getters', () => {
    it('should get current source', () => {
      videoElement.src = 'http://example.com/video.mp4'
      expect(controller.getCurrentSource()).toBe(videoElement.src)
    })

    it('should get current time', () => {
      videoElement.currentTime = 25
      expect(controller.getCurrentTime()).toBe(25)
    })

    it('should get duration', () => {
      Object.defineProperty(videoElement, 'duration', { value: 120, writable: true, configurable: true })
      expect(controller.getDuration()).toBe(120)
    })

    it('should get volume', () => {
      videoElement.volume = 0.8
      expect(controller.getVolume()).toBe(0.8)
    })

    it('should get muted state', () => {
      videoElement.muted = true
      expect(controller.getMuted()).toBe(true)
    })

    it('should get playback rate', () => {
      videoElement.playbackRate = 1.5
      expect(controller.getPlaybackRate()).toBe(1.5)
    })

    it('should get playing state', () => {
      expect(controller.getIsPlaying()).toBe(false)
      videoElement.dispatchEvent(new Event('play'))
      expect(controller.getIsPlaying()).toBe(true)
      videoElement.dispatchEvent(new Event('pause'))
      expect(controller.getIsPlaying()).toBe(false)
    })
  })

  describe('Cleanup', () => {
    it('should clean up event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(videoElement, 'removeEventListener')
      controller.destroy()
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(7)
    })

    it('should revoke blob URLs on destroy', async () => {
      const revokeSpy = vi.spyOn(Filesystem, 'revokeObjectURL')
      vi.spyOn(Filesystem, 'selectFileWithPicker').mockResolvedValue(new File(['test'], 'video.mp4', { type: 'video/mp4' }))
      
      // This method internally creates a blob URL and stores it
      await controller.loadVideoFile()
      await vi.runAllTimersAsync()
      
      controller.destroy()

      expect(revokeSpy).toHaveBeenCalledWith('blob:test-url')
    })
  })
})
