import { ControlsVisibility, LoopMode, PlayerEventMap, TimeUpdateEvent, VideoPlayerConfig } from '@/core/types'

import { EventEmitter } from '@/core/events/EventEmitter'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import { PlaybackController } from '@/modules/controls/PlaybackController'
import { TimelineController } from '@/modules/controls/TimelineController'
import { VideoController } from '@/modules/video/VideoController'
import { VolumeController } from '@/modules/controls/VolumeController'
import { Helpers } from '@/core/utils/helpers'
import { getMetadata } from '@/core/metadata'

import {
  FullscreenButtonComponent,
  LoopButtonComponent,
  PipButtonComponent,
  PlaylistButtonComponent,
  PlaylistPanelComponent,
  PlayPauseButtonComponent,
  SkipButtonComponent,
  SpeedOptionsComponent,
  TimeDisplayComponent,
  TimelineComponent,
  VolumeControlComponent,
  whenDefined
} from '@/modules/ui/web-components'

/**
 * Main Video Player class - orchestrates all components
 */
export class VideoPlayer
{
  private readonly container: HTMLElement
  private readonly root: Document | ShadowRoot

  private config: VideoPlayerConfig
  private playerElement!: HTMLElement
  private events: EventEmitter<PlayerEventMap>
  private controlsVisibility: Required<ControlsVisibility>
  private isShowControls: boolean

  // Core Components
  private videoController!: VideoController
  private volumeController!: VolumeController
  private playbackController!: PlaybackController
  private fullscreenController!: FullscreenController
  private timelineController!: TimelineController

  // UI Components
  private playPauseButton!: PlayPauseButtonComponent
  private loopButton!: LoopButtonComponent
  private fullscreenButton!: FullscreenButtonComponent
  private pipButton!: PipButtonComponent
  private timeDisplay!: TimeDisplayComponent
  private playlistButton!: PlaylistButtonComponent
  private playlistPanel!: PlaylistPanelComponent

  // State
  private sources: string[] = []
  private sourceTitleMap: Map<string, string> = new Map()
  private currentSourceIndex: number = 0
  private interfaceTimeout!: ReturnType<typeof setTimeout>

  private sourcePrevButton!: HTMLElement
  private sourceNextButton!: HTMLElement

  private currentMuted: boolean = false
  private currentVolume: number = 1.0

  private loopMode: LoopMode = 'none'

  public logging: boolean = false

  constructor(config: VideoPlayerConfig, root: Document | ShadowRoot = document)
  {
    this.config = config
    this.container = config.container
    this.root = root
    this.isShowControls = config.showControls ?? true
    this.logging = Boolean(config.logging)
    this.events = new EventEmitter()
    this.controlsVisibility = {
      showOpenFile: true,
      showPlayPause: true,
      showSkipButtons: true,
      showVolume: true,
      showTimeDisplay: true,
      showSpeed: true,
      showPip: true,
      showFullscreen: true,
      showLoop: true,
      showTimeline: true
    }

    this.sources = config.initialSources || []
    this.loopMode = config.loopMode || (config.loop ? 'one' : 'none')
    this.currentVolume = config.initialVolume ?? 1.0
    this.currentMuted = config.muted ?? false

    this.initializeControlsVisibility()
    this.initializePlayer().catch(console.error)
  }

  private initializeControlsVisibility(): void
  {
    // Combine user settings with default settings
    this.controlsVisibility = {
      ...this.controlsVisibility,
      ...this.config.controlsVisibility
    }
  }

  /**
   * Initialize the video player
   */
  private async initializePlayer(): Promise<void>
  {
    // Wait for the components to be ready
    await whenDefined()

    this.playerElement = this.root.querySelector('.player') as HTMLElement
    if (!this.playerElement) {
      throw new Error('Player element not found after rendering template')
    }

    // Applying dimensions to the container
    this.applyContainerSizes()

    // Initialize controllers
    this.initializeControllers()
    this.initializeEventListeners()

    // Apply Visibility settings
    this.applyIndividualControlsVisibility()

    // Bind event listeners
    this.bindEventListeners()
    this.bindKeyboardEvents()

    // Set initial state of the looping icon
    this.updateLoopButton()

    // Load initial sources if provided
    if (this.sources.length > 0) {
      await this.loadInitialSources()
      this.handleInterfaceHide()
    }

    // Initialize auto-hide only if controls are visible
    if (this.isShowControls) {
      this.initInterfaceAutoHide()
    }
  }

  /**
   * Apply container sizes from config
   */
  private applyContainerSizes(): void
  {
    // Applying maximum width
    if (this.config.maxWidth) {
      if (typeof this.config.maxWidth === 'number') {
        this.container.style.maxWidth = `${this.config.maxWidth}px`
      } else {
        this.container.style.maxWidth = this.config.maxWidth
      }
    }

    // Applying width
    if (this.config.width) {
      if (typeof this.config.width === 'number') {
        this.container.style.width = `${this.config.width}px`
      } else {
        this.container.style.width = this.config.width
      }
    }

    // Applying height
    if (this.config.height) {
      if (typeof this.config.height === 'number') {
        this.container.style.height = `${this.config.height}px`
      } else {
        this.container.style.height = this.config.height
      }
    }

    // Applying aspect ratio
    if (this.config.aspectRatio && !this.config.height) {
      this.applyAspectRatio(this.config.aspectRatio)
    }

    // If nothing is specified, use the default styles
    if (
      !this.config.aspectRatio &&
      !this.config.maxWidth &&
      !this.config.width &&
      !this.config.height
    ) {
      this.container.style.maxWidth = '1200px'
      this.container.style.width = '100%'
      this.applyAspectRatio('16:9')
    }
  }

  /**
   * Apply aspect ratio to container
   */
  private applyAspectRatio(ratio: string): void
  {
    const [width, height] = ratio.split(':').map(Number)

    if (width && height) {
      this.container.style.aspectRatio = `${width} / ${height}`

      // Fallback for older browsers
      if (!CSS.supports('aspect-ratio', '1 / 1')) {
        this.container.style.height = '0'
        this.container.style.paddingBottom = `${(height / width) * 100}%`
        this.container.style.position = 'relative'

        if (this.playerElement) {
          this.playerElement.style.position = 'absolute'
          this.playerElement.style.top = '0'
          this.playerElement.style.left = '0'
          this.playerElement.style.width = '100%'
          this.playerElement.style.height = '100%'
        }
      }
    }
  }

  private applyIndividualControlsVisibility(): void
  {
    if (!this.showControls) return

    Object.entries({
      showOpenFile: '.j-open-file',
      showPlayPause: 'play-pause-button',
      showSkipButtons: 'skip-button',
      showVolume: 'volume-control',
      showTimeDisplay: 'time-display',
      showSpeed: 'speed-options',
      showPip: 'pip-button',
      showFullscreen: 'fullscreen-button',
      showLoop: 'loop-button',
      showTimeline: 'timeline-control'
    }).forEach(([key, selector]) => {
      const elements = this.root.querySelectorAll<HTMLElement>(selector)
      const isVisible = this.controlsVisibility[key as keyof ControlsVisibility]

      elements.forEach(element => {
        element.style.display = isVisible ? '' : 'none'
      })
    })
  }

  /**
   * Load initial video sources from array
   */
  private async loadInitialSources(): Promise<void>
  {
    if (this.sources.length === 0) {
      if (this.logging) console.log('No initial sources provided')
      return
    }

    for (const source of this.sources) {
      if (!this.sourceTitleMap.has(source)) {
        const fileName = source.split('/').pop()?.split('?')[0] || 'Unknown Video'
        this.sourceTitleMap.set(source, fileName)
      }
    }
    this.updatePlaylist()

    try {
      if (this.logging) {
        console.log('Loading initial video sources:', this.sources)
      }

      // Set muted to bypass auto-play restrictions
      this.videoController.setMuted(true)

      // Loading the first source from the array
      await this.loadSourceByIndex(0)

      if (this.logging) {
        console.log('Initial video source loaded successfully')
      }
    } catch (error) {
      if (this.logging) {
        console.error('Failed to load initial video source:', error)
      }

      // Try the following source if there is an error
      if (this.sources.length > 1) {
        await this.tryNextSource()
      } else {
        // Emit error event but don't break initialization
        this.events.emit('error', error as Error)
      }
    }
  }

  /**
   * Try to load next source when current fails
   */
  public async tryNextSource(): Promise<void>
  {
    const nextIndex = (this.currentSourceIndex + 1) % this.sources.length

    if (nextIndex === 0) {
      // If all sources are exhausted, throw an error
      this.events.emit('error', new Error('All video sources failed to load'))
      return
    }

    try {
      await this.loadSourceByIndex(nextIndex)
    } catch (error) {
      // Recursively try the next source
      await this.tryNextSource()
    }
  }

  /**
   * Load specific source by index
   */
  public async loadSourceByIndex(index: number): Promise<void>
  {
    if (index < 0 || index >= this.sources.length) {
      throw new Error(`Invalid source index: ${index}`)
    }

    const url = this.sources[index]
    this.currentSourceIndex = index

    if (this.logging) {
      console.log(`Loading video source ${index + 1}/${this.sources.length}:`, url)
    }

    // Adding animation to the buttons
    this.highlightSourceNavigation()

    const savedVolume = this.currentVolume
    const savedMuted = this.currentMuted

    await this.videoController.loadVideoFromUrl(url, true)

    this.videoController.setVolume(savedVolume)
    this.videoController.setMuted(savedMuted)

    // Emit source changed event
    this.events.emit('sourcechanged', index)
  }

  private highlightSourceNavigation(): void
  {
    if (this.sourcePrevButton && this.sourceNextButton) {
      this.sourcePrevButton.classList.add('player__source-nav--pulse')
      this.sourceNextButton.classList.add('player__source-nav--pulse')

      setTimeout(() => {
        this.sourcePrevButton.classList.remove('player__source-nav--pulse')
        this.sourceNextButton.classList.remove('player__source-nav--pulse')
      }, 2000)
    }
  }

  /**
   * Hide all control elements
   */
  private hideAllControls(): void
  {
    const controlElements = ['.player__panel', '.player__top-panel', '.player__main-icon']

    controlElements.forEach(selector => {
      this.root.querySelectorAll<HTMLElement>(selector)
        .forEach(element => {
          element.style.display = 'none'
        })
    })

    // Also hide cursor for video element
    const videoElement = this.root.querySelector<HTMLElement>('.player__video')
    if (videoElement) {
      videoElement.style.cursor = 'none'
    }
  }

  /**
   * Show all control elements
   */
  private showAllControls(): void
  {
    const controlElements = ['.player__panel', '.player__top-panel', '.player__main-icon']

    controlElements.forEach(selector => {
      this.root.querySelectorAll<HTMLElement>(selector)
        .forEach(element => {
          element.style.display = ''
        })
    })

    // Restore cursor for video element
    const videoElement = this.root.querySelector<HTMLElement>('.player__video')
    if (videoElement) {
      videoElement.style.cursor = ''
    }

    // Apply individual settings
    this.applyIndividualControlsVisibility()
  }

  /**
   * Initialize all controllers with correct element selectors
   */
  private initializeControllers(): void
  {
    const videoElement = this.root.querySelector<HTMLVideoElement>('.player__video')
    if (!videoElement) throw new Error('Video element not found')

    // Store component instances
    this.playPauseButton = this.root.querySelector('play-pause-button')!
    this.loopButton = this.root.querySelector('loop-button')!
    this.fullscreenButton = this.root.querySelector('fullscreen-button')!
    this.pipButton = this.root.querySelector('pip-button')!
    this.timeDisplay = this.root.querySelector('time-display')!
    this.playlistButton = this.root.querySelector('playlist-button')!
    this.playlistPanel = this.root.querySelector('playlist-panel')!

    const volumeControl = this.root.querySelector<VolumeControlComponent>('volume-control')!
    const speedOptions = this.root.querySelector<SpeedOptionsComponent>('speed-options')!
    const timelineControl = this.root.querySelector<TimelineComponent>('timeline-control')!

    // Initialize Video Controller
    this.videoController = new VideoController(
      videoElement,
      {
        onTimeUpdate: (currentTime, duration) => this.handleTimeUpdate(currentTime, duration),
        onVolumeChange: (volume, muted) => this.handleVolumeChange(volume, muted),
        onPlay: () => this.handlePlay(),
        onPause: () => this.handlePause(),
        onEnded: () => this.handleEnded(),
        onLoadedMetadata: () => this.handleLoadedMetadata(),
        onError: (error) => this.handleError(error),
        onFileLoaded: this.handleFileLoaded,
      },
      this.logging,
      this.config.loop ?? false
    )

    // Initialize Source Navigation Buttons
    this.sourcePrevButton = this.root.querySelector('.j-source-prev') as HTMLElement
    this.sourceNextButton = this.root.querySelector('.j-source-next') as HTMLElement

    if (this.sourcePrevButton && this.sourceNextButton) {
      this.updateSourceNavigationVisibility()
    }

    // Initialize Volume Controller
    this.volumeController = new VolumeController(
      volumeControl,
      {
        onVolumeChange: (volume) => this.videoController.setVolume(volume),
        onMuteToggle: () => this.videoController.toggleMute()
      }
    )

    // Initialize Playback Controller
    this.playbackController = new PlaybackController(
      speedOptions,
      (speed) => this.videoController.setPlaybackRate(speed)
    )

    // Initialize Timeline Controller
    this.timelineController = new TimelineController(
      timelineControl,
      (time) => {
        this.videoController.setCurrentTime(time)
      }
    )

    // Initialize Fullscreen Controller
    this.fullscreenController = new FullscreenController(
      this.playerElement,
      (isFullscreen) => this.handleFullscreenChange(isFullscreen)
    )

    // Set initial volume
    if (this.config.initialVolume !== undefined) {
      this.videoController.setVolume(this.config.initialVolume)
    }

    this.updateLoopButton()

    // Disable PiP button if not supported
    const pipSupport = this.checkPictureInPictureSupport()
    if (this.pipButton) {
      this.pipButton.disabled = !pipSupport.supported

      if (pipSupport.supported) {
        this.on('loadedmetadata', () => {
          if (this.pipButton) this.pipButton.disabled = false
        })
      }
    }

    this.updatePlaylist()
  }

  /**
   * Enhanced PiP support detection
   */
  private checkPictureInPictureSupport(): { supported: boolean; reason?: string }
  {
    if (!('pictureInPictureEnabled' in this.root)) {
      return { supported: false, reason: 'API not available' }
    }

    if (!(this.root as Document).pictureInPictureEnabled) {
      return { supported: false, reason: 'PiP disabled by browser or policy' }
    }

    const video = this.root.querySelector('.player__video') as HTMLVideoElement
    if (video && video.disablePictureInPicture) {
      return { supported: false, reason: 'Video element has PiP disabled' }
    }

    return { supported: true }
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    // Open File button
    const openFileButton = this.root.querySelector<HTMLElement>('.j-open-file')
    if (openFileButton) {
      openFileButton.addEventListener('click', () => this.loadVideoFile())
    }

    // Play/Pause button
    if (this.playPauseButton) {
      this.playPauseButton.addEventListener('click', () => this.videoController!.togglePlay())
    }

    // Skip buttons
    this.root.querySelectorAll<SkipButtonComponent>('skip-button').forEach(button => {
      button.addEventListener('click', () => {
        const direction = button.getAttribute('direction') === 'forward' ? 5 : -5
        this.videoController.skip(direction)
      })
    })

    // Loop button
    if (this.loopButton) {
      this.loopButton.addEventListener('click', () => this.toggleLoop())
    }

    // Video click to play/pause and open file dialog if no source
    const videoElement = this.root.querySelector<HTMLElement>('.player__video')
    if (videoElement) {
      videoElement.addEventListener('click', () => this.videoController.togglePlay())
      videoElement.addEventListener('dblclick', () => this.toggleFullscreen())
    }

    // Fullscreen button
    if (this.fullscreenButton) {
      this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen())
    }

    // Picture in Picture button
    if (this.pipButton) {
      if (this.isPictureInPictureSupported()) {
        this.pipButton.addEventListener('click', () => this.togglePictureInPicture())
      } else {
        this.pipButton.style.display = 'none'
      }
    }

    // Playlist button
    if (this.playlistButton) {
      this.playlistButton.addEventListener('click', () => this.togglePlaylist())
    }

    // Playlist panel
    if (this.playlistPanel) {
      this.playlistPanel.addEventListener('itemclick', async (e: any) => {
        await this.switchToSource(e.detail.index)
      })

      this.playlistPanel.addEventListener('close', () => this.togglePlaylist())
    }

    // Source Navigation buttons
    this.sourcePrevButton
      ?.addEventListener('click', (e) => {
        e.stopPropagation()
        this.previousSource().catch(console.error)
      })

    this.sourceNextButton
      ?.addEventListener('click', (e) => {
        e.stopPropagation()
        this.nextSource().catch(console.error)
      })

    // Update playlist on source change
    this.on('sourcechanged', () => this.updatePlaylist())
  }

  /**
   * Bind keyboard event listeners
   */
  private bindKeyboardEvents(): void
  {
    this.root.addEventListener('keydown', (event) => {
      if (!this.isPlayerActive()) return

      switch ((event as KeyboardEvent).code) {
        case 'Space':
          event.preventDefault()
          this.videoController!.togglePlay().catch(console.error)
          break
        case 'ArrowRight':
          event.preventDefault()
          this.videoController!.skip(5)
          break
        case 'ArrowLeft':
          event.preventDefault()
          this.videoController!.skip(-5)
          break
        case 'ArrowUp':
          event.preventDefault()
          this.volumeController!.adjustVolume(0.1)
          break
        case 'ArrowDown':
          event.preventDefault()
          this.volumeController!.adjustVolume(-0.1)
          break
        case 'KeyF':
          event.preventDefault()
          this.toggleFullscreen().catch(console.error)
          break
        case 'KeyM':
          event.preventDefault()
          this.videoController!.toggleMute()
          break
      }
    })
  }

  private initializeEventListeners(): void
  {
    const video = this.root.querySelector<HTMLElement>('.player__video')

    video?.addEventListener('enterpictureinpicture', this.handleEnterPiP.bind(this))
    video?.addEventListener('leavepictureinpicture', this.handleLeavePiP.bind(this))
  }

  private handleEnterPiP(): void
  {
    this.playerElement.classList.add('player--pip-active')
  }

  private handleLeavePiP(): void
  {
    this.playerElement.classList.remove('player--pip-active')
  }

  private handleInterfaceHide()
  {
    this.interfaceTimeout = setTimeout(() => {
      if (this.videoController.getIsPlaying()) {
        this.hideInterface()
      }
    }, 2000)
  }

  /**
   * Initialize auto-hide interface
   */
  private initInterfaceAutoHide(): void
  {
    this.playerElement.addEventListener('mousemove', () => {
      this.showInterface()

      clearTimeout(this.interfaceTimeout)

      this.handleInterfaceHide()
    })
  }

  // Event Handlers

  private updateSourceNavigationVisibility(): void
  {
    const hasMultipleSources = this.sources.length > 1

    if (this.sourcePrevButton) {
      this.sourcePrevButton.style.display = hasMultipleSources ? '' : 'none'
    }

    if (this.sourceNextButton) {
      this.sourceNextButton.style.display = hasMultipleSources ? '' : 'none'
    }
  }

  private handleTimeUpdate(currentTime: number, duration: number): void
  {
    this.timelineController.updateProgress(currentTime, duration)
    if (this.timeDisplay) {
      this.timeDisplay.update(currentTime, duration)
    }

    const eventData: TimeUpdateEvent = {
      currentTime,
      duration,
      progress: duration > 0 ? currentTime / duration : 0,
      formattedCurrent: Helpers.formatTime(currentTime),
      formattedDuration: Helpers.formatTime(duration)
    }

    this.events.emit('timeupdate', eventData)
  }

  private handleVolumeChange(volume: number, muted: boolean): void
  {
    this.currentVolume = volume
    this.currentMuted = muted
    this.volumeController.setVolume(volume)
    this.volumeController.updateIcon(volume, muted)
    this.events.emit('volumechange', { volume, muted })
  }

  private handlePlay(): void
  {
    if (this.playPauseButton) {
      this.playPauseButton.setPaused(false)
    }

    const pauseIcon = this.root.querySelector<HTMLElement>('.j-pause')
    const playBigIcon = this.root.querySelector<HTMLElement>('.j-play')

    if (pauseIcon && playBigIcon) {
      pauseIcon.style.display = 'block'
      playBigIcon.style.display = 'none'
    }

    this.events.emit('play', undefined)
  }

  private handlePause(): void
  {
    if (this.playPauseButton) {
      this.playPauseButton.setPaused(true)
    }

    const pauseIcon = this.root.querySelector<HTMLElement>('.j-pause')
    const playBigIcon = this.root.querySelector<HTMLElement>('.j-play')

    if (pauseIcon && playBigIcon) {
      pauseIcon.style.display = 'none'
      playBigIcon.style.display = 'block'
    }

    this.events.emit('pause', undefined)
  }

  private handleEnded(): void
  {
    if (this.loopMode === 'all') {
      this.nextSource().catch(error => {
        console.error('Failed to play next source in loop all mode:', error)
      })
    } else if (this.loopMode === 'one') {
      // Video will restart itself due to loop=true
    } else {
      this.events.emit('ended', undefined)
    }
  }

  private handleLoadedMetadata(): void
  {
    const duration = this.videoController.getDuration()
    this.timelineController.setDuration(duration)

    if (this.pipButton) {
      this.pipButton.disabled = false
    }

    this.events.emit('loadedmetadata', undefined)
  }

  private handleError(error: Error): void
  {
    if (this.logging) console.error('Video error:', error)

    this.events.emit('error', error)
  }

  private handleFullscreenChange(isFullscreen: boolean): void
  {
    if (this.fullscreenButton) {
      this.fullscreenButton.setFullscreen(isFullscreen)
    }

    this.playerElement.classList.toggle('player--fullscreen', isFullscreen)

    this.adjustSourceNavigationPosition()

    this.events.emit('fullscreenchange', isFullscreen)
  }

  private adjustSourceNavigationPosition(): void
  {
    if (!this.playerElement) return

    const isFullscreen = this.playerElement.classList.contains('player--fullscreen')
    if (this.sourcePrevButton) {
      this.sourcePrevButton.style.left = isFullscreen ? '30px' : '20px'
    }

    if (this.sourceNextButton) {
      this.sourceNextButton.style.right = isFullscreen ? '30px' : '20px'
    }
  }

  /**
   * Apply current loop mode settings
   */
  private applyLoopMode(): void
  {
    if (!this.videoController) return

    switch (this.loopMode) {
      case 'none':
        this.videoController.setLoop(false)
        break
      case 'one':
        this.videoController.setLoop(true)
        break
      case 'all':
        this.videoController.setLoop(false)
        break
    }
  }

  /**
   * Update loop button appearance based on current mode
   */
  private updateLoopButton(): void
  {
    if (this.loopButton) {
      this.loopButton.setMode(this.loopMode)
    }
  }

  // Public API Methods

  /**
   * Show specific control button
   */
  showControl(control: keyof ControlsVisibility): void
  {
    this.controlsVisibility[control] = true
    this.applyIndividualControlsVisibility()
  }

  /**
   * Hide specific control button
   */
  hideControl(control: keyof ControlsVisibility): void
  {
    this.controlsVisibility[control] = false
    this.applyIndividualControlsVisibility()
  }

  /**
   * Toggle specific control button visibility
   */
  toggleControl(control: keyof ControlsVisibility): void
  {
    this.controlsVisibility[control] = !this.controlsVisibility[control]
    this.applyIndividualControlsVisibility()
  }

  /**
   * Get control visibility state
   */
  getControlVisibility(control: keyof ControlsVisibility): boolean
  {
    return this.controlsVisibility[control]
  }

  /**
   * Update multiple controls visibility at once
   */
  setControlsVisibility(visibility: Partial<ControlsVisibility>): void
  {
    this.controlsVisibility = { ...this.controlsVisibility, ...visibility }
    this.applyIndividualControlsVisibility()
  }

  /**
   * Set video sources array
   */
  setSources(sources: string[]): void
  {
    this.sources = [...sources]
    this.currentSourceIndex = 0
    this.updateSourceNavigationVisibility()
    this.updatePlaylist()
  }

  /**
   * Add source to the sources array
   */
  addSource(source: string, title?: string): void
  {
    if (!this.sources.includes(source)) {
        this.sources.push(source)
        this.sourceTitleMap.set(source, title || source.split('/').pop()?.split('?')[0] || 'Unknown Video')
        this.updateSourceNavigationVisibility()
        this.updatePlaylist()
    }
  }

  /**
   * Get all available sources
   */
  getSources(): string[]
  {
    return [...this.sources]
  }

  /**
   * Get current source URL
   */
  getCurrentSource(): string
  {
    return this.sources[this.currentSourceIndex] || ''
  }

  /**
   * Get current source index
   */
  getCurrentSourceIndex(): number
  {
    return this.currentSourceIndex
  }

  /**
   * Switch to next source in the array
   */
  async nextSource(): Promise<void>
  {
    if (this.sources.length <= 1) return
    const nextIndex = (this.currentSourceIndex + 1) % this.sources.length
    await this.loadSourceByIndex(nextIndex)
  }

  /**
   * Switch to previous source in the array
   */
  async previousSource(): Promise<void>
  {
    if (this.sources.length <= 1) return
    const prevIndex = (this.currentSourceIndex - 1 + this.sources.length) % this.sources.length
    await this.loadSourceByIndex(prevIndex)
  }

  /**
   * Switch to specific source by index
   */
  async switchToSource(index: number): Promise<void>
  {
    await this.loadSourceByIndex(index)
  }

  /**
   * Switch to specific source by URL
   */
  async switchToSourceByUrl(url: string): Promise<void>
  {
    const index = this.sources.indexOf(url)
    if (index === -1) {
      throw new Error('Source URL not found in sources array')
    }

    await this.loadSourceByIndex(index)
  }

  /**
   * Set string source (compatibility with old API)
   */
  setSource(src: string, muted: boolean = false): void
  {
    this.setSources([src])
    this.videoController.setSource(src)

    if (muted) {
      this.videoController.setMuted(true)
    }
  }

  /**
   * Load a video from file (opens system dialog)
   * Adds the selected file to the current sources.
   */
  async loadVideoFile(): Promise<void>
  {
    await this.videoController.loadVideoFile()
  }

  /**
   * Load a video from server URL with fetch
   * Adds the URL to sources array
   */
  async loadVideoFromUrl(url: string): Promise<void>
  {
    const savedVolume = this.currentVolume
    const savedMuted = this.currentMuted

    await this.videoController.loadVideoFromUrl(url, true)

    this.videoController.setVolume(savedVolume)
    this.videoController.setMuted(savedMuted)

    if (!this.sources.includes(url)) {
      this.addSource(url)
    }
  }

  /**
   * Play the video
   */
  async play(): Promise<void>
  {
    await this.videoController.play()
  }

  /**
   * Pause the video
   */
  pause(): void
  {
    this.videoController.pause()
  }

  /**
   * Toggle play/pause
   */
  async togglePlay(): Promise<void>
  {
    await this.videoController.togglePlay()
  }

  /**
   * Toggle fullscreen
   */
  async toggleFullscreen(): Promise<void>
  {
    await this.fullscreenController.toggle()
  }

  /**
   * Check if Picture-in-Picture is supported
   */
  private isPictureInPictureSupported(): boolean
  {
    return 'pictureInPictureEnabled' in this.root && (this.root as Document).pictureInPictureEnabled !== undefined
  }

  /**
   * Toggle picture in picture
   */
  async togglePictureInPicture(): Promise<void>
  {
    const video = this.root.querySelector<HTMLVideoElement>('.player__video')
    if (!video?.src || video.readyState < HTMLMediaElement.HAVE_METADATA) {
      console.warn('Video not loaded. Cannot activate Picture-in-Picture.')
      return
    }

    try {
      if ((this.root as Document).pictureInPictureElement) {
        await (this.root as Document).exitPictureInPicture()
      } else if ((this.root as Document).pictureInPictureEnabled) {
        if (navigator.userAgent.toLowerCase().includes('firefox')) {
          await this.enterPictureInPictureFirefox(video)
        } else {
          await video.requestPictureInPicture()
        }
      }
    } catch (error) {
      console.error('Picture in Picture error:', error)
    }
  }

  /**
   * Special method for Firefox PiP implementation
   */
  private async enterPictureInPictureFirefox(video: HTMLVideoElement): Promise<void>
  {
    if (video.paused) {
      try {
        await video.play()
      } catch (playError) {
        console.warn('Cannot play video for PiP in Firefox:', playError)
      }
    }

    try {
      await video.requestPictureInPicture()
    } catch (pipError) {
      console.error('Firefox PiP failed:', pipError)
      await this.fallbackPictureInPicture(video)
    }
  }

  /**
   * Fallback method for PiP when standard approach fails
   */
  private async fallbackPictureInPicture(video: HTMLVideoElement): Promise<void>
  {
    video.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
    )

    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      await video.requestPictureInPicture()
    } catch (error) {
      console.error('Fallback PiP also failed:', error)
      throw new Error('Picture-in-Picture is not available in this browser')
    }
  }

  /**
   * Show controls
   */
  showControls(): void
  {
    this.isShowControls = true
    this.showAllControls()
    this.applyIndividualControlsVisibility()
    this.initInterfaceAutoHide()
  }

  /**
   * Hide controls
   */
  hideControls(): void
  {
    this.isShowControls = false
    this.hideAllControls()
    if (this.interfaceTimeout) {
      clearTimeout(this.interfaceTimeout)
    }
  }

  /**
   * Toggle controls visibility
   */
  toggleControls(): void
  {
    this.isShowControls ? this.hideControls() : this.showControls()
  }

  /**
   * Check if controls are visible
   */
  getControlsVisible(): boolean
  {
    return this.isShowControls
  }

  /**
   * Set video volume (0-1)
   */
  setVolume(volume: number): void
  {
    this.videoController.setVolume(volume)
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void
  {
    this.videoController!.setMuted(muted)
    this.volumeController.updateIcon(this.videoController.getVolume(), muted)
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void
  {
    this.videoController.setPlaybackRate(rate)
  }

  /**
   * Get loop state (for backward compatibility)
   */
  getLoop(): boolean
  {
    return this.loopMode === 'one'
  }

  /**
   * Set loop state (for backward compatibility)
   */
  setLoop(loop: boolean): void
  {
    this.loopMode = loop ? 'one' : 'none'
    this.applyLoopMode()
    this.updateLoopButton()
    this.events.emit('loopmodechanged', this.loopMode)
  }

  /**
   * Toggle loop mode between: none -> one -> all -> none
   */
  toggleLoop(): void
  {
    const modes: LoopMode[] = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(this.loopMode)

    this.loopMode = modes[(currentIndex + 1) % modes.length]

    this.applyLoopMode()
    this.updateLoopButton()
    this.events.emit('loopmodechanged', this.loopMode)
  }

  /**
   * Get current loop mode
   */
  getLoopMode(): LoopMode
  {
    return this.loopMode
  }

  /**
   * Set specific loop mode
   */
  setLoopMode(mode: LoopMode): void
  {
    this.loopMode = mode
    this.applyLoopMode()
    this.updateLoopButton()
    this.events.emit('loopmodechanged', this.loopMode)
  }

  /**
   * Skip time in seconds
   */
  skip(seconds: number): void
  {
    this.videoController.skip(seconds)
  }

  /**
   * Seek to specific time
   */
  seekTo(time: number): void
  {
    this.videoController.setCurrentTime(time)
  }

  // Getters

  getCurrentTime(): number
  {
    return this.videoController.getCurrentTime()
  }

  getDuration(): number
  {
    return this.videoController.getDuration()
  }

  getVolume(): number
  {
    return this.videoController.getVolume()
  }

  getIsPlaying(): boolean
  {
    return this.videoController.getIsPlaying()
  }

  getIsMuted(): boolean
  {
    return this.videoController.getMuted()
  }

  getPlaybackRate(): number
  {
    return this.videoController.getPlaybackRate()
  }

  // Event System

  on<K extends keyof PlayerEventMap>(event: K, callback: (data: PlayerEventMap[K]) => void): void
  {
    this.events.on(event, callback)
  }

  off<K extends keyof PlayerEventMap>(event: K, callback: (data: PlayerEventMap[K]) => void): void
  {
    this.events.off(event, callback)
  }

  // Utility Methods

  private showInterface(): void
  {
    this.playerElement.classList.remove('player--hide-interface')
  }

  private hideInterface(): void
  {
    if (this.videoController.getIsPlaying()) {
      this.playerElement.classList.add('player--hide-interface')
    }
  }

  private isPlayerActive(): boolean
  {
    return this.playerElement.contains((this.root as Document).activeElement) ||
      this.videoController.getIsPlaying() ||
      (this.root as Document).fullscreenElement === this.playerElement
  }

  /**
   * Destroy the video player and clean up resources
   */
  destroy(): void
  {
    this.events.destroy()
    this.videoController.destroy()
    this.volumeController.destroy()
    this.playbackController.destroy()
    this.fullscreenController.destroy()
    this.timelineController.destroy()

    if (this.interfaceTimeout) {
      clearTimeout(this.interfaceTimeout)
    }
  }

  private updatePlaylist(): void {
    if (this.playlistPanel) {
      this.playlistPanel.sources = this.sources.map(source => this.sourceTitleMap.get(source) || 'Unknown Video')
      this.playlistPanel.activeIndex = this.currentSourceIndex
    }
  }

  private togglePlaylist(): void {
    if (this.playlistPanel) {
      this.playlistPanel.toggleAttribute('visible')
    }
  }

  private handleFileLoaded = async (file: File, url: string): Promise<void> => {
    try {
        const metadata = await getMetadata(file)
        const title = metadata.title || file.name
        this.sourceTitleMap.set(url, title)

        if (!this.sources.includes(url)) {
            this.addSource(url, title)
        } else {
            this.updatePlaylist()
        }

        const newIndex = this.sources.indexOf(url)
        if (this.currentSourceIndex !== newIndex) {
            this.currentSourceIndex = newIndex
            this.events.emit('sourcechanged', this.currentSourceIndex)
        }
    } catch (error) {
        console.error('Error processing loaded file:', error)
        // Fallback if metadata fails
        if (!this.sources.includes(url)) {
            this.addSource(url, file.name)
        }
    }
  }
}
