import { BaseComponent } from '../BaseComponent'

import template from './template.html?raw'
import styles from './style.scss?inline'

export default class FullscreenButtonComponent extends BaseComponent
{
  private button: HTMLElement
  private icon: HTMLElement

  constructor()
  {
    super()
    this.render(template, styles)
    this.button = this.getElement('.j-fullscreen')!
    this.icon = this.getElement('.fas')!

    this.button.addEventListener('click', () => {
      this.emit('togglefullscreen')
    })
  }

  public setFullscreen(isFullscreen: boolean): void
  {
    this.icon.className = isFullscreen
      ? 'fas fa-compress'
      : 'fas fa-expand'
  }
}
