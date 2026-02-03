import { VolumeControl } from './VolumeControl'
import { SpeedOptions } from './SpeedOptions'
import { TimeDisplay } from './TimeDisplay'
import { PipButton } from './PipButton'

/**
 * Main control panel UI component - acts as a container for other controls.
 */
export class ControlPanel
{
  private readonly container: HTMLElement

  // Callbacks
  private readonly onSkip: (seconds: number) => void
  private readonly onSpeedChange: (speed: number) => void
  private readonly onVolumeChange: (volume: number) => void
  private readonly onMuteToggle: () => void
  private readonly onPipToggle: () => void

  private onPlayToggle: () => void
  private onFullscreenToggle: () => void
  private onOpenFile: () => void
  private onLoopToggle: () => void

  // UI Elements
  private playButton!: HTMLElement
  private skipBackwardButton!: HTMLElement
  private skipForwardButton!: HTMLElement
  private fullscreenButton!: HTMLElement
  private openFileButton!: HTMLElement
  private loopButton!: HTMLElement
  private speedButton!: HTMLElement

  // Child components
  private volumeControl!: VolumeControl
  private speedOptions!: SpeedOptions
  private timeDisplay!: TimeDisplay
  private pipButton!: PipButton

  constructor(
    container: HTMLElement,
    callbacks: {
      onPlayToggle: () => void
      onSkip: (seconds: number) => void
      onFullscreenToggle: () => void
      onSpeedChange: (speed: number) => void
      onVolumeChange: (volume: number) => void
      onMuteToggle: () => void
      onPipToggle: () => void
      onOpenFile: () => void
      onLoopToggle: () => void
    },
    speeds: number[],
    initialSpeed: number
  ) {
    this.container = container

    this.onPlayToggle = callbacks.onPlayToggle
    this.onSkip = callbacks.onSkip
    this.onFullscreenToggle = callbacks.onFullscreenToggle
    this.onSpeedChange = callbacks.onSpeedChange
    this.onVolumeChange = callbacks.onVolumeChange
    this.onMuteToggle = callbacks.onMuteToggle
    this.onPipToggle = callbacks.onPipToggle
    this.onOpenFile = callbacks.onOpenFile
    this.onLoopToggle = callbacks.onLoopToggle

    this.render()
    this.initializeElements()
    this.bindEvents()
    this.initializeChildComponents(speeds, initialSpeed)
  }

  /**
   * Render the layout and placeholders for child components.
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="player__panel-block">
        <button class="player__panel-button j-skip-backward" title="Skip backward 5s">
          <em class="fas fa-backward"></em>
        </button>
        
        <button class="player__panel-button j-open-file" title="Open video file">
          <em class="fas fa-folder-open"></em>
        </button>
        
        <button class="player__panel-button j-toggle-loop" title="Loop video">
          <svg class="loop-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <g class="loop-icon__group">
              <path class="loop-icon__number" fill-rule="evenodd" d="M12.475 9.132a.9.9 0 0 1 .429.766V14.1a.9.9 0 0 1-1.8 0v-2.74a.9.9 0 0 1-.807-1.609l1.3-.656a.9.9 0 0 1 .878.037" clip-rule="evenodd"></path>
              <path class="loop-icon__arrows" d="M2.005 12c0-3.258 2.642-5.9 5.902-5.9h10.026l-.564-.564a.9.9 0 1 1 1.273-1.272l2.1 2.1a.9.9 0 0 1 0 1.272l-2.1 2.1a.9.9 0 0 1-1.273-1.272l.564-.564H7.907A4.1 4.1 0 0 0 3.805 12v.097a.9.9 0 0 1-1.8 0zM21.104 11.003a.9.9 0 0 1 .9.9V12c0 3.259-2.642 5.9-5.902 5.9H6.074l.564.564a.9.9 0 1 1-1.273 1.272l-2.101-2.1a.9.9 0 0 1 0-1.272l2.1-2.1a.9.9 0 0 1 1.274 1.272l-.564.564h10.029a4.1 4.1 0 0 0 4.101-4.1v-.097a.9.9 0 0 1 .9-.9"></path>
            </g>
          </svg>
        </button>
        
        <button class="player__panel-button j-toggle-video" title="Play/Pause">
          <em class="fas fa-play"></em>
        </button>
        
        <button class="player__panel-button j-skip-forward" title="Skip forward 5s">
          <em class="fas fa-forward"></em>
        </button>
        
        <div class="volume-control-container"></div>
        <div class="time-display-container"></div>
      </div>
      
      <div class="player__panel-block">
        <div class="speed-control"></div>
        <div class="pip-button-container"></div>
        
        <button class="player__panel-button j-fullscreen" title="Fullscreen">
          <em class="fas fa-expand"></em>
        </button>
      </div>`
  }

  /**
   * Initialize DOM element references for controls managed directly by the panel.
   */
  private initializeElements(): void
  {
    this.playButton = this.container.querySelector('.j-toggle-video') as HTMLElement
    this.skipBackwardButton = this.container.querySelector('.j-skip-backward') as HTMLElement
    this.skipForwardButton = this.container.querySelector('.j-skip-forward') as HTMLElement
    this.fullscreenButton = this.container.querySelector('.j-fullscreen') as HTMLElement
    this.openFileButton = this.container.querySelector('.j-open-file') as HTMLElement
    this.loopButton = this.container.querySelector('.j-toggle-loop') as HTMLElement
  }

  /**
   * Bind event listeners for controls managed directly by the panel.
   */
  private bindEvents(): void
  {
    this.onPlayToggle = this.onPlayToggle.bind(this)
    this.onFullscreenToggle = this.onFullscreenToggle.bind(this)
    this.handleSkipBackward = this.handleSkipBackward.bind(this)
    this.handleSkipForward = this.handleSkipForward.bind(this)
    this.handleSpeedToggle = this.handleSpeedToggle.bind(this)
    this.onLoopToggle = this.onLoopToggle.bind(this)
    this.onOpenFile = this.onOpenFile.bind(this)

    this.playButton.addEventListener('click', this.onPlayToggle)
    this.skipBackwardButton.addEventListener('click', this.handleSkipBackward)
    this.skipForwardButton.addEventListener('click', this.handleSkipForward)
    this.fullscreenButton.addEventListener('click', this.onFullscreenToggle)
    this.openFileButton.addEventListener('click', this.onOpenFile)
    this.loopButton.addEventListener('click', this.onLoopToggle)
  }

  // Bound event handlers for proper removal
  private handleSkipBackward(): void
  {
    this.onSkip(-5)
  }

  private handleSkipForward(): void
  {
    this.onSkip(5)
  }

  private handleSpeedToggle(e: Event): void
  {
    e.stopPropagation()
    this.speedOptions.toggle()
  }

  /**
   * Create instances of child components and pass them their containers.
   */
  private initializeChildComponents(speeds: number[], initialSpeed: number): void
  {
    this.volumeControl = new VolumeControl(
      this.container.querySelector('.volume-control-container') as HTMLElement,
      {
        onVolumeChange: this.onVolumeChange,
        onMuteToggle: this.onMuteToggle
      }
    )

    const speedControlContainer = this.container.querySelector('.speed-control') as HTMLElement
    speedControlContainer.innerHTML = `
      <button class="player__panel-button j-speed" title="Playback speed">
        <span class="material-symbols-rounded">slow_motion_video</span>
      </button>
      <ul class="speed-options-container"></ul>`

    this.speedButton = speedControlContainer.querySelector('.j-speed') as HTMLElement
    this.speedOptions = new SpeedOptions(
      speedControlContainer.querySelector('.speed-options-container') as HTMLElement,
      this.onSpeedChange,
      speeds,
      initialSpeed
    )

    this.speedButton.addEventListener('click', this.handleSpeedToggle)

    this.timeDisplay = new TimeDisplay(
      this.container.querySelector('.time-display-container') as HTMLElement
    )

    this.pipButton = new PipButton(
      this.container.querySelector('.pip-button-container') as HTMLElement,
      this.onPipToggle
    )
  }

  // --- Public API for VideoPlayer to update children ---

  updatePlayButton(isPlaying: boolean): void
  {
    const icon = this.playButton.querySelector('em')
    if (icon) icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play'
  }

  updateFullscreenButton(isFullscreen: boolean): void
  {
    const icon = this.fullscreenButton.querySelector('em')
    if (icon) icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand'
  }

  updateLoopButton(mode: 'none' | 'one' | 'all'): void
  {
    const loopIcon = this.loopButton.querySelector<SVGElement>('.loop-icon')
    if (loopIcon) {
      loopIcon.classList.remove('loop-icon--none', 'loop-icon--one', 'loop-icon--all')
      loopIcon.classList.add(`loop-icon--${mode}`)
    }
  }

  updateSpeed(speed: number): void
  {
    this.speedOptions.update(speed)
  }

  updateTime(currentTime: number, duration: number): void
  {
    this.timeDisplay.update(currentTime, duration)
  }

  updateVolume(volume: number, isMuted: boolean): void
  {
    this.volumeControl.update(volume, isMuted)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.playButton.removeEventListener('click', this.onPlayToggle)
    this.skipBackwardButton.removeEventListener('click', this.handleSkipBackward)
    this.skipForwardButton.removeEventListener('click', this.handleSkipForward)
    this.fullscreenButton.removeEventListener('click', this.onFullscreenToggle)
    this.openFileButton.removeEventListener('click', this.onOpenFile)
    this.loopButton.removeEventListener('click', this.onLoopToggle)
    this.speedButton.removeEventListener('click', this.handleSpeedToggle)

    this.volumeControl.destroy()
    this.speedOptions.destroy()
    this.pipButton.destroy()
  }
}
