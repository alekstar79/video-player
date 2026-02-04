import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class PlayPauseButtonComponent extends BaseComponent
{
  private button: HTMLElement
  private icon: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.shadow.querySelector('.j-toggle-video')!
    this.icon = this.shadow.querySelector('.fas')!

    this.button.addEventListener('click', () => {
      this.emit('click')
    })
  }

  public setPaused(paused: boolean): void
  {
    this.icon.className = `fas ${paused ? 'fa-play' : 'fa-pause'}`
  }
}
