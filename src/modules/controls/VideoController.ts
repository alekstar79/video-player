import { VideoControls, VideoElement, VideoEventHandlers } from '@/types'
import { Filesystem, Helpers } from '@/core/utils'

/**
 * Controller for video element and basic playback operations
 */
export class VideoController implements VideoControls
{
  private readonly video: VideoElement
  private readonly logging: boolean = false

  private eventHandlers: VideoEventHandlers & { onFileLoaded?: (file: File, url: string) => void }
  private createdBlobUrls: string[] = []
  private isPlaying: boolean = false
  private hasSource: boolean = false

  constructor(
    videoElement: HTMLVideoElement,
    eventHandlers: VideoEventHandlers & { onFileLoaded?: (file: File, url: string) => void },
    logging: boolean = false
  ) {
    this.video = videoElement as VideoElement
    this.eventHandlers = eventHandlers
    this.logging = logging
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
    const error = this.video.error

    if (error && error.code !== error.MEDIA_ERR_ABORTED) {
      const errorMessage = error.message || 'Video error occurred'

      if (this.logging) {
        console.error('Video error:', errorMessage, error)
      }

      this.eventHandlers.onError(new Error(errorMessage))
    }
  }

  // Public API Methods

  public getVideoElement(): HTMLVideoElement {
    return this.video
  }

  async play(): Promise<void>
  {
    // If no source is set, open file dialog first
    if (!this.hasSource) {
      await this.loadVideoFile()
      return
    }

    try {
      await this.video.play()
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error playing video:', error)
        throw error
      }
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
    this.video.pause()
    this.video.removeAttribute('src')
    this.video.load()

    if (Helpers.isCrossOrigin(src)) {
      this.video.crossOrigin = 'anonymous'
    } else {
      this.video.crossOrigin = null
    }

    this.video.src = src
    this.video.load()
    this.hasSource = true

    if (this.logging) {
      console.log('Video source set:', src)
    }
  }

  async setVideoSource(file: File): Promise<string>
  {
    const url = Filesystem.createObjectURL(file)

    this.createdBlobUrls.push(url)
    this.setSource(url)

    // The decision to play is now handled by VideoPlayer based on autoPlay config
    return url
  }

  /**
   * Load video from URL
   */
  async loadVideoFromUrl(url: string, thumb?: string): Promise<void>
  {
    this.setPoster(thumb)
    this.setSource(url)
  }

  public setPoster(thumb?: string): void {
    this.video.poster = ''

    if (!thumb) return

    const img = new Image()

    img.crossOrigin = 'anonymous'
    img.onerror = () => {
      console.warn(`Could not load poster image: ${thumb}`)
    }
    img.onload = () => {
      this.video.poster = thumb
    }

    img.src = thumb
  }

  /**
   * Open file dialog and load selected video file
   */
  async loadVideoFile(): Promise<void> {
    try {
      const file = await Filesystem.open('video/*') as File

      if (file) {
        const url = await this.setVideoSource(file)

        if (this.eventHandlers.onFileLoaded) {
          this.eventHandlers.onFileLoaded(file, url)
        }
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

    // Releasing all created blob URLs upon destruction
    this.createdBlobUrls.forEach(url => Filesystem.revokeObjectURL(url))
    this.createdBlobUrls = []
  }
}
