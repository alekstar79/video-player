import { BaseComponent } from '../BaseComponent'
import { Helpers } from '@/core/utils/helpers'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class TimelineComponent extends BaseComponent
{
  private progressBar: HTMLElement
  private hoverBar: HTMLElement
  private hint: HTMLElement
  private duration: number = 0

  constructor()
  {
    super()
    this.render(template, styles)

    this.progressBar = this.shadow.querySelector('.j-line-current')!
    this.hoverBar = this.shadow.querySelector('.j-line-ghost')!
    this.hint = this.shadow.querySelector('.j-hint')!

    this.shadow.addEventListener('mousedown', this.handleMouseDown.bind(this) as EventListener)
    this.shadow.addEventListener('mousemove', this.handleMouseMove.bind(this) as EventListener)
  }

  private handleMouseDown(event: MouseEvent): void
  {
    if (event.button === 2) return

    event.preventDefault()
    this.seekToEventPosition(event)
  }

  private handleMouseMove(event: MouseEvent): void
  {
    const percent = this.calculatePercentFromEvent(event)
    this.updateHoverPreview(event, percent)
    this.emit('hover', { time: percent * this.duration })
  }

  private seekToEventPosition(event: MouseEvent): void
  {
    const percent = this.calculatePercentFromEvent(event)
    this.emit('seek', { time: percent * this.duration })
  }

  private calculatePercentFromEvent(event: MouseEvent): number
  {
    const rect = this.shadow.querySelector('.player__lines')!.getBoundingClientRect()
    const percent = (event.clientX - rect.left) / rect.width

    return Helpers.clamp(percent, 0, 1)
  }

  private updateHoverPreview(event: MouseEvent, percent: number): void
  {
    const rect = this.shadow.querySelector('.player__lines')!.getBoundingClientRect()
    const position = event.clientX - rect.left

    this.hoverBar.style.width = `${position}px`

    const time = percent * this.duration
    this.hint.textContent = Helpers.formatTime(time)

    const hintWidth = this.hint.offsetWidth
    let leftPosition = position - (hintWidth / 2)

    leftPosition = Math.max(0, Math.min(leftPosition, rect.width - hintWidth))

    this.hint.style.left = `${leftPosition}px`
  }

  public updateProgress(currentTime: number, duration: number): void
  {
    this.duration = duration
    this.progressBar.style.width = `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
  }

  public setDuration(duration: number): void
  {
    this.duration = duration
  }
}
