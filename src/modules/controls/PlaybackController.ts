import { SpeedOptionsComponent } from '@/modules/ui/web-components'

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
  private component: SpeedOptionsComponent
  private config: Required<PlaybackControllerConfig>
  private readonly onSpeedChange: (speed: number) => void

  constructor(
    component: SpeedOptionsComponent,
    onSpeedChange: (speed: number) => void,
    config: Partial<PlaybackControllerConfig> = {}
  ) {
    this.component = component
    this.onSpeedChange = onSpeedChange

    this.config = {
      speeds: config.speeds || [0.5, 0.75, 1, 1.25, 1.5, 2],
      defaultSpeed: config.defaultSpeed || 1
    }

    this.bindEventListeners()
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    this.component.addEventListener('speedchange', (event: any) => {
      this.setSpeed(event.detail.speed)
    })
  }

  // Public API

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void
  {
    const validSpeed = this.config.speeds.includes(speed) ? speed : this.config.defaultSpeed

    this.onSpeedChange(validSpeed)
    this.component.updateActiveOption?.(validSpeed)
  }

  /**
   * Clean up event listeners
   */
  destroy(): void
  {
    // Event listeners are managed by the component itself
  }
}
