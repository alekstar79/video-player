import { TimelineComponent } from '@/modules/ui/web-components'

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
  private component: TimelineComponent

  private readonly onSeek: (time: number) => void
  private readonly onHover?: (time: number) => void

  constructor(
    component: TimelineComponent,
    onSeek: (time: number) => void,
    onHover?: (time: number) => void
  ) {
    this.component = component
    this.onSeek = onSeek
    this.onHover = onHover

    this.bindEventListeners()
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    this.component.addEventListener('seek', (event: any) => {
      this.onSeek(event.detail.time)
    })

    if (this.onHover) {
      this.component.addEventListener('hover', (event: any) => {
        this.onHover!(event.detail.time)
      })
    }
  }

  // Public API

  /**
   * Update progress bar position
   */
  updateProgress(currentTime: number, duration: number): void
  {
    this.component.updateProgress(currentTime, duration)
  }

  /**
   * Set video duration for calculations
   */
  setDuration(duration: number): void
  {
    this.component.setDuration(duration)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    // Event listeners are managed by the component itself
  }
}
