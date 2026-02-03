/**
 * Timeline UI component
 */
export class Timeline
{
  private readonly container: HTMLElement

  constructor(container: HTMLElement)
  {
    this.container = container
    this.render()
  }

  /**
   * Render timeline HTML structure
   */
  private render(): void
  {
    this.container.innerHTML = `
      <div class="timeline-container">
        <div class="timeline-hint"></div>
        <div class="timeline-progress"></div>
        <div class="timeline-hover"></div>
        <div class="timeline-background"></div>
      </div>`
  }

  /**
   * Get the timeline container element
   */
  get element(): HTMLElement
  {
    return this.container
  }

  /**
   * Update progress display
   */
  updateProgress(progress: number): void
  {
    const progressElement = this.container.querySelector<HTMLElement>('.timeline-progress')
    if (progressElement) {
      progressElement.style.width = `${progress * 100}%`
    }
  }

  /**
   * Update hover preview
   */
  updateHoverPreview(progress: number, timeText: string): void
  {
    const hoverElement = this.container.querySelector<HTMLElement>('.timeline-hover')
    const hintElement = this.container.querySelector<HTMLElement>('.timeline-hint')

    if (hoverElement) {
      hoverElement.style.width = `${progress * 100}%`
    }

    if (hintElement && timeText) {
      hintElement.textContent = timeText
      hintElement.style.left = `calc(${progress * 100}% - ${hintElement.offsetWidth / 2}px)`
    }
  }

  /**
   * Show hover elements
   */
  showHover(): void
  {
    const hoverElement = this.container.querySelector<HTMLElement>('.timeline-hover')
    const hintElement = this.container.querySelector<HTMLElement>('.timeline-hint')

    if (hoverElement) hoverElement.style.opacity = '1'
    if (hintElement) hintElement.style.opacity = '1'
  }

  /**
   * Hide hover elements
   */
  hideHover(): void {
    const hoverElement = this.container.querySelector<HTMLElement>('.timeline-hover')
    const hintElement = this.container.querySelector<HTMLElement>('.timeline-hint')

    if (hoverElement) hoverElement.style.opacity = '0'
    if (hintElement) hintElement.style.opacity = '0'
  }
}
