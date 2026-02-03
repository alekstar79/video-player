/**
 * Source navigation buttons UI component
 */
export class SourceNavigation
{
  private readonly container: HTMLElement

  private readonly onPrev: () => void
  private readonly onNext: () => void

  private prevButton!: HTMLElement
  private nextButton!: HTMLElement

  constructor(
    container: HTMLElement,
    callbacks: {
      onPrev: () => void
      onNext: () => void
    }
  ) {
    this.container = container

    this.onPrev = callbacks.onPrev
    this.onNext = callbacks.onNext

    this.render()
    this.initializeElements()
    this.bindEvents()
  }

  /**
   * Render source navigation buttons HTML
   */
  private render(): void
  {
    this.container.innerHTML = `
      <button class="player__source-nav player__source-nav--prev" title="Previous source">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="player__source-nav player__source-nav--next" title="Next source">
        <i class="fas fa-chevron-right"></i>
      </button>`
  }

  /**
   * Initialize DOM element references
   */
  private initializeElements(): void
  {
    this.prevButton = this.container.querySelector('.player__source-nav--prev') as HTMLElement
    this.nextButton = this.container.querySelector('.player__source-nav--next') as HTMLElement
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void
  {
    this.prevButton.addEventListener('click', this.onPrev)
    this.nextButton.addEventListener('click', this.onNext)
  }

  /**
   * Update visibility of navigation buttons
   */
  update(hasMultipleSources: boolean): void
  {
    this.container.style.display = hasMultipleSources ? '' : 'none'
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.prevButton.removeEventListener('click', this.onPrev)
    this.nextButton.removeEventListener('click', this.onNext)
  }
}
