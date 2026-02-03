import { Helpers } from '@/core/utils/helpers'

/**
 * Timeline control configuration
 */
export interface TimelineControllerConfig {
  showHoverPreview?: boolean
  showTimeHint?: boolean
}

/**
 * Controller for video timeline and seeking
 */
export class TimelineController
{
  private container: HTMLElement
  private progressBar!: HTMLElement
  private hoverBar!: HTMLElement
  private hint!: HTMLElement
  private config: Required<TimelineControllerConfig>

  private readonly onSeek: (time: number) => void
  private readonly onHover?: (time: number) => void

  private isRightMouseDown: boolean = false
  private isDragging: boolean = false
  private duration: number = 0

  constructor(
    container: HTMLElement,
    onSeek: (time: number) => void,
    onHover?: (time: number) => void,
    config: TimelineControllerConfig = {}
  ) {
    this.container = container
    this.onSeek = onSeek
    this.onHover = onHover

    this.config = {
      showHoverPreview: config.showHoverPreview ?? true,
      showTimeHint: config.showTimeHint ?? true
    }

    this.initializeElements()
    this.bindEventListeners()
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void
  {
    this.progressBar = this.container.querySelector('.j-line-current') as HTMLElement
    this.hoverBar = this.container.querySelector('.j-line-ghost') as HTMLElement
    this.hint = this.container.querySelector('.j-hint') as HTMLElement

    if (!this.progressBar) {
      console.error('Timeline progress element not found')
      throw new Error('Timeline progress element not found')
    }

    if (this.config.showHoverPreview && !this.hoverBar) {
      console.warn('Hover bar element not found, hover preview disabled')
      this.config.showHoverPreview = false
    }

    if (this.config.showTimeHint && !this.hint) {
      console.warn('Hint element not found, time hint disabled')
      this.config.showTimeHint = false
    }
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    this.handleContextMenu = this.handleContextMenu.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)

    this.handleDocumentContextMenu = this.handleDocumentContextMenu.bind(this)
    this.handleDocumentMouseMove = this.handleDocumentMouseMove.bind(this)
    this.handleDocumentMouseUp = this.handleDocumentMouseUp.bind(this)

    this.container.addEventListener('contextmenu', this.handleContextMenu)
    this.container.addEventListener('mousedown', this.handleMouseDown)
    this.container.addEventListener('mousemove', this.handleMouseMove)

    // Global mouse events for dragging
    document.addEventListener('contextmenu', this.handleDocumentContextMenu)
    document.addEventListener('mousemove', this.handleDocumentMouseMove)
    document.addEventListener('mouseup', this.handleDocumentMouseUp)
  }

  private handleMouseDown(event: MouseEvent): void
  {
    // Ignore the right mouse button
    if (event.button === 2) {
      this.isRightMouseDown = true
      return
    }

    event.preventDefault()
    this.isDragging = true
    this.seekToEventPosition(event)
  }

  private handleMouseMove(event: MouseEvent): void
  {
    if (this.isRightMouseDown) return

    if (!this.config.showHoverPreview) return

    const percent = this.calculatePercentFromEvent(event)
    const time = percent * this.duration

    this.updateHoverPreview(event, percent)

    if (this.onHover) {
      this.onHover(time)
    }
  }

  private handleDocumentMouseMove(event: MouseEvent): void
  {
    if (this.isRightMouseDown) return

    if (this.isDragging) {
      this.seekToEventPosition(event)
      this.updateHoverPreview(event, this.calculatePercentFromEvent(event))
    }
  }

  private handleDocumentMouseUp(event: MouseEvent): void
  {
    if (event.button === 2) {
      this.isRightMouseDown = false
    }

    this.isDragging = false
    this.hideHoverPreview()
  }

  private handleContextMenu(event: MouseEvent): void
  {
    // Prevent the context menu on the timeline if necessary
    event.preventDefault()
  }

  private handleDocumentContextMenu(): void
  {
    // Reset the right-click flag when opening the context menu
    this.isRightMouseDown = false
  }

  private seekToEventPosition(event: MouseEvent): void
  {
    const percent = this.calculatePercentFromEvent(event)
    const time = percent * this.duration

    this.onSeek(time)
  }

  private calculatePercentFromEvent(event: MouseEvent): number
  {
    const rect = this.container.getBoundingClientRect()
    const percent = (event.clientX - rect.left) / rect.width

    return Helpers.clamp(percent, 0, 1)
  }

  private updateHoverPreview(event: MouseEvent, percent: number): void
  {
    if (!this.config.showHoverPreview) return

    const rect = this.container.getBoundingClientRect()
    const position = event.clientX - rect.left

    if (this.hoverBar) {
      this.hoverBar.style.width = `${position}px`
    }

    if (this.config.showTimeHint && this.hint) {
      const time = percent * this.duration
      this.hint.textContent = Helpers.formatTime(time)

      // Position hint relative to cursor, but keep it within timeline bounds
      const hintWidth = this.hint.offsetWidth
      let leftPosition = position - (hintWidth / 2)

      // Keep hint within timeline bounds
      leftPosition = Math.max(0, Math.min(leftPosition, rect.width - hintWidth))

      this.hint.style.left = `${leftPosition}px`
      this.hint.style.opacity = '1'
    }
  }

  private hideHoverPreview(): void
  {
    if (this.hoverBar) {
      this.hoverBar.style.width = '0'
    }

    if (this.hint) {
      this.hint.style.opacity = '0'
    }
  }

  // Public API

  /**
   * Update progress bar position
   */
  updateProgress(currentTime: number, duration: number): void
  {
    this.duration = duration

    this.progressBar.style.width = `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
  }

  /**
   * Set video duration for calculations
   */
  setDuration(duration: number): void
  {
    this.duration = duration
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    this.container.removeEventListener('contextmenu', this.handleContextMenu)
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    this.container.removeEventListener('mousemove', this.handleMouseMove)

    document.removeEventListener('contextmenu', this.handleDocumentContextMenu)
    document.removeEventListener('mousemove', this.handleDocumentMouseMove)
    document.removeEventListener('mouseup', this.handleDocumentMouseUp)
  }
}
