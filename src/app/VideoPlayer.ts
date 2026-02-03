import { EventEmitter } from '@/core/events/EventEmitter'
import { VideoController } from '@/modules/video/VideoController'
import { VolumeController } from '@/modules/controls/VolumeController'
import { PlaybackController } from '@/modules/controls/PlaybackController'
import { FullscreenController } from '@/modules/controls/FullscreenController'
import { TimelineController } from '@/modules/controls/TimelineController'
import { PlayerTemplate } from '@/modules/ui/templates/player-template'
import { Helpers } from '@/core/utils/helpers'

import {
  ControlsVisibility,
  VideoPlayerConfig,
  PlayerEventMap,
  TimeUpdateEvent,
  VolumeChangeEvent,
  LoopMode
} from '@/core/types'

/**
 * Main Video Player class - orchestrates all components
 */
export class VideoPlayer
{
  private config: VideoPlayerConfig
  private container: HTMLElement
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

  // State
  private sources: string[] = []
  private currentSourceIndex: number = 0
  private interfaceTimeout!: ReturnType<typeof setTimeout>

  private sourcePrevButton!: HTMLElement
  private sourceNextButton!: HTMLElement

  private currentMuted: boolean = false
  private currentVolume: number = 1.0

  private loopMode: LoopMode = 'none'

  public logging: boolean = false

  constructor(config: VideoPlayerConfig)
  {
    this.config = config
    this.container = config.container
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
    try {
      // Render player HTML with original classes
      this.renderPlayerTemplate()

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
    } catch (error) {
      console.error('Failed to initialize video player:', error)
      throw error
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
      showPlayPause: '.j-toggle-video',
      showSkipButtons: '.j-skip-backward, .j-skip-forward',
      showVolume: '.j-toggle-volume',
      showTimeDisplay: '.j-duration',
      showSpeed: '.j-speed',
      showPip: '.j-pic-in-pic',
      showFullscreen: '.j-fullscreen',
      showLoop: '.j-toggle-loop',
      showTimeline: '.j-line'
    }).forEach(([key, selector]) => {
      const elements = this.container.querySelectorAll<HTMLElement>(selector)
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
      if (this.logging) {
        console.log('No initial sources provided')
      }
      return
    }

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
    const controlElements = ['.player__panel', '.player__main-icon']

    controlElements.forEach(selector => {
      const elements = this.container.querySelectorAll<HTMLElement>(selector)
      elements.forEach(element => {
        element.style.display = 'none'
      })
    })

    // Also hide cursor for video element
    const videoElement = this.container.querySelector<HTMLElement>('.player__video')
    if (videoElement) {
      videoElement.style.cursor = 'none'
    }
  }

  /**
   * Show all control elements
   */
  private showAllControls(): void
  {
    const controlElements = ['.player__panel', '.player__main-icon']

    controlElements.forEach(selector => {
      const elements = this.container.querySelectorAll<HTMLElement>(selector)
      elements.forEach(element => {
        element.style.display = ''
      })
    })

    // Restore cursor for video element
    const videoElement = this.container.querySelector<HTMLElement>('.player__video')
    if (videoElement) {
      videoElement.style.cursor = ''
    }

    // Apply individual settings
    this.applyIndividualControlsVisibility()
  }

  /**
   * Render player HTML structure with original classes
   */
  private renderPlayerTemplate(): void
  {
    this.container.innerHTML = PlayerTemplate.generate()
    this.playerElement = this.container.querySelector('.player') as HTMLElement

    if (!this.playerElement) {
      throw new Error('Player element not found after rendering template')
    }
  }

  /**
   * Initialize all controllers with correct element selectors
   */
  private initializeControllers(): void
  {
    const videoElement = this.container.querySelector<HTMLVideoElement>('.player__video')
    if (!videoElement) {
      throw new Error('Video element not found')
    }

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
        onError: (error) => this.handleError(error)
      },
      this.logging,
      this.config.loop ?? false
    )

    // Initialize Source Navigation Buttons
    this.sourcePrevButton = this.container.querySelector('.j-source-prev') as HTMLElement
    this.sourceNextButton = this.container.querySelector('.j-source-next') as HTMLElement

    if (this.sourcePrevButton && this.sourceNextButton) {
      this.updateSourceNavigationVisibility()
    }

    // Initialize Volume Controller - pass the button element directly
    const volumeButton = this.container.querySelector<HTMLElement>('.j-toggle-volume')
    if (!volumeButton) {
      throw new Error('Volume button not found')
    }

    this.volumeController = new VolumeController(
      volumeButton,
      {
        onVolumeChange: (volume) => this.videoController.setVolume(volume),
        onMuteToggle: () => this.videoController.toggleMute()
      }
    )

    // Initialize Playback Controller
    const speedContainer = this.container.querySelector<HTMLElement>('.player__panel-playback-content')
    if (!speedContainer) {
      throw new Error('Speed container not found')
    }

    this.playbackController = new PlaybackController(
      speedContainer,
      (speed) => this.videoController.setPlaybackRate(speed)
    )

    // Initialize Timeline Controller
    const timelineContainer = this.container.querySelector<HTMLElement>('.j-line')
    if (!timelineContainer) {
      throw new Error('Timeline container not found')
    }

    this.timelineController = new TimelineController(
      timelineContainer,
      (time) => {
        // Time is already in seconds, set directly
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
    const pipButton = this.container.querySelector<HTMLButtonElement>('.j-pic-in-pic')

    // Disable PiP button initially
    if (pipButton) {
      pipButton.disabled = true;
      pipButton.style.opacity = '0.5';
      pipButton.style.cursor = 'not-allowed';
      pipButton.title = `PiP not available: ${pipSupport.reason}`

      // and enable when video is loaded if supported
      if (pipSupport.supported) {
        this.on('loadedmetadata', () => {
          pipButton.disabled = false
          pipButton.style.opacity = '1'
          pipButton.style.cursor = 'pointer'
        })
      }
    }
  }

  /**
   * Enhanced PiP support detection
   */
  private checkPictureInPictureSupport(): { supported: boolean; reason?: string }
  {
    if (!('pictureInPictureEnabled' in document)) {
      return { supported: false, reason: 'API not available' }
    }

    if (!document.pictureInPictureEnabled) {
      return { supported: false, reason: 'PiP disabled by browser or policy' }
    }

    const video = this.container.querySelector('.player__video') as HTMLVideoElement
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
    const openFileButton = this.container.querySelector<HTMLElement>('.j-open-file')
    if (openFileButton) {
      openFileButton.addEventListener('click', () => this.loadVideoFile())
    }

    // Play/Pause button
    const playButton = this.container.querySelector<HTMLElement>('.j-toggle-video')
    if (playButton) {
      playButton.addEventListener('click', () => this.videoController!.togglePlay())
    }

    // Skip buttons
    const skipBackward = this.container.querySelector<HTMLElement>('.j-skip-backward')
    const skipForward = this.container.querySelector<HTMLElement>('.j-skip-forward')
    if (skipBackward) {
      skipBackward.addEventListener('click', () => this.videoController.skip(-5))
    }
    if (skipForward) {
      skipForward.addEventListener('click', () => this.videoController.skip(5))
    }

    // Loop button
    const loopButton = this.container.querySelector<HTMLElement>('.j-toggle-loop')
    if (loopButton) {
      loopButton.addEventListener('click', () => this.toggleLoop())
    }

    // Video click to play/pause and open file dialog if no source
    const videoElement = this.container.querySelector<HTMLElement>('.player__video')
    if (videoElement) {
      videoElement.addEventListener('click', () => this.videoController.togglePlay())
      videoElement.addEventListener('dblclick', () => this.toggleFullscreen())
    }

    // Fullscreen button
    const fullscreenButton = this.container.querySelector<HTMLElement>('.j-fullscreen')
    if (fullscreenButton) {
      fullscreenButton.addEventListener('click', () => this.toggleFullscreen())
    }

    // Picture in Picture button
    const pipButton = this.container.querySelector<HTMLElement>('.j-pic-in-pic')
    if (pipButton) {
      // Checking PiP support in the browser
      if (this.isPictureInPictureSupported()) {
        pipButton.addEventListener('click', () => this.togglePictureInPicture())
      } else {
        pipButton.style.display = 'none'
      }
    }

    // Source Navigation buttons
    this.sourcePrevButton
      ?.addEventListener('click', (e) => {
        e.stopPropagation()

        this.sourcePrevButton.classList.add('player__source-nav--clicked')
        setTimeout(() => {
          this.sourcePrevButton.classList.remove('player__source-nav--clicked')
        }, 400)

        this.previousSource().catch(console.error)
      })

    this.sourceNextButton
      ?.addEventListener('click', (e) => {
        e.stopPropagation()

        this.sourceNextButton.classList.add('player__source-nav--clicked')
        setTimeout(() => {
          this.sourceNextButton.classList.remove('player__source-nav--clicked')
        }, 400)

        this.nextSource().catch(console.error)
      })

    // Speed options - close when clicking outside
    document.addEventListener('click', (e) => {
      const speedButton = this.container.querySelector('.j-speed')
      const speedOptions = this.container.querySelector('.j-speed-options')
      const target = e.target as HTMLElement

      if (speedButton && speedOptions && !speedButton.contains(target) && !speedOptions.contains(target)) {
        speedOptions.classList.remove('show')
      }
    })

    // Handle speed option clicks
    const speedOptions = this.container.querySelectorAll<HTMLElement>('.j-speed-options li')
    speedOptions.forEach(option => {
      option.addEventListener('click', () => {
        const speed = parseFloat(option.getAttribute('data-speed') || '1')
        this.videoController!.setPlaybackRate(speed)

        // Update active state
        speedOptions.forEach(opt => opt.classList.remove('active'))
        option.classList.add('active')

        // Close dropdown
        const optionsContainer = this.container.querySelector('.j-speed-options')
        if (optionsContainer) {
          optionsContainer.classList.remove('show')
        }
      })
    })
  }

  /**
   * Bind keyboard event listeners
   */
  private bindKeyboardEvents(): void
  {
    document.addEventListener('keydown', (event) => {
      // Only handle if player is visible
      if (!this.isPlayerActive()) return

      switch (event.code) {
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
    const video = this.container.querySelector<HTMLElement>('.player__video')

    // Listening to PiP status change events
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
      if (hasMultipleSources) {
        this.sourcePrevButton.classList.remove('player__source-nav--hidden')
      } else {
        this.sourcePrevButton.classList.add('player__source-nav--hidden')
      }
    }

    if (this.sourceNextButton) {
      if (hasMultipleSources) {
        this.sourceNextButton.classList.remove('player__source-nav--hidden')
      } else {
        this.sourceNextButton.classList.add('player__source-nav--hidden')
      }
    }
  }

  private handleTimeUpdate(currentTime: number, duration: number): void
  {
    // Update timeline progress
    this.timelineController.updateProgress(currentTime, duration)

    // Update time display
    const timeDisplay = this.container.querySelector<HTMLElement>('.j-duration')
    if (timeDisplay) {
      timeDisplay.textContent = `${Helpers.formatTime(currentTime)} / ${Helpers.formatTime(duration)}`
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

    const eventData: VolumeChangeEvent = { volume, muted }
    this.events.emit('volumechange', eventData)
  }

  private handlePlay(): void
  {
    // Update play button icon
    const playIcon = this.container.querySelector<HTMLElement>('.j-toggle-video .fas')
    if (playIcon) {
      playIcon.className = 'fas fa-pause'
    }

    // Show pause icon, hide play icon
    const pauseIcon = this.container.querySelector<HTMLElement>('.j-pause')
    const playBigIcon = this.container.querySelector<HTMLElement>('.j-play')
    if (pauseIcon && playBigIcon) {
      pauseIcon.style.display = 'block'
      playBigIcon.style.display = 'none'
    }

    this.events.emit('play', undefined)
  }

  private handlePause(): void
  {
    // Update play button icon
    const playIcon = this.container.querySelector<HTMLElement>('.j-toggle-video .fas')
    if (playIcon) {
      playIcon.className = 'fas fa-play'
    }

    // Show play icon, hide pause icon
    const pauseIcon = this.container.querySelector<HTMLElement>('.j-pause')
    const playBigIcon = this.container.querySelector<HTMLElement>('.j-play')
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
    // Update timeline with correct duration
    const duration = this.videoController.getDuration()
    this.timelineController.setDuration(duration)

    // Enable PiP button
    const pipButton = this.container.querySelector<HTMLButtonElement>('.j-pic-in-pic')
    if (pipButton) {
      pipButton.disabled = false
      pipButton.style.opacity = '1'
      pipButton.style.cursor = 'pointer'
    }

    this.events.emit('loadedmetadata', undefined)
  }

  private handleError(error: Error): void
  {
    if (this.logging) {
      console.error('Video error:', error)
    }

    this.events.emit('error', error)
  }

  private handleFullscreenChange(isFullscreen: boolean): void
  {
    // Update fullscreen button icon
    const fullscreenIcon = this.container.querySelector<HTMLElement>('.j-fullscreen .fas')
    if (fullscreenIcon) {
      fullscreenIcon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand'
    }

    // Toggle fullscreen class
    this.playerElement.classList.toggle('player--fullscreen', isFullscreen)

    // Adjust source navigation position in fullscreen
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
    const loopButton = this.container.querySelector<HTMLElement>('.j-toggle-loop')
    const loopIcon = loopButton?.querySelector<SVGElement>('.loop-icon')

    if (!loopButton || !loopIcon) return

    // Removing all mode classes
    loopIcon.classList.remove('loop-icon--none', 'loop-icon--one', 'loop-icon--all')

    // Adding the current mode class
    loopIcon.classList.add(`loop-icon--${this.loopMode}`)

    // Update the title (hint)
    switch (this.loopMode) {
      case 'none':
        loopButton.title = 'Enable loop'
        break
      case 'one':
        loopButton.title = 'Loop current video'
        break
      case 'all':
        loopButton.title = 'Loop playlist'
        break
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

  // ------------------------------------------------------------------------

  /**
   * Set video sources array
   */
  setSources(sources: string[]): void
  {
    this.sources = [...sources]
    this.currentSourceIndex = 0
    this.updateSourceNavigationVisibility()
  }

  /**
   * Add source to the sources array
   */
  addSource(source: string): void
  {
    this.sources.push(source)
    this.updateSourceNavigationVisibility()
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

  // ------------------------------------------------------------------------

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
   * Replaces current sources with the selected file
   */
  async loadVideoFile(): Promise<void>
  {
    try {
      await this.videoController.loadVideoFile()
      // After uploading the file, we update the sources
      const currentSrc = this.videoController.getCurrentSource()
      if (currentSrc) {
        this.setSources([currentSrc])
      }
    } catch (error) {
      console.error('Error loading video file:', error)
      throw error
    }
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

    // Add URL to the sources if it is not there
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
    return 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled !== undefined
  }

  /**
   * Toggle picture in picture
   */
  async togglePictureInPicture(): Promise<void>
  {
    const video = this.container.querySelector<HTMLVideoElement>('.player__video')

    // Check that the video has a source and that the metadata is loaded
    if (!video?.src || video.readyState < HTMLMediaElement.HAVE_METADATA) {
      console.warn('Video not loaded. Cannot activate Picture-in-Picture.')
      return
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        // Special treatment for Firefox
        if (navigator.userAgent.toLowerCase().includes('firefox')) {
          await this.enterPictureInPictureFirefox(video)
        } else {
          // The standard approach for other browsers
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
    // Firefox requires that the video is playable and has an audio track
    // User gestures may also be required

    // Trying to play a video that is paused
    if (video.paused) {
      try {
        await video.play()
      } catch (playError) {
        console.warn('Cannot play video for PiP in Firefox:', playError)
      }
    }

    // Direct call to requestPictureInPicture
    try {
      await video.requestPictureInPicture()
    } catch (pipError) {
      console.error('Firefox PiP failed:', pipError)
      // Fallback: trying an alternative method
      await this.fallbackPictureInPicture(video)
    }
  }

  /**
   * Fallback method for PiP when standard approach fails
   */
  private async fallbackPictureInPicture(video: HTMLVideoElement): Promise<void>
  {
    // Create a click on the video element itself
    // This can bypass Firefox's limitations
    video.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
    )

    // A short delay before trying again
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

    // Clear auto-hide timeout
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

    // Update volume controller icon
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
    return this.playerElement.contains(document.activeElement) ||
      this.videoController.getIsPlaying() ||
      document.fullscreenElement === this.playerElement
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
}
