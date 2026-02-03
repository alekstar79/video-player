/**
 * Picture-in-Picture button UI component
 */
export class PipButton {
  private readonly container: HTMLElement
  private readonly onPipToggle: () => void

  private button!: HTMLElement

  constructor(container: HTMLElement, onPipToggle: () => void)
  {
    this.container = container
    this.onPipToggle = onPipToggle

    this.render()
    this.initializeElements()
    this.bindEvents()
  }

  /**
   * Render pip button HTML
   */
  private render(): void
  {
    this.container.innerHTML = `
      <button class="player__panel-button pip-button" title="Picture in picture">
        <span class="material-icons">picture_in_picture_alt</span>
      </button>`
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void
  {
    this.button = this.container.querySelector('.pip-button') as HTMLElement
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void
  {
    this.button.addEventListener('click', this.onPipToggle)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.button.removeEventListener('click', this.onPipToggle)
  }
}
