import { VideoControls, VideoElement, VideoEventHandlers } from './types'
import { Filesystem } from '@/core/utils/filesystem.ts'
import { Helpers } from '@/core/utils/helpers'

/**
 * Controller for video element and basic playback operations
 */
export class VideoController implements VideoControls
{
  private readonly video: VideoElement
  private readonly logging: boolean = false

  private eventHandlers: VideoEventHandlers
  private currentBlobUrl: string | null = null
  private isPlaying: boolean = false
  private hasSource: boolean = false

  constructor(
    videoElement: HTMLVideoElement,
    eventHandlers: VideoEventHandlers,
    logging: boolean = false,
    loop: boolean = false
  ) {
    this.video = videoElement as VideoElement
    this.eventHandlers = eventHandlers
    this.logging = logging
    this.video.loop = loop
    this.initializeEventListeners()
  }

  /**
   * Initialize all video event listeners
   */
  private initializeEventListeners(): void
  {
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this)
    this.handleVolumeChange = this.handleVolumeChange.bind(this)
    this.handlePlay = this.handlePlay.bind(this)
    this.handlePause = this.handlePause.bind(this)
    this.handleEnded = this.handleEnded.bind(this)
    this.handleLoadedMetadata = this.handleLoadedMetadata.bind(this)
    this.handleError = this.handleError.bind(this)

    this.video.addEventListener('timeupdate', this.handleTimeUpdate)
    this.video.addEventListener('volumechange', this.handleVolumeChange)
    this.video.addEventListener('play', this.handlePlay)
    this.video.addEventListener('pause', this.handlePause)
    this.video.addEventListener('ended', this.handleEnded)
    this.video.addEventListener('loadedmetadata', this.handleLoadedMetadata)
    this.video.addEventListener('error', this.handleError)
  }

  private handleTimeUpdate(): void
  {
    // Debug logging
    if (this.logging && this.video.currentTime > 0 && this.video.duration > 0) {
      console.log(`Time update: ${this.video.currentTime.toFixed(2)} / ${this.video.duration.toFixed(2)}`)
    }
    this.eventHandlers.onTimeUpdate(this.video.currentTime, this.video.duration)
  }

  private handleVolumeChange(): void
  {
    this.eventHandlers.onVolumeChange(this.video.volume, this.video.muted)
  }

  private handlePlay(): void
  {
    this.isPlaying = true
    this.eventHandlers.onPlay()
  }

  private handlePause(): void
  {
    this.isPlaying = false
    this.eventHandlers.onPause()
  }

  private handleEnded(): void
  {
    this.eventHandlers.onEnded()
  }

  private handleLoadedMetadata(): void
  {
    if (this.logging) {
      console.log(`Video metadata loaded. Duration: ${this.video.duration}`)
    }

    this.eventHandlers.onLoadedMetadata()
  }

  private handleError(): void
  {
    const error = new Error(this.video.error?.message || 'Video error occurred')

    if (this.logging) {
      console.error('Video error:', error, this.video.error)
    }

    this.eventHandlers.onError(error)
  }

  // Public API Methods

  async play(): Promise<void>
  {
    // If no source is set, open file dialog first
    if (!this.hasSource) {
      await this.loadVideoFile()
      return
    }

    try {
      await this.video.play()
    } catch (error) {
      console.error('Error playing video:', error)
      throw error
    }
  }

  pause(): void
  {
    this.video.pause()
  }

  async togglePlay(): Promise<void>
  {
    if (this.isPlaying) {
      this.pause()
    } else {
      await this.play()
    }
  }

  setCurrentTime(time: number): void
  {
    if (this.logging) console.log(`Setting current time to: ${time}`)

    this.video.currentTime = Helpers.clamp(time, 0, this.video.duration || 0)
  }

  setVolume(volume: number): void
  {
    this.video.volume = Helpers.clamp(volume, 0, 1)
  }

  setPlaybackRate(rate: number): void
  {
    this.video.playbackRate = Helpers.clamp(rate, 0.25, 4)
  }

  setLoop(loop: boolean): void
  {
    this.video.loop = loop
  }

  getLoop(): boolean
  {
    return this.video.loop
  }

  setMuted(muted: boolean): void
  {
    this.video.muted = muted
  }

  toggleMute(): void
  {
    this.video.muted = !this.video.muted
  }

  skip(seconds: number): void
  {
    this.setCurrentTime(this.video.currentTime + seconds)
  }

  setSource(src: string): void
  {
    this.video.src = src
    this.hasSource = true

    if (this.logging) {
      console.log('Video source set:', src)
    }
  }

  async setVideoSource(file: File, muted: boolean = true): Promise<void>
  {
    // Release the previous blob URL if it exists
    if (this.currentBlobUrl) {
      Filesystem.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }

    const url = Filesystem.createObjectURL(file)

    this.currentBlobUrl = url

    // Set the source
    this.setSource(url)

    // Set muted to bypass autoplay restrictions
    if (this.video.muted !== muted) {
      this.video.muted = muted
    }

    try {
      // Trying to reproduce
      await this.video.play()
    } catch (error) {
      // @ts-ignore
      if (error.name === 'NotAllowedError' && !muted) {
        // Auto-playback with sound is blocked
        this.video.muted = true
        await this.video.play()
        this.handleVolumeChange()
      } else {
        throw error
      }
    }
  }

  /**
   * Load video from URL with fetch and blob
   */
  async loadVideoFromUrl(url: string, muted: boolean = true): Promise<void>
  {
    try {
      if (this.logging) {
        console.log('Trying direct source assignment')
      }

      this.setSource(url)

      if (this.video.muted !== muted) {
        this.video.muted = muted
      }

      this.handleVolumeChange()

      await this.video.play()

    } catch (fallbackError) {
      throw new Error('[HTTP error]: Upload of the remote file failed')
    }
  }

  /**
   * Open file dialog and load selected video file
   */
  async loadVideoFile(): Promise<void> {
    try {
      const file = await Filesystem.open('video/*') as File
      if (file) {
        await this.setVideoSource(file, false)
      }
    } catch (error) {
      console.error('Error loading video file:', error)
      throw error
    }
  }

  // Getters

  getCurrentSource(): string
  {
    return this.video.src
  }

  getCurrentTime(): number
  {
    return this.video.currentTime
  }

  getDuration(): number
  {
    return this.video.duration || 0
  }

  getVolume(): number
  {
    return this.video.volume
  }

  getMuted(): boolean
  {
    return this.video.muted
  }

  getIsPlaying(): boolean
  {
    return this.isPlaying
  }

  getPlaybackRate(): number
  {
    return this.video.playbackRate
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.video.removeEventListener('timeupdate', this.handleTimeUpdate)
    this.video.removeEventListener('volumechange', this.handleVolumeChange)
    this.video.removeEventListener('play', this.handlePlay)
    this.video.removeEventListener('pause', this.handlePause)
    this.video.removeEventListener('ended', this.handleEnded)
    this.video.removeEventListener('loadedmetadata', this.handleLoadedMetadata)
    this.video.removeEventListener('error', this.handleError)

    // Releasing the blob URL upon destruction
    if (this.currentBlobUrl) {
      Filesystem.revokeObjectURL(this.currentBlobUrl)
      this.currentBlobUrl = null
    }
  }
}
