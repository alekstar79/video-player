import { Helpers } from '@/core/utils/helpers'

/**
 * Time display UI component
 */
export class TimeDisplay {
  private readonly container: HTMLElement

  constructor(container: HTMLElement)
  {
    this.container = container
    this.render()
  }

  /**
   * Render time display HTML
   */
  private render(): void
  {
    this.container.innerHTML = `0:00 / 0:00`
  }

  /**
   * Update time display
   */
  update(currentTime: number, duration: number): void
  {
    this.container.textContent = `${Helpers.formatTime(currentTime)} / ${Helpers.formatTime(duration)}`
  }
}
