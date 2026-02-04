import { Helpers } from '@/core/utils/helpers'
import { VolumeControlComponent } from '@/modules/ui/web-components'

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
  private component: VolumeControlComponent
  private config: Required<VolumeControllerConfig>

  private readonly onVolumeChange: (volume: number) => void
  private readonly onMuteToggle: () => void

  constructor(
    component: VolumeControlComponent,
    callbacks: {
      onVolumeChange: (volume: number) => void;
      onMuteToggle: () => void;
    },
    config: VolumeControllerConfig = {}
  ) {
    this.component = component
    this.onVolumeChange = callbacks.onVolumeChange
    this.onMuteToggle = callbacks.onMuteToggle

    this.config = {
      min: config.min ?? 0,
      max: config.max ?? 1,
      step: config.step ?? 0.01,
      showSliderOnHover: config.showSliderOnHover ?? true
    }

    this.bindEventListeners()
  }

  /**
   * Bind event listeners
   */
  private bindEventListeners(): void
  {
    this.component.addEventListener('volumechange', (event: any) => {
      this.onVolumeChange(event.detail.volume)
    })

    this.component.addEventListener('mutetoggle', () => {
      this.onMuteToggle()
    })
  }

  // Public API

  /**
   * Set volume and update UI
   */
  setVolume(volume: number): void
  {
    this.component.setVolume(volume)
  }

  /**
   * Get current volume level
   */
  getVolume(): number
  {
    return this.component.getVolume()
  }

  /**
   * Update volume icon based on volume level
   */
  updateIcon(volume: number, muted: boolean): void
  {
    this.component.updateIcon(volume, muted)
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
    // Event listeners are managed by the component itself
  }
}
