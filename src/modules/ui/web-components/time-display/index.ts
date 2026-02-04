import { BaseComponent } from '../BaseComponent'
import { Helpers } from '@/core/utils/helpers'

import template from './template.html?raw'
import styles from './style.scss?inline'

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
