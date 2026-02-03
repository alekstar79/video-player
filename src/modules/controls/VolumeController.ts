import { Helpers } from '@/core/utils/helpers'

/**
 * Volume control configuration
 */
export interface VolumeControllerConfig {
  min?: number;
  max?: number;
  step?: number;
  showSliderOnHover?: boolean;
}

/**
 * Controller for volume management and UI
 */
export class VolumeController
{
  private button: HTMLElement
  private slider!: HTMLInputElement
  private icon!: HTMLElement
  private config: Required<VolumeControllerConfig>

  private readonly onVolumeChange: (volume: number) => void
  private readonly onMuteToggle: () => void

  private isDragging: boolean = false
  private isHovering: boolean = false

  constructor(
    buttonElement: HTMLElement,
    callbacks: {
      onVolumeChange: (volume: number) => void;
      onMuteToggle: () => void;
    },
    config: VolumeControllerConfig = {}
  ) {
    this.button = buttonElement
    this.onVolumeChange = callbacks.onVolumeChange
    this.onMuteToggle = callbacks.onMuteToggle

    this.config = {
      min: config.min ?? 0,
      max: config.max ?? 100,
      step: config.step ?? 1,
      showSliderOnHover: config.showSliderOnHover ?? true
    }

    this.initializeElements()
    this.bindEventListeners()
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void
  {
    // The button is the container itself
    this.slider = this.button.querySelector('.j-volume-input') as HTMLInputElement
    this.icon = this.button.querySelector('.fas') as HTMLElement

    if (!this.slider) {
      console.error('Volume slider not found in:', this.button.innerHTML)
      throw new Error('Volume slider element not found')
    }

    if (!this.icon) {
      console.error('Volume icon not found in:', this.button.innerHTML)
      throw new Error('Volume icon element not found')
    }

    // Set slider attributes
    this.slider.min = this.config.min.toString()
    this.slider.max = this.config.max.toString()
    this.slider.step = this.config.step.toString()
    this.slider.value = (this.config.max * 0.7).toString() // Default to 70% volume

    if (this.config.showSliderOnHover) {
      this.hideSlider()
    }
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    this.handleSliderMouseDown = this.handleSliderMouseDown.bind(this)
    this.handleSliderInput = this.handleSliderInput.bind(this)
    this.handleButtonClick = this.handleButtonClick.bind(this)

    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)

    this.handleGlobalMouseUp = this.handleGlobalMouseUp.bind(this)

    this.slider.addEventListener('mousedown', this.handleSliderMouseDown)
    this.slider.addEventListener('input', this.handleSliderInput)
    this.button.addEventListener('click', this.handleButtonClick)

    if (this.config.showSliderOnHover) {
      this.button.addEventListener('mouseenter', this.handleMouseEnter)
      this.button.addEventListener('mouseleave', this.handleMouseLeave)
    }

    document.addEventListener('mouseup', this.handleGlobalMouseUp)
  }

  private handleButtonClick(event: MouseEvent): void
  {
    // Don't trigger if clicking on the slider
    if ((event.target as Element).classList.contains('j-volume-input')) {
      return
    }

    event.stopPropagation()
    this.onMuteToggle()
  }

  private handleSliderInput(event: Event): void
  {
    const value = parseInt((event.target as HTMLInputElement).value)
    const normalizedVolume = value / this.config.max
    this.onVolumeChange(normalizedVolume)
  }

  private handleSliderMouseDown(event: MouseEvent): void
  {
    event.stopPropagation()
    this.isDragging = true
  }

  private handleGlobalMouseUp(): void
  {
    this.isDragging = false
    if (!this.isHovering && this.config.showSliderOnHover) {
      this.hideSlider()
    }
  }

  private handleMouseEnter(): void
  {
    this.isHovering = true
    this.showSlider()
  }

  private handleMouseLeave(): void
  {
    this.isHovering = false
    if (!this.isDragging) {
      this.hideSlider()
    }
  }

  private showSlider(): void
  {
    this.slider.style.width = '100px'
    this.slider.style.opacity = '1'
    this.slider.style.marginLeft = '20px'
  }

  private hideSlider(): void
  {
    this.slider.style.width = '0'
    this.slider.style.opacity = '0'
    this.slider.style.marginLeft = '0'
  }

  // Public API

  /**
   * Set volume and update UI
   */
  setVolume(volume: number): void
  {
    const clampedVolume = Helpers.clamp(volume, 0, 1)
    const sliderValue = clampedVolume * this.config.max

    this.slider.value = sliderValue.toString()
  }

  /**
   * Get current volume level
   */
  getVolume(): number
  {
    return parseInt(this.slider!.value) / this.config.max
  }

  /**
   * Update volume icon based on volume level
   */
  updateIcon(volume: number, muted: boolean): void
  {
    // Reset classes and keep only fas
    this.icon.className = 'fas'

    if (muted || volume === 0) {
      this.icon.classList.add('fa-volume-mute')
    } else if (volume > 0.66) {
      this.icon.classList.add('fa-volume-up')
    } else if (volume > 0.33) {
      this.icon.classList.add('fa-volume-down')
    } else {
      this.icon.classList.add('fa-volume-off')
    }

    // color is inherited
    this.icon!.style.color = ''
  }

  /**
   * Adjust volume by delta
   */
  adjustVolume(delta: number): void
  {
    const currentVolume = this.getVolume()
    const newVolume = Helpers.clamp(currentVolume + delta, 0, 1)
    this.setVolume(newVolume)
    this.onVolumeChange(newVolume)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.slider?.removeEventListener('mousedown', this.handleSliderMouseDown)
    this.slider?.removeEventListener('input', this.handleSliderInput)
    this.button.removeEventListener('click', this.handleButtonClick)

    if (this.config.showSliderOnHover) {
      this.button.removeEventListener('mouseenter', this.handleMouseEnter)
      this.button.removeEventListener('mouseleave', this.handleMouseLeave)
    }

    document.removeEventListener('mouseup', this.handleGlobalMouseUp)
  }
}
