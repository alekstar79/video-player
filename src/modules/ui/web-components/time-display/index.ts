import { BaseComponent } from '../BaseComponent'
import { Helpers } from '@/core/utils/helpers'
import styles from './style.scss?raw'

const template = `<span class="j-duration">0:00 / 0:00</span>`

export default class TimeDisplayComponent extends BaseComponent
{
  private timeElement: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.timeElement = this.getElement('.j-duration')!
  }

  public update(currentTime: number, duration: number): void
  {
    this.timeElement.textContent = `${Helpers.formatTime(currentTime)} / ${Helpers.formatTime(duration)}`
  }
}
