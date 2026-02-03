/**
 * Playback rate control configuration
 */
export interface PlaybackControllerConfig {
  speeds: number[]
  defaultSpeed: number
}

/**
 * Controller for playback rate management
 */
export class PlaybackController
{
  private button!: HTMLElement
  private optionsContainer!: HTMLElement
  private config: Required<PlaybackControllerConfig>
  private readonly onSpeedChange: (speed: number) => void
  private currentSpeed: number

  constructor(
    container: HTMLElement,
    onSpeedChange: (speed: number) => void,
    config: Partial<PlaybackControllerConfig> = {}
  ) {
    this.onSpeedChange = onSpeedChange

    this.config = {
      speeds: config.speeds || [0.5, 0.75, 1, 1.25, 1.5, 2],
      defaultSpeed: config.defaultSpeed || 1
    }

    this.currentSpeed = this.config.defaultSpeed
    this.initializeElements(container)
    this.bindEventListeners()
    this.renderOptions()
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(container: HTMLElement): void
  {
    this.button = container.querySelector('.j-speed') as HTMLElement
    this.optionsContainer = container.querySelector('.j-speed-options') as HTMLElement

    if (!this.button) {
      console.error('Speed button not found in container:', container.innerHTML)
      throw new Error('Speed button element not found')
    }

    if (!this.optionsContainer) {
      console.error('Speed options container not found in container:', container.innerHTML)
      throw new Error('Speed options container not found')
    }
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    this.handleButtonClick = this.handleButtonClick.bind(this)
    this.handleDocumentClick = this.handleDocumentClick.bind(this)

    this.button.addEventListener('click', this.handleButtonClick)

    // Close options when clicking outside
    document.addEventListener('click', this.handleDocumentClick)
  }

  private handleButtonClick(event: MouseEvent): void
  {
    event.stopPropagation()
    this.toggleOptions()
  }

  private handleDocumentClick(event: MouseEvent): void
  {
    if (!this.button?.contains(event.target as Node) &&
      !this.optionsContainer.contains(event.target as Node)) {
      this.hideOptions()
    }
  }

  private handleOptionClick(speed: number): void
  {
    this.setSpeed(speed)
    this.hideOptions()
  }

  /**
   * Toggle options visibility
   */
  private toggleOptions(): void
  {
    this.optionsContainer.classList.toggle('show')
  }

  /**
   * Hide options
   */
  private hideOptions(): void
  {
    this.optionsContainer.classList.remove('show')
  }

  /**
   * Render speed options in the dropdown
   */
  private renderOptions(): void
  {
    // Clear existing options
    this.optionsContainer.innerHTML = ''

    this.config.speeds.forEach(speed => {
      const option = document.createElement('li')
      option.className = `speed-option ${speed === this.currentSpeed ? 'active' : ''}`
      option.textContent = speed === 1 ? 'Normal' : `${speed}x`
      option.dataset.speed = speed.toString()

      option.addEventListener('click', () => this.handleOptionClick(speed))
      this.optionsContainer.appendChild(option)
    })
  }

  /**
   * Update active option in the dropdown
   */
  private updateActiveOption(): void
  {
    this.optionsContainer.querySelectorAll('li').forEach(option => {
      const force = this.currentSpeed === parseFloat(option.dataset.speed || '1')
      option.classList.toggle('active', force)
    })
  }

  // Public API

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void
  {
    const validSpeed = this.config.speeds.includes(speed) ? speed : this.config.defaultSpeed

    this.currentSpeed = validSpeed
    this.onSpeedChange(validSpeed)
    this.updateActiveOption()
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.button.removeEventListener('click', this.handleButtonClick)
    document.removeEventListener('click', this.handleDocumentClick)
  }
}
