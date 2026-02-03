/**
 * Main control panel UI component
 */
export class ControlPanel
{
  private readonly container: HTMLElement
  private readonly onPlayToggle: () => void
  private readonly onSkip: (seconds: number) => void
  private readonly onFullscreenToggle: () => void

  // UI Elements
  private playButton!: HTMLElement
  private skipBackwardButton!: HTMLElement
  private skipForwardButton!: HTMLElement
  private fullscreenButton!: HTMLElement
  private timeDisplay!: HTMLElement
  private volumeContainer!: HTMLElement
  private speedContainer!: HTMLElement

  constructor(
    container: HTMLElement,
    callbacks: {
      onPlayToggle: () => void;
      onSkip: (seconds: number) => void;
      onFullscreenToggle: () => void;
    }
  ) {
    this.container = container
    this.onPlayToggle = callbacks.onPlayToggle
    this.onSkip = callbacks.onSkip
    this.onFullscreenToggle = callbacks.onFullscreenToggle

    this.render()
    this.initializeElements()
    this.bindEvents()
  }

  /**
   * Render control panel HTML
   */
  private render(): void
  {
    this.container.innerHTML = `
      <div class="control-panel">
        <div class="controls-left">
          <button class="control-button skip-backward" title="Skip backward 5s">
            <i class="fas fa-backward"></i>
          </button>
          <button class="control-button play-button" title="Play/Pause">
            <i class="fas fa-play"></i>
          </button>
          <button class="control-button skip-forward" title="Skip forward 5s">
            <i class="fas fa-forward"></i>
          </button>
          
          <div class="volume-control">
            <button class="control-button volume-button" title="Volume">
              <i class="fas fa-volume-up"></i>
            </button>
            <input type="range" class="volume-slider" min="0" max="100" value="70">
          </div>
          
          <div class="time-display">0:00 / 0:00</div>
        </div>
        
        <div class="controls-right">
          <div class="speed-control">
            <button class="control-button speed-button" title="Playback speed">
              <span class="speed-text">Normal</span>
            </button>
            <div class="speed-options"></div>
          </div>
          
          <button class="control-button pip-button" title="Picture in picture">
            <i class="material-icons">picture_in_picture_alt</i>
          </button>
          
          <button class="control-button fullscreen-button" title="Fullscreen">
            <i class="fas fa-expand"></i>
          </button>
        </div>
      </div>`
  }

  get element()
  {
    return this.container
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void
  {
    this.playButton = this.container.querySelector('.play-button') as HTMLElement
    this.skipBackwardButton = this.container.querySelector('.skip-backward') as HTMLElement
    this.skipForwardButton = this.container.querySelector('.skip-forward') as HTMLElement
    this.fullscreenButton = this.container.querySelector('.fullscreen-button') as HTMLElement
    this.timeDisplay = this.container.querySelector('.time-display') as HTMLElement
    this.volumeContainer = this.container.querySelector('.volume-control') as HTMLElement
    this.speedContainer = this.container.querySelector('.speed-control') as HTMLElement

    if (!this.playButton) {
      throw new Error('Control panel elements not found')
    }
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void
  {
    this.playButton.addEventListener('click', this.onPlayToggle)
    this.skipBackwardButton.addEventListener('click', () => this.onSkip(-5))
    this.skipForwardButton.addEventListener('click', () => this.onSkip(5))
    this.fullscreenButton.addEventListener('click', this.onFullscreenToggle)
  }

  // Public API Methods

  /**
   * Update play/pause button state
   */
  updatePlayButton(isPlaying: boolean): void
  {
    const icon = this.playButton?.querySelector<HTMLElement>('i')
    if (icon) {
      icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play'
    }
  }

  /**
   * Update time display
   */
  updateTimeDisplay(currentTime: string, duration: string): void
  {
    if (this.timeDisplay) {
      this.timeDisplay.textContent = `${currentTime} / ${duration}`
    }
  }

  /**
   * Update fullscreen button state
   */
  updateFullscreenButton(isFullscreen: boolean): void
  {
    const icon = this.fullscreenButton?.querySelector('i') as HTMLElement
    if (icon) {
      icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand'
    }
  }

  /**
   * Get volume container for VolumeController
   */
  getVolumeContainer(): HTMLElement
  {
    return this.volumeContainer
  }

  /**
   * Get speed container for PlaybackController
   */
  getSpeedContainer(): HTMLElement
  {
    return this.speedContainer
  }

  /**
   * Show control panel
   */
  show(): void
  {
    this.container.style.opacity = '1'
    this.container.style.pointerEvents = 'auto'
  }

  /**
   * Hide control panel
   */
  hide(): void
  {
    this.container.style.opacity = '0'
    this.container.style.pointerEvents = 'none'
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.playButton.removeEventListener('click', this.onPlayToggle)
    this.skipBackwardButton.removeEventListener('click', () => this.onSkip(-5))
    this.skipForwardButton.removeEventListener('click', () => this.onSkip(5))
    this.fullscreenButton.removeEventListener('click', this.onFullscreenToggle)
  }
}
