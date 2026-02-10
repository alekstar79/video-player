import type { ControlsVisibility, LoopMode, PlayerEventMap, TimeUpdateEvent, VideoPlayerConfig, VideoSource, ZIndexInterface } from '@/types'

import { EventEmitter } from '@/core/events/EventEmitter.ts'
import { FullscreenController } from '@/modules/controls/FullscreenController.ts'
import { PlaybackController } from '@/modules/controls/PlaybackController.ts'
import { TimelineController } from '@/modules/controls/TimelineController.ts'
import { VideoController } from '@/modules/controls/VideoController.ts'
import { VolumeController } from '@/modules/controls/VolumeController.ts'
import { Helpers, zIndex } from '@/core/utils'
import { getMetadata } from '@/core/metadata'

import {
  FullscreenButtonComponent,
  LoopButtonComponent,
  PipButtonComponent,
  PlaylistButtonComponent,
  PlaylistPanelComponent,
  PlayPauseButtonComponent,
  PreviewButtonComponent,
  PreviewPanelComponent,
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
  private previewButton!: PreviewButtonComponent
  private previewPanel!: PreviewPanelComponent
  private volumeControl!: VolumeControlComponent
  private sourceTitleElement!: HTMLElement
  private noFilesMessage!: HTMLElement

  // Z-Index & Resize
  private zIndex: ZIndexInterface
  private draggablePanels: HTMLElement[] = []
  private readonly resizeHandlers: Map<string, () => void> = new Map()

  // State
  private sources: VideoSource[] = []
  private currentSourceIndex: number = 0
  private interfaceTimeout!: ReturnType<typeof setTimeout>
  private titleTimeout!: ReturnType<typeof setTimeout>
  private isMouseOverControls: boolean = false

  private sourcePrevButton!: HTMLElement
  private sourceNextButton!: HTMLElement

  private loopMode: LoopMode = 'none'

  public logging: boolean = false

  constructor(config: VideoPlayerConfig, root: Document | ShadowRoot = document)
  {
    this.config = config
    this.container = config.container
    this.root = root

    // isShowControls is the DYNAMIC state for the auto-hide feature.
    // It should not be confused with the initial config setting.
    this.isShowControls = true

    // Correctly parse boolean values from config
    this.config.nextButton = Helpers.parseBoolean(config.nextButton ?? true)
    this.config.prevButton = Helpers.parseBoolean(config.prevButton ?? true)
    this.config.showControls = Helpers.parseBoolean(config.showControls ?? true)
    this.config.autoPlay = Helpers.parseBoolean(config.autoPlay ?? false)
    this.config.muted = Helpers.parseBoolean(config.muted ?? false)
    this.logging = Helpers.parseBoolean(config.logging ?? false)

    this.events = new EventEmitter()
    this.zIndex = zIndex()
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

    if (config.initialSources) {
      this.setSources(config.initialSources)
    }

    this.loopMode = config.loopMode || 'none'

    this.initializeControlsVisibility()
    this.initializePlayer().catch(console.error)
  }

  private normalizeSources(sources: (string | Partial<VideoSource>)[]): VideoSource[] {
    return sources.map(source => {
      if (typeof source === 'string') {
        return {
          title: source.split('/').pop()?.split('?')[0] || 'Unknown Video',
          url: source
        }
      }

      // Handle object sources, mapping 'source' to 'url'
      const url = (source as any).source || source.url

      return {
        title: source.title || url?.split('/').pop()?.split('?')[0] || 'Unknown Video',
        url: url || '',
        description: source.description,
        thumb: source.thumb
      }
    })
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

    // If controls are disabled by config, hide the UI panels but leave the cursor alone.
    if (!this.config.showControls) {
      ['.player__panel', '.player__top-panel', '.player__main-icon']
        .forEach(selector => {
          this.root.querySelectorAll<HTMLElement>(selector)
            .forEach(element => {
              element.style.display = 'none'
            })
        })
    }

    this.noFilesMessage = this.root.querySelector('.player__no-files-message')!
    this.sourceTitleElement = this.root.querySelector('.player__source-title')!

    // Applying dimensions to the container
    this.applyContainerSizes()

    // Initialize controllers
    this.initializeControllers()
    this.initializePiPListeners()

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
      this.resetInterfaceTimeout() // Use the new method
    } else {
      this.toggleNoFilesMessage(true)
    }

    // Initialize auto-hide only if controls are enabled in the config
    if (this.config.showControls) {
      this.initInterfaceAutoHide()
    }

    // Explicitly set initial state for play/pause button
    if (!this.config.autoPlay) {
      this.handlePause()
    }

    // Defer the initial check to ensure the layout is stable
    await this.awaitLayout('.player__panel')

    this.handleResize()
  }

  private awaitLayout(selector: string, ms: number = 990): Promise<void>
  {
    return new Promise(resolve => {
      let el: HTMLElement | null

      const checkDimensions = (deadline: IdleDeadline) => {
        while (!el && deadline.timeRemaining() > 0) {
          el ??= this.root.querySelector(selector)
        }

        if (!el || el.offsetWidth <= 0) {
          requestIdleCallback(checkDimensions)
        } else {
          setTimeout(resolve, ms)
        }
      }

      requestIdleCallback(checkDimensions)
    })
  }

  private toggleNoFilesMessage(show: boolean): void
  {
    if (this.noFilesMessage) {
      this.noFilesMessage.style.display = show ? 'block' : 'none'
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
    if (!this.config.showControls) return

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
      const isVisible = this.controlsVisibility[key as keyof ControlsVisibility]
      this.root.querySelectorAll<HTMLElement>(selector).forEach(element => {
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

    this.updatePlaylist()

    try {
      if (this.logging) {
        console.log('Loading initial video sources:', this.sources.map(s => s.url))
      }

      // Loading the first source from the array
      await this.loadSourceByIndex(0, false) // Don't auto-play here

      if (this.config.autoPlay) {
        // Mute is often required for autoplay to work
        if (!this.config.muted) {
           if (this.logging) console.warn('Autoplay may not work without the player being muted.')
        }

        await this.videoController.play()
      } else {
        this.videoController.pause()
      }

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
      this.events.emit('error', new Error('All video sources failed to load'))
      return
    }

    try {
      await this.loadSourceByIndex(nextIndex, true)
    } catch (error) {
      // Recursively try the next source
      await this.tryNextSource()
    }
  }

  /**
   * Load specific source by index
   */
  public async loadSourceByIndex(index: number, playAfterLoad?: boolean): Promise<void>
  {
    if (index < 0 || index >= this.sources.length) {
      throw new Error(`Invalid source index: ${index}`)
    }

    const wasPlaying = playAfterLoad ?? this.videoController.getIsPlaying()
    const source = this.sources[index]
    this.currentSourceIndex = index

    if (this.logging) {
      console.log(`Loading video source ${index + 1}/${this.sources.length}:`, source.url)
    }

    // Adding animation to the buttons
    this.highlightSourceNavigation()
    this.showSourceTitle()

    await this.videoController.loadVideoFromUrl(source.url, source.thumb)

    // Manually update volume controller UI after source change
    this.volumeController.updateIcon(this.videoController.getVolume(), this.videoController.getMuted())
    this.volumeController.setVolume(this.videoController.getVolume())


    if (wasPlaying) {
      await this.videoController.play()
    }

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
    ['.player__panel', '.player__top-panel', '.player__main-icon']
      .forEach(selector => {
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
    ['.player__panel', '.player__top-panel', '.player__main-icon']
      .forEach(selector => {
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
    this.previewButton = this.root.querySelector('preview-button')!
    this.previewPanel = this.root.querySelector('preview-panel')!
    this.volumeControl = this.root.querySelector<VolumeControlComponent>('volume-control')!

    const speedOptions = this.root.querySelector<SpeedOptionsComponent>('speed-options')!
    const timelineControl = this.root.querySelector<TimelineComponent>('timeline-control')!

    // Initialize Video Controller
    this.videoController = new VideoController(
      videoElement,
      {
        onTimeUpdate: this.handleTimeUpdate.bind(this),
        onVolumeChange: this.handleVolumeChange.bind(this),
        onPlay: this.handlePlay.bind(this),
        onPause: this.handlePause.bind(this),
        onEnded: this.handleEnded.bind(this),
        onLoadedMetadata: this.handleLoadedMetadata.bind(this),
        onError: this.handleError.bind(this),
        onFileLoaded: this.handleFileLoaded.bind(this),
      },
      this.logging
    )

    // Initialize Source Navigation Buttons
    this.sourcePrevButton = this.root.querySelector('.j-source-prev') as HTMLElement
    this.sourceNextButton = this.root.querySelector('.j-source-next') as HTMLElement

    if (this.sourcePrevButton && this.sourceNextButton) {
      this.updateSourceNavigationVisibility()
    }

    // Initialize Volume Controller
    this.volumeController = new VolumeController(
      this.volumeControl,
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

    // Set initial volume and muted state
    const initialVolume = this.config.initialVolume ?? 1.0
    const isMuted = this.config.muted ?? false
    this.videoController.setVolume(initialVolume)
    this.videoController.setMuted(isMuted)
    this.volumeController.setVolume(initialVolume)
    this.volumeController.updateIcon(initialVolume, isMuted)

    if (this.config.playbackRate !== undefined) {
      this.videoController.setPlaybackRate(this.config.playbackRate)
    }

    this.applyLoopMode()
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
    this.initializeDraggablePanels()
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
    this.adjustPanelsToViewport = this.adjustPanelsToViewport.bind(this)
    this.adjustVolumeOrientation = this.adjustVolumeOrientation.bind(this)
    this.handleResize = this.handleResize.bind(this)

    this.resizeHandlers.set('adjustPanelsToViewport', this.adjustPanelsToViewport)
    this.resizeHandlers.set('adjustVolumeOrientation', this.adjustVolumeOrientation)

    window.addEventListener('resize', this.handleResize)

    // Open File button
    this.root.querySelector<HTMLElement>('.j-open-file')
      ?.addEventListener('click', async (event) => {
        event.stopPropagation();
        this.resetInterfaceTimeout()
        await this.loadVideoFile()
      })

    // Play/Pause button
    this.playPauseButton?.addEventListener('click', async () => {
      this.resetInterfaceTimeout()

      if (!this.videoController.getIsPlaying()) {
        this.showSourceTitle()
      }

      await this.videoController.togglePlay()
    })

    // Skip buttons
    this.root.querySelectorAll<SkipButtonComponent>('skip-button')
      .forEach(button => {
        button.addEventListener('click', () => {
          this.resetInterfaceTimeout()
          this.videoController.skip(button.getAttribute('direction') === 'forward' ? 5 : -5)
        })
      })

    // Loop button
    this.loopButton?.addEventListener('click', () => {
      this.resetInterfaceTimeout()
      this.toggleLoop()
    })

    // Video click to play/pause and open file dialog if no source
    const videoElement = this.root.querySelector<HTMLElement>('.player__video')
    videoElement?.addEventListener('click', async () => {
      if (!this.videoController.getIsPlaying()) {
        this.showSourceTitle()
      }

      await this.videoController.togglePlay()
    })

    videoElement?.addEventListener('dblclick', async () => {
      await this.toggleFullscreen()
    })

    // Fullscreen button
    this.fullscreenButton?.addEventListener('click', async () => {
      this.resetInterfaceTimeout()
      await this.toggleFullscreen()
    })

    // Picture in Picture button
    if (this.pipButton) {
      if (this.isPictureInPictureSupported()) {
        this.pipButton.addEventListener('click', () => {
          this.resetInterfaceTimeout()
          this.togglePictureInPicture().catch(err => {
            if (err.name !== 'NotAllowedError') {
              console.error(err)
            }
          })
        })
      } else {
        this.pipButton.style.display = 'none'
      }
    }

    // Playlist button
    this.playlistButton?.addEventListener('click', () => {
      this.resetInterfaceTimeout()
      this.togglePlaylist()
    })

    // Playlist panel
    this.playlistPanel?.addEventListener('itemclick', async (e: any) => {
      this.resetInterfaceTimeout()
      await this.switchToSource(e.detail.index)
    })

    this.playlistPanel?.addEventListener('close', () => {
      this.togglePlaylist()
    })

    // Preview button
    this.previewButton?.addEventListener('click', async () => {
      this.resetInterfaceTimeout()
      await this.togglePreviewPanel()
    })

    // Preview panel
    this.previewPanel?.addEventListener('generate', async () => {
      this.resetInterfaceTimeout()
      await this.generateAndShowPreview()
    })

    this.previewPanel?.addEventListener('close', async () => {
      await this.togglePreviewPanel()
    })

    // Source Navigation buttons
    this.sourcePrevButton?.addEventListener('click', (e) => {
      this.resetInterfaceTimeout()
      e.stopPropagation()
      this.previousSource().catch(console.error)
    })

    this.sourceNextButton?.addEventListener('click', (e) => {
      this.resetInterfaceTimeout()
      e.stopPropagation()
      this.nextSource().catch(console.error)
    })

    // Update playlist on source change
    this.on('sourcechanged', () => this.updatePlaylist())

    // Listen for mouse over on control elements
    this.root.querySelectorAll<HTMLElement>('.player__panel, .player__top-panel, .player__source-nav')
      ?.forEach(element => {
        element.addEventListener('mouseenter', () => {
          this.isMouseOverControls = true
          this.resetInterfaceTimeout()
        })

        element.addEventListener('mouseleave', () => {
          this.isMouseOverControls = false
          this.resetInterfaceTimeout()
        })
      })
  }

  /**
   * Bind keyboard event listeners
   */
  private bindKeyboardEvents(): void
  {
    this.root.addEventListener('keydown', (event) => {
      if (!this.isPlayerActive()) return
      this.resetInterfaceTimeout()

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

  private initializePiPListeners(): void
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

  private resetInterfaceTimeout(): void
  {
    if (!this.config.showControls) return

    this.showInterface()
    clearTimeout(this.interfaceTimeout)

    if (this.isMouseOverControls) return

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
      this.resetInterfaceTimeout()
    })
  }

  // Event Handlers

  private handleResize(): void
  {
    this.resizeHandlers.forEach(handler => handler())
  }

  private updateSourceNavigationVisibility(): void
  {
    const hasMultipleSources = this.sources.length > 1
    const showPrev = hasMultipleSources && (this.config.prevButton ?? true)
    const showNext = hasMultipleSources && (this.config.nextButton ?? true)

    if (this.sourcePrevButton) {
      this.sourcePrevButton.style.display = showPrev ? '' : 'none'
    }
    if (this.sourceNextButton) {
      this.sourceNextButton.style.display = showNext ? '' : 'none'
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
      pauseIcon.style.display = 'flex'
      playBigIcon.classList.remove('player__main-icon--visible')
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
      playBigIcon.classList.add('player__main-icon--visible')
    }

    this.events.emit('pause', undefined)
  }

  private handleEnded(): void
  {
    if (this.loopMode === 'all') {
      if (this.sources.length <= 1) return

      const nextIndex = (this.currentSourceIndex + 1) % this.sources.length
      this.loadSourceByIndex(nextIndex, true).catch(error => {
        console.error('Failed to play next source:', error)
      })
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
    this.handleResize()

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
    this.videoController.setLoop(this.loopMode === 'one')
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
  setSources(sources: (string | Partial<VideoSource>)[] = []): void
  {
    this.sources = this.normalizeSources(sources)
    this.currentSourceIndex = 0
    this.updateSourceNavigationVisibility()
    this.updatePlaylist()
  }

  /**
   * Add source to the sources array
   */
  addSource(source: Partial<VideoSource>): void
  {
    const normalizedSource = this.normalizeSources([source])[0]

    if (!this.sources.some(s => s.url === normalizedSource.url)) {
      this.sources.push(normalizedSource)

      this.updateSourceNavigationVisibility()
      this.updatePlaylist()
      this.toggleNoFilesMessage(false)
    }
  }

  /**
   * Get all available sources
   */
  getSources(): VideoSource[]
  {
    return [...this.sources]
  }

  /**
   * Get current source URL
   */
  getCurrentSource(): VideoSource | undefined
  {
    return this.sources[this.currentSourceIndex]
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
    const index = this.sources.findIndex(s => s.url === url)
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
    await this.videoController.loadVideoFromUrl(url)

    if (!this.sources.some(s => s.url === url)) {
      this.addSource({ url })
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
    const video = this.root.querySelector<HTMLVideoElement>('.player__video')
    if (!video?.src || video.readyState < HTMLMediaElement.HAVE_METADATA) {
      console.warn('Video not loaded. Cannot activate Picture-in-Picture.')
      return
    }

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else if (document.pictureInPictureEnabled) {
      await video.requestPictureInPicture()
    }
  }

  /**
   * Show controls
   */
  showControls(): void
  {
    if (!this.config.showControls) return

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
    if (!this.config.showControls) return

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
    return ['one', 'all'].includes(this.loopMode)
  }

  /**
   * Set loop state (for backward compatibility)
   */
  setLoop(loop: boolean): void
  {
    this.setLoopMode(loop ? 'one' : 'none')
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
    if (!this.config.showControls) return
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

  private updatePlaylist(): void
  {
    if (this.playlistPanel) {
      this.playlistPanel.sources = this.sources.map(source => source.title)
      this.playlistPanel.activeIndex = this.currentSourceIndex
    }
  }

  private togglePlaylist(): void
  {
    if (this.playlistPanel) {
      this.playlistPanel.toggleAttribute('visible')
    }
  }

  private async handleFileLoaded(file: File, url: string): Promise<void>
  {
    try {
      const existingSource = this.sources.find(s => s.url === url)
      let title = existingSource?.title

      if (!title) {
        const metadata = await getMetadata(file)
        title = metadata.title || file.name
      }

      const newSource: VideoSource = { ...existingSource, title, url, file }
      const existingSourceIndex = this.sources.findIndex(s => s.url === url)

      if (existingSourceIndex !== -1) {
        this.sources[existingSourceIndex] = newSource
      } else {
        this.sources.push(newSource)
      }

      this.updatePlaylist()
      this.videoController.setPoster(newSource.thumb)
      this.toggleNoFilesMessage(false)

      const newIndex = this.sources.findIndex(s => s.url === url)
      if (this.currentSourceIndex !== newIndex && newIndex !== -1) {
        this.currentSourceIndex = newIndex
        this.events.emit('sourcechanged', this.currentSourceIndex)
      }
    } catch (error) {
      console.error('Error processing loaded file:', error)
      if (!this.sources.some(s => s.url === url)) {
        this.addSource({ url, title: file.name, file })
      }
    }
  }

  private async togglePreviewPanel(): Promise<void>
  {
    if (this.sources.length === 0) return

    const isVisible = this.previewPanel.hasAttribute('visible')
    if (!isVisible) {
      this.previewPanel.setAttribute('visible', '')
      await this.generateAndShowPreview()
    } else {
      this.previewPanel.removeAttribute('visible')
    }
  }

  private async generateAndShowPreview(): Promise<void>
  {
    if (this.sources.length === 0 || !this.previewPanel) return

    const videoElement = this.videoController.getVideoElement()
    const currentSource = this.getCurrentSource()
    const currentTime = videoElement.currentTime

    if (!currentSource) return

    try {
      const blob = await Helpers.captureFrame(videoElement)
      if (!blob) {
        console.error('Captured frame blob is null.')
        return
      }

      const title = currentSource.title || 'preview'
      const lastDotIndex = title.lastIndexOf('.')
      const baseName = lastDotIndex !== -1 ? title.substring(0, lastDotIndex) : title
      const filename = `${Helpers.toCamelCase(baseName)}.jpg`

      this.previewPanel.update({
        blob: blob,
        filename: filename,
        resolution: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
        timestamp: currentTime,
        size: blob.size
      })
    } catch (error) {
      console.error('Failed to generate preview:', error)
    }
  }

  private showSourceTitle(): void
  {
    if (!this.sourceTitleElement) return

    const currentSource = this.getCurrentSource()

    if (!currentSource || !currentSource.title) return

    this.sourceTitleElement.textContent = currentSource.title
    this.sourceTitleElement.classList.add('visible')

    clearTimeout(this.titleTimeout)
    this.titleTimeout = setTimeout(() => {
      this.sourceTitleElement.classList.remove('visible')
    }, 4000)
  }

  private initializeDraggablePanels()
  {
    this.draggablePanels = [this.playlistPanel, this.previewPanel]
    this.draggablePanels.forEach(panel => {
      if (panel) {
        this.zIndex.push(panel.id)
        panel.addEventListener('mousedown', () => this.handlePanelFocus(panel.id))
      }
    })
  }

  private handlePanelFocus(panelId: string)
  {
    this.zIndex.sort(panelId)
    this.draggablePanels.forEach(panel => {
      if (panel) {
        panel.style.zIndex = this.zIndex.value(panel.id)
      }
    })
  }

  private adjustPanelsToViewport()
  {
    this.draggablePanels.forEach(panel => {
      if (panel.style.display === 'none' || !panel.style.left) return

      const panelRect = panel.getBoundingClientRect()

      let currentX = parseFloat(panel.style.left)
      let currentY = parseFloat(panel.style.top)

      if (panelRect.right > window.innerWidth) {
        currentX = window.innerWidth - panelRect.width
      }
      if (panelRect.bottom > window.innerHeight) {
        currentY = window.innerHeight - panelRect.height
      }
      if (panelRect.left < 0) {
        currentX = 0
      }
      if (panelRect.top < 0) {
        currentY = 0
      }

      panel.style.left = `${currentX}px`
      panel.style.top = `${currentY}px`
    })
  }

  private adjustVolumeOrientation(): void
  {
    if (!this.volumeControl || !this.controlsVisibility.showVolume) return

    const panel = this.root.querySelector('.player__panel')
    const panelBlocks = this.root.querySelectorAll('.player__panel-block')

    if (!panel || panelBlocks.length < 2) return

    // 100px for the slider + 10px margin
    const horizontalVolumeWidth = 110

    // Calculate the total width of all visible elements in both blocks
    let totalChildrenWidth = 0
    panelBlocks.forEach(block => {
      Array.from(block.children).forEach(child => {
        const style = window.getComputedStyle(child as Element)

        if (style.display !== 'none') {
          totalChildrenWidth += (child as HTMLElement).offsetWidth + parseInt(style.marginRight, 10);
        }
      })
    })

    // Check if there's enough space for the horizontal volume slider
    const availableWidth = panel.clientWidth - 30 // padding
    const requiredWidth = totalChildrenWidth + horizontalVolumeWidth

    if (requiredWidth > availableWidth) {
      this.volumeControl.classList.add('player__volume--vertical')
    } else {
      this.volumeControl.classList.remove('player__volume--vertical')
    }
  }

  /**
   * Destroy the video player and clean up resources
   */
  destroy(): void
  {
    window.removeEventListener('resize', this.handleResize)

    this.videoController.destroy()
    this.volumeController.destroy()
    this.playbackController.destroy()
    this.fullscreenController.destroy()
    this.timelineController.destroy()
    this.events.destroy()

    if (this.interfaceTimeout) {
      clearTimeout(this.interfaceTimeout)
    }
  }
}
