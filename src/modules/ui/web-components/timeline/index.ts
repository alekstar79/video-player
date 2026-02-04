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

    this.progressBar = this.getElement('.j-line-current')!
    this.hoverBar = this.getElement('.j-line-ghost')!
    this.hint = this.getElement('.j-hint')!

    /**
     * TS2769: No overload matches this call.
     * Overload 1 of 2,
     * (type: "slotchange", listener: (this: ShadowRoot, ev: Event) => any, options?: boolean | AddEventListenerOptions | undefined): void
     * , gave the following error.
     * Argument of type "mousedown" is not assignable to parameter of type "slotchange"
     * Overload 2 of 2,
     * (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void
     * , gave the following error.
     * Argument of type (event: MouseEvent) => void is not assignable to parameter of type EventListenerOrEventListenerObject
     * Type (event: MouseEvent) => void is not assignable to type EventListener
     * Types of parameters event and evt are incompatible.
     * Type Event is missing the following properties from type MouseEvent: altKey, button, buttons, clientX, and 23 more.
     */
    // @ts-ignore
    this.shadowRoot!.addEventListener('mousedown', this.handleMouseDown.bind(this))
    // @ts-ignore
    this.shadowRoot!.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.shadowRoot!.addEventListener('mouseleave', this.hideHoverPreview.bind(this))
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
    this.emit('hover', percent * this.duration)
  }

  private seekToEventPosition(event: MouseEvent): void
  {
    const percent = this.calculatePercentFromEvent(event)
    this.emit('seek', percent * this.duration)
  }

  private calculatePercentFromEvent(event: MouseEvent): number
  {
    const rect = this.shadowRoot!.querySelector('.player__lines')!.getBoundingClientRect()
    const percent = (event.clientX - rect.left) / rect.width

    return Helpers.clamp(percent, 0, 1)
  }

  private updateHoverPreview(event: MouseEvent, percent: number): void
  {
    const rect = this.shadowRoot!.querySelector('.player__lines')!.getBoundingClientRect()
    const position = event.clientX - rect.left

    this.hoverBar.style.width = `${position}px`

    const time = percent * this.duration
    this.hint.textContent = Helpers.formatTime(time)

    const hintWidth = this.hint.offsetWidth
    let leftPosition = position - (hintWidth / 2)

    leftPosition = Math.max(0, Math.min(leftPosition, rect.width - hintWidth))

    this.hint.style.left = `${leftPosition}px`
    this.hint.style.opacity = '1'
  }

  private hideHoverPreview(): void
  {
    this.hoverBar.style.width = '0'
    this.hint.style.opacity = '0'
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
