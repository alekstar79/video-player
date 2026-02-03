/**
 * Speed options UI component
 */
export class SpeedOptions
{
  private readonly container: HTMLElement
  private readonly onSpeedChange: (speed: number) => void

  private currentSpeed: number
  private speeds: number[]

  constructor(
    container: HTMLElement,
    onSpeedChange: (speed: number) => void,
    speeds: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    initialSpeed: number = 1
  ) {
    this.container = container
    this.onSpeedChange = onSpeedChange
    this.speeds = speeds
    this.currentSpeed = initialSpeed
    this.render()
    this.bindEvents()
  }

  /**
   * Render speed options HTML
   */
  private render(): void
  {
    this.container.innerHTML = `
      <div class="speed-options-container">
        ${this.speeds.map(speed => `
          <div
            class="speed-option ${speed === this.currentSpeed ? 'active' : ''}" 
            data-speed="${speed}"
           >
             ${speed === 1 ? 'Normal' : `${speed}x`}
          </div>
        `).join('')}
      </div>`
  }

  get element()
  {
    return this.container
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void
  {
    this.container.addEventListener('click', (event) => {
      const target = event.target as HTMLElement

      if (target.classList.contains('speed-option')) {
        this.setSpeed(parseFloat(target.dataset.speed || '1'))
      }
    })
  }

  /**
   * Set current speed and update UI
   */
  setSpeed(speed: number): void
  {
    if (!this.speeds.includes(speed)) return

    this.currentSpeed = speed
    this.onSpeedChange(speed)
    this.updateActiveOption()
  }

  /**
   * Update active option in UI
   */
  private updateActiveOption(): void
  {
    this.container.querySelectorAll<HTMLElement>('.speed-option').forEach(option => {
      option.classList.toggle('active', parseFloat(option.dataset.speed || '1') === this.currentSpeed)
    })
  }

  /**
   * Show speed options
   */
  show(): void
  {
    this.container.classList.add('show')
  }

  /**
   * Hide speed options
   */
  hide(): void
  {
    this.container.classList.remove('show')
  }

  /**
   * Toggle visibility
   */
  toggle(): void
  {
    this.container.classList.toggle('show')
  }

  /**
   * Check if options are visible
   */
  isVisible(): boolean
  {
    return this.container.classList.contains('show')
  }

  /**
   * Get current speed
   */
  getCurrentSpeed(): number
  {
    return this.currentSpeed
  }
}
