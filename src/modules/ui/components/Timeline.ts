/**
 * UI component for timeline (view).
 */
export class Timeline
{
  public readonly element: HTMLElement

  private progressElement!: HTMLElement
  private hoverElement!: HTMLElement
  private hintElement!: HTMLElement

  constructor(container: HTMLElement)
  {
    this.element = container
    this.render()
    this.initializeElements()
    this.bindEvents()
  }

  private render(): void
  {
    this.element.innerHTML = `
      <div class="player__hint"></div>
      <div class="player__line player__line--current"></div>
      <div class="player__line player__line--ghost"></div>
      <div class="player__line player__line--full"></div>`
  }

  private initializeElements(): void
  {
    this.progressElement = this.element.querySelector('.player__line--current') as HTMLElement
    this.hoverElement = this.element.querySelector('.player__line--ghost') as HTMLElement
    this.hintElement = this.element.querySelector('.player__hint') as HTMLElement
  }

  private handleSeek(e: MouseEvent): void
  {
    const progress = this.calculateProgress(e)
    this.element.dispatchEvent(new CustomEvent('timeline-seek', { detail: { progress } }))
  }

  private handleHover(e: MouseEvent): void
  {
    const progress = this.calculateProgress(e)
    this.element.dispatchEvent(new CustomEvent('timeline-hover', { detail: { progress } }))
  }

  private bindEvents(): void
  {
    this.handleSeek = this.handleSeek.bind(this)
    this.handleHover = this.handleHover.bind(this)

    this.element.addEventListener('mousedown', this.handleSeek)
    this.element.addEventListener('mousemove', this.handleHover)
  }

  private calculateProgress(event: MouseEvent): number
  {
    const rect = this.element.getBoundingClientRect()
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  }

  public updateProgress(progress: number): void
  {
    if (this.progressElement) {
      this.progressElement.style.width = `${progress * 100}%`
    }
  }

  public updateHoverPreview(progress: number, timeText: string): void
  {
    if (this.hoverElement) {
      this.hoverElement.style.width = `${progress * 100}%`
    }
    if (this.hintElement) {
      this.hintElement.textContent = timeText
      this.hintElement.style.left = `calc(${progress * 100}% - ${this.hintElement.offsetWidth / 2}px)`
    }
  }

  public destroy(): void
  {
    this.element.removeEventListener('mousedown', this.handleSeek)
    this.element.removeEventListener('mousemove', this.handleHover)
  }
}
