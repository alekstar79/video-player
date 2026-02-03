/**
 * UI component for volume control (view).
 */
export class VolumeControl {
  private readonly container: HTMLElement

  private readonly onVolumeChange: (volume: number) => void
  private readonly onMuteToggle: () => void

  private volumeSlider!: HTMLInputElement
  private volumeButton!: HTMLElement
  private volumeIcon!: HTMLElement

  constructor(
    container: HTMLElement,
    callbacks: {
      onVolumeChange: (volume: number) => void
      onMuteToggle: () => void
    }
  ) {
    this.container = container
    this.onVolumeChange = callbacks.onVolumeChange
    this.onMuteToggle = callbacks.onMuteToggle

    this.render()
    this.initializeElements()
    this.bindEvents()
  }

  private render(): void
  {
    this.container.innerHTML = `
      <button class="player__panel-button volume-button" title="Mute/Unmute">
        <em class="fas fa-volume-up player__volume-icon"></em>
      </button>
      <input type="range" class="player__volume j-volume-input" min="0" max="1" step="0.01" value="1">`
  }

  private initializeElements(): void
  {
    this.volumeButton = this.container.querySelector('.volume-button') as HTMLElement
    this.volumeSlider = this.container.querySelector('.j-volume-input') as HTMLInputElement
    this.volumeIcon = this.volumeButton.querySelector('em') as HTMLElement
  }

  private handleSliderMute(): void
  {
    this.onMuteToggle()
  }

  private handleSliderInput(): void
  {
    this.onVolumeChange(this.volumeSlider.valueAsNumber)
  }

  private bindEvents(): void
  {
    this.handleSliderMute = this.handleSliderMute.bind(this)
    this.handleSliderInput = this.handleSliderInput.bind(this)

    this.volumeButton.addEventListener('click', this.handleSliderMute)
    this.volumeSlider.addEventListener('input', this.handleSliderInput)
  }

  public update(volume: number, isMuted: boolean): void
  {
    this.volumeSlider.value = isMuted ? '0' : String(volume)

    if (isMuted || volume === 0) {
      this.volumeIcon.className = 'fas fa-volume-mute player__volume-icon'
    } else if (volume < 0.5) {
      this.volumeIcon.className = 'fas fa-volume-down player__volume-icon'
    } else {
      this.volumeIcon.className = 'fas fa-volume-up player__volume-icon'
    }
  }

  public destroy(): void
  {
    this.volumeButton.removeEventListener('click', this.handleSliderMute)
    this.volumeSlider.removeEventListener('input', this.handleSliderInput)
  }
}
